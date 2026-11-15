alter table public.posts add column if not exists like_count integer not null default 0 check (like_count >= 0);
alter table public.posts add column if not exists comment_count integer not null default 0 check (comment_count >= 0);

create or replace function public.maintain_post_like_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.posts set like_count=like_count+1 where id=new.post_id;
    return new;
  elsif tg_op='DELETE' then
    update public.posts set like_count=greatest(0,like_count-1) where id=old.post_id;
    return old;
  end if;
  return null;
end; $$;
create trigger maintain_post_like_count_after_change
after insert or delete on public.post_likes for each row execute procedure public.maintain_post_like_count();

create or replace function public.maintain_post_comment_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.posts set comment_count=comment_count+1 where id=new.post_id;
    return new;
  elsif tg_op='DELETE' then
    update public.posts set comment_count=greatest(0,comment_count-1) where id=old.post_id;
    return old;
  end if;
  return null;
end; $$;
create trigger maintain_post_comment_count_after_change
after insert or delete on public.comments for each row execute procedure public.maintain_post_comment_count();

-- Counter backfill for databases upgraded after social data already exists.
update public.posts p set like_count=(select count(*) from public.post_likes l where l.post_id=p.id),
  comment_count=(select count(*) from public.comments c where c.post_id=p.id);

create index if not exists project_members_user_idx on public.project_members(user_id,project_id);
create index if not exists follows_following_idx on public.follows(following_id,follower_id);
create index if not exists memberships_user_status_idx on public.organization_memberships(user_id,status);
create index if not exists messages_sender_idx on public.messages(sender_id,created_at desc);
