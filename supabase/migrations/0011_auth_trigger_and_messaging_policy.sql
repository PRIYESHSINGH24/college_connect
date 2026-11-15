-- Make the verified-membership trigger safe on both INSERT and UPDATE events.
create or replace function public.sync_verified_membership_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status='verified' then
    update public.profiles set organization_id=new.organization_id where id=new.user_id;
  elsif tg_op='UPDATE' then
    if old.status='verified' and new.status in ('rejected','suspended') then
      update public.profiles set organization_id=null
      where id=new.user_id and organization_id=new.organization_id;
    end if;
  end if;
  return new;
end;
$$;

-- Messaging creation checks both directions of the block relationship without exposing
-- arbitrary users' private block lists to a caller.
create or replace function public.can_message_user(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and auth.uid() <> p_target_user_id
    and not public.is_blocked_between(auth.uid(), p_target_user_id);
$$;
revoke all on function public.can_message_user(uuid) from public, anon;
grant execute on function public.can_message_user(uuid) to authenticated;

-- Helper is used by RLS predicates and SECURITY DEFINER routines; keep it unavailable to anonymous callers.
revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;
