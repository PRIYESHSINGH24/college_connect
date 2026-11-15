-- Campus-owned directories are scoped to the active institution; global records may opt out with NULL organization_id.
drop policy if exists "clubs visible" on public.clubs;
create policy "clubs scoped to organization" on public.clubs for select to authenticated
using (organization_id is null or public.is_org_member(organization_id));
drop policy if exists "club creator manages" on public.clubs;
create policy "club creator manages authorized organization" on public.clubs for insert to authenticated
with check (created_by=auth.uid() and (organization_id is null or public.has_org_role(organization_id,array['club_admin','college_admin','super_admin'])));
create policy "club creator updates authorized organization" on public.clubs for update to authenticated
using (created_by=auth.uid())
with check (created_by=auth.uid() and (organization_id is null or public.has_org_role(organization_id,array['club_admin','college_admin','super_admin'])));
create policy "club creator deletes own club" on public.clubs for delete to authenticated using (created_by=auth.uid());

drop policy if exists "events published readable" on public.events;
create policy "events scoped to organization" on public.events for select to authenticated
using ((organization_id is null or public.is_org_member(organization_id)) and (status='published' or created_by=auth.uid()));
drop policy if exists "event creator manages" on public.events;
create policy "event creator manages authorized organization" on public.events for insert to authenticated
with check (created_by=auth.uid() and (organization_id is null or public.has_org_role(organization_id,array['club_admin','college_admin','super_admin'])));
create policy "event creator updates authorized organization" on public.events for update to authenticated
using (created_by=auth.uid())
with check (created_by=auth.uid() and (organization_id is null or public.has_org_role(organization_id,array['club_admin','college_admin','super_admin'])));
create policy "event creator deletes own event" on public.events for delete to authenticated using (created_by=auth.uid());

drop policy if exists "opportunities published readable" on public.opportunities;
create policy "opportunities scoped to organization" on public.opportunities for select to authenticated
using ((organization_id is null or public.is_org_member(organization_id)) and (status='published' or publisher_id=auth.uid()));

drop policy if exists "join club as self" on public.club_memberships;
create policy "join readable club as self" on public.club_memberships for insert to authenticated
with check (user_id=auth.uid() and role='member' and exists(select 1 from public.clubs c where c.id=club_id and (c.organization_id is null or public.is_org_member(c.organization_id))));

-- Respect blocks in feed visibility and prevent private interactions across a block.
drop policy if exists "posts readable by visibility" on public.posts;
create policy "posts readable by visibility" on public.posts for select to authenticated using (
  not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=author_id) or (b.blocker_id=author_id and b.blocked_id=auth.uid()))
  and (author_id=auth.uid() or visibility='public' or (visibility='campus' and organization_id is not null and public.is_org_member(organization_id)) or
  (visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=author_id)))
);

create or replace function public.guard_message_participants()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if exists(
    select 1 from public.conversation_members cm
    join public.blocks b on (b.blocker_id=new.sender_id and b.blocked_id=cm.user_id) or (b.blocker_id=cm.user_id and b.blocked_id=new.sender_id)
    where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id
  ) then raise exception 'messaging_blocked'; end if;
  return new;
end; $$;
create trigger guard_message_before_insert before insert on public.messages
for each row execute procedure public.guard_message_participants();

-- Users can mark only the read flag on their own notification rows.
revoke update on public.notifications from authenticated;
grant update(is_read) on public.notifications to authenticated;
