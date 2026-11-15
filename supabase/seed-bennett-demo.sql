-- Bennett University demo community. Safe to re-run: fixed user IDs and
-- idempotent inserts keep the local presentation database consistent.
do $$
declare
  org_id uuid;
begin
  insert into public.organizations (id, name, slug, website)
  values ('ba100000-0000-4000-8000-000000000001', 'Bennett University', 'bennett-university', 'https://www.bennett.edu.in')
  on conflict (id) do update set name = excluded.name, website = excluded.website
  returning id into org_id;

  insert into public.organization_domains (organization_id, domain)
  values (org_id, 'bennett.edu.in') on conflict do nothing;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current)
  values
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000101','authenticated','authenticated','ananya.sharma@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"ananya_sharma","full_name":"Ananya Sharma"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000102','authenticated','authenticated','arjun.mehta@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"arjun_mehta","full_name":"Arjun Mehta"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000103','authenticated','authenticated','kavya.iyer@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"kavya_iyer","full_name":"Kavya Iyer"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000104','authenticated','authenticated','rohan.verma@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"rohan_verma","full_name":"Rohan Verma"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000105','authenticated','authenticated','meera.nair@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"meera_nair","full_name":"Meera Nair"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000106','authenticated','authenticated','ishaan.kapoor@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"ishaan_kapoor","full_name":"Ishaan Kapoor"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000107','authenticated','authenticated','diya.menon@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"diya_menon","full_name":"Diya Menon"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000108','authenticated','authenticated','vivaan.gupta@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"vivaan_gupta","full_name":"Vivaan Gupta"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000109','authenticated','authenticated','sana.khan@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"sana_khan","full_name":"Sana Khan"}',now(),now(),'','','','',''),
    ('00000000-0000-0000-0000-000000000000','ba100000-0000-4000-8000-000000000110','authenticated','authenticated','aditya.jain@bennett.edu.in',crypt('BennettDemo123!',gen_salt('bf',10)),now(),'{"provider":"email","providers":["email"]}','{"username":"aditya_jain","full_name":"Aditya Jain"}',now(),now(),'','','','','')
  on conflict (id) do nothing;

  insert into auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  select id::text,id,jsonb_build_object('sub',id::text,'email',email,'email_verified',true),'email',created_at,created_at,created_at
  from auth.users where id::text like 'ba100000-0000-4000-8000-0000000001%'
  on conflict (provider_id,provider) do nothing;

  insert into public.organization_memberships (organization_id,user_id,role,status,verified_at)
  select org_id,id,'student','verified',now() from auth.users
  where id::text like 'ba100000-0000-4000-8000-0000000001%'
  on conflict (organization_id,user_id) do update set status='verified', verified_at=excluded.verified_at;

  update public.profiles set organization_id=org_id, course='B.Tech', department='Computer Science', graduation_year=2027,
    profile_visibility='campus', portfolio_visibility='public', collaboration_available=true
  where id::text like 'ba100000-0000-4000-8000-0000000001%';

  update public.profiles set headline='Frontend engineer · React and design systems', skills='{React,TypeScript,Figma}', interests='{product design,web accessibility}' where username='ananya_sharma';
  update public.profiles set headline='Backend builder · APIs and data systems', skills='{Node.js,PostgreSQL,Docker}', interests='{backend,open source}' where username='arjun_mehta';
  update public.profiles set headline='AI enthusiast · NLP and machine learning', skills='{Python,PyTorch,NLP}', interests='{AI,research}' where username='kavya_iyer';
  update public.profiles set headline='Mobile developer · Android and Flutter', skills='{Flutter,Dart,Firebase}', interests='{mobile apps,startups}' where username='rohan_verma';
  update public.profiles set headline='Product thinker · Community and growth', skills='{Product,Research,Notion}', interests='{communities,entrepreneurship}' where username='meera_nair';
  update public.profiles set headline='Cloud and DevOps learner', skills='{AWS,Linux,CI/CD}', interests='{cloud,systems}' where username='ishaan_kapoor';
  update public.profiles set headline='UI engineer · Accessible interfaces', skills='{CSS,React,UX}', interests='{design,accessibility}' where username='diya_menon';
  update public.profiles set headline='Data analyst · Insights and visualisation', skills='{Python,SQL,Power BI}', interests='{data,analytics}' where username='vivaan_gupta';
  update public.profiles set headline='Cybersecurity learner · CTF player', skills='{Python,Linux,Security}', interests='{security,CTF}' where username='sana_khan';
  update public.profiles set headline='Full-stack builder · Shipping campus tools', skills='{Next.js,TypeScript,PostgreSQL}', interests='{startups,open source}' where username='aditya_jain';

  insert into public.follows (follower_id,following_id)
  values
    ('ba100000-0000-4000-8000-000000000101','ba100000-0000-4000-8000-000000000102'),
    ('ba100000-0000-4000-8000-000000000102','ba100000-0000-4000-8000-000000000103'),
    ('ba100000-0000-4000-8000-000000000103','ba100000-0000-4000-8000-000000000101'),
    ('ba100000-0000-4000-8000-000000000104','ba100000-0000-4000-8000-000000000105'),
    ('ba100000-0000-4000-8000-000000000105','ba100000-0000-4000-8000-000000000106'),
    ('ba100000-0000-4000-8000-000000000107','ba100000-0000-4000-8000-000000000108'),
    ('ba100000-0000-4000-8000-000000000109','ba100000-0000-4000-8000-000000000110')
  on conflict do nothing;
end;
$$;
