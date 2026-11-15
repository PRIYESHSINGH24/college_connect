create or replace function public.is_blocked_between(user_a uuid, user_b uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.blocks b where (b.blocker_id=user_a and b.blocked_id=user_b) or (b.blocker_id=user_b and b.blocked_id=user_a));
$$;

create or replace function public.is_club_manager(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.club_memberships m where m.club_id=cid and m.user_id=auth.uid() and m.role in ('lead','admin') and m.status='active');
$$;
drop policy if exists "club membership visible to self or managers" on public.club_memberships;
create policy "club membership visible to self or managers" on public.club_memberships for select to authenticated
using (user_id=auth.uid() or public.is_club_manager(club_id));

-- Replace predicates that queried blocks under the blocker's private RLS policy.
drop policy if exists "follow as self" on public.follows;
create policy "follow as self" on public.follows for insert to authenticated
with check (follower_id=auth.uid() and not public.is_blocked_between(follower_id,following_id));
drop policy if exists "posts readable by visibility" on public.posts;
create policy "posts readable by visibility" on public.posts for select to authenticated using (
  not public.is_blocked_between(auth.uid(),author_id)
  and (author_id=auth.uid() or visibility='public' or (visibility='campus' and organization_id is not null and public.is_org_member(organization_id)) or
  (visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=author_id)))
);
drop policy if exists "profiles visible by policy" on public.profiles;
create policy "profiles visible by policy" on public.profiles for select to authenticated using (
  id=auth.uid() or (not public.is_blocked_between(auth.uid(),id) and (profile_visibility='public' or (profile_visibility='campus' and organization_id is not null and public.is_org_member(organization_id))))
);
drop policy if exists "projects readable" on public.projects;
create policy "projects readable" on public.projects for select to authenticated using (
  not public.is_blocked_between(auth.uid(),owner_id)
  and (owner_id=auth.uid() or visibility='public' or (visibility='campus' and organization_id is not null and public.is_org_member(organization_id)) or exists(select 1 from public.project_members pm where pm.project_id=id and pm.user_id=auth.uid()))
);

create or replace function public.conversation_allowed(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_conversation_member(cid) and not exists(
    select 1 from public.conversation_members cm
    where cm.conversation_id=cid and cm.user_id<>auth.uid()
      and public.is_blocked_between(auth.uid(),cm.user_id)
  );
$$;
drop policy if exists "conversation members see conversation" on public.conversations;
create policy "conversation members see conversation" on public.conversations for select to authenticated using (public.conversation_allowed(id));
drop policy if exists "members see memberships" on public.conversation_members;
create policy "members see memberships" on public.conversation_members for select to authenticated using (public.conversation_allowed(conversation_id));
drop policy if exists "conversation messages readable" on public.messages;
create policy "conversation messages readable" on public.messages for select to authenticated using (public.conversation_allowed(conversation_id));
drop policy if exists "conversation member sends" on public.messages;
create policy "conversation member sends" on public.messages for insert to authenticated with check (sender_id=auth.uid() and public.conversation_allowed(conversation_id));

create or replace function public.guard_message_participants()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists(
    select 1 from public.conversation_members cm
    where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id
      and public.is_blocked_between(new.sender_id,cm.user_id)
  ) then raise exception 'messaging_blocked'; end if;
  return new;
end; $$;
