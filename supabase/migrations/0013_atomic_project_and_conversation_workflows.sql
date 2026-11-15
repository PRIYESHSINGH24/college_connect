-- Multi-row workflows must be atomic. Calling individual RLS-protected inserts
-- from the client can fail midway (especially conversation creation), so keep
-- authorization checks and writes together in SECURITY DEFINER RPCs.

create or replace function public.apply_to_project(p_project_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_application_id uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if char_length(trim(p_message)) < 10 or char_length(trim(p_message)) > 2000 then
    raise exception 'invalid_message';
  end if;

  select * into v_project from public.projects where id = p_project_id for update;
  if not found or v_project.status <> 'active' or v_project.owner_id = v_user_id
    or v_project.openings <= v_project.accepted_count then
    raise exception 'project_not_accepting_applications';
  end if;
  if exists (select 1 from public.project_members where project_id = p_project_id and user_id = v_user_id) then
    raise exception 'already_project_member';
  end if;

  insert into public.project_applications(project_id, applicant_id, message)
  values (p_project_id, v_user_id, trim(p_message))
  returning id into v_application_id;
  return v_application_id;
end;
$$;

revoke all on function public.apply_to_project(uuid, text) from public, anon;
grant execute on function public.apply_to_project(uuid, text) to authenticated;

create or replace function public.create_direct_conversation(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_target_user_id = v_user_id then raise exception 'cannot_message_self'; end if;
  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'target_not_found';
  end if;
  if public.is_blocked_between(v_user_id, p_target_user_id) then
    raise exception 'messaging_blocked';
  end if;

  select cm.conversation_id into v_conversation_id
  from public.conversation_members cm
  group by cm.conversation_id
  having count(*) = 2
    and bool_or(cm.user_id = v_user_id)
    and bool_or(cm.user_id = p_target_user_id)
  limit 1;
  if v_conversation_id is not null then return v_conversation_id; end if;

  insert into public.conversations(created_by, is_group)
  values (v_user_id, false)
  returning id into v_conversation_id;
  insert into public.conversation_members(conversation_id, user_id)
  values (v_conversation_id, v_user_id), (v_conversation_id, p_target_user_id);
  return v_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
