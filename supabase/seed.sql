-- Local development seed. Applies with `npx supabase db reset` against the
-- local Supabase stack. Every demo account uses the password below.
-- For a hosted project, use Magic Link / admin API to create users instead of
-- inserting into auth.users.
do $$
declare
  org_id uuid;
  aisha uuid; rohan uuid; priya uuid; kabir uuid; meera uuid; admin uuid;
  capstone uuid; timetable uuid; accessmap uuid;
  conv_aisha_rohan uuid; conv_group uuid;
begin
  if not auth.role() = 'service_role' and current_user not in ('postgres','supabase_admin') then
    raise notice 'Seed must run as postgres/service role (supabase db reset does this).';
  end if;

  -- Organization ------------------------------------------------------------
  select id into org_id from public.organizations where slug = 'demo-university';
  if org_id is null then
    insert into public.organizations (name, slug, website, logo_url)
    values ('Northfield Institute of Technology', 'demo-university', 'https://example.edu', null)
    returning id into org_id;
  end if;
  insert into public.organization_domains (organization_id, domain)
  values (org_id, 'example.edu'), (org_id, 'students.example.edu')
  on conflict (organization_id, domain) do nothing;

  -- Demo users ---------------------------------------------------------
  -- Ids are fixed so re-running the seed never duplicates content.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current)
  values
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111101', 'authenticated', 'authenticated', 'aisha@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"aisha","full_name":"Aisha Rahman"}', now() - interval '90 days', now() - interval '90 days', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111102', 'authenticated', 'authenticated', 'rohan@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"rohan","full_name":"Rohan Mehta"}', now() - interval '90 days', now() - interval '90 days', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111103', 'authenticated', 'authenticated', 'priya@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"priya","full_name":"Priya Nair"}', now() - interval '85 days', now() - interval '85 days', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111104', 'authenticated', 'authenticated', 'kabir@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"kabir","full_name":"Kabir Singh"}', now() - interval '60 days', now() - interval '60 days', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111105', 'authenticated', 'authenticated', 'meera@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"meera","full_name":"Meera Iyer"}', now() - interval '75 days', now() - interval '75 days', '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111110', 'authenticated', 'authenticated', 'admin@example.edu', crypt('Password123!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', '{"username":"admin","full_name":"Campus Admin"}', now() - interval '120 days', now() - interval '120 days', '', '', '', '', '')
  on conflict (id) do nothing;

  select id into aisha   from auth.users where email = 'aisha@example.edu';
  select id into rohan   from auth.users where email = 'rohan@example.edu';
  select id into priya   from auth.users where email = 'priya@example.edu';
  select id into kabir   from auth.users where email = 'kabir@example.edu';
  select id into meera   from auth.users where email = 'meera@example.edu';
  select id into admin   from auth.users where email = 'admin@example.edu';

  -- GoTrue identity rows; password login needs an identity, not just a users row.
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', created_at, created_at, created_at
  from auth.users where id in (aisha, rohan, priya, kabir, meera, admin)
  on conflict (provider_id, provider) do nothing;

  -- Profiles (trigger created them with username/full_name; add the rest) -----
  update public.profiles set
    organization_id = org_id,
    headline = 'Full-stack developer building campus tools',
    bio = 'CSE 3rd year. I like shipping small tools that people around campus actually use. Currently deep in Postgres and Next.js.',
    course = 'B.Tech CSE', department = 'Computer Science', graduation_year = 2027,
    skills = '{TypeScript, React, PostgreSQL, Tailwind}', interests = '{open source, campus tools}',
    github_username = 'aisha', profile_visibility = 'public', portfolio_visibility = 'public',
    collaboration_available = true
  where id = aisha;
  update public.profiles set
    organization_id = org_id,
    headline = 'Backend engineer · boring technology enthusiast',
    bio = 'If it can be solved with indexes and measured with EXPLAIN, I am interested. Mentor for junior backend students.',
    course = 'B.Tech IT', department = 'Information Technology', graduation_year = 2026,
    skills = '{Java, Spring, PostgreSQL}', interests = '{mentoring, systems}',
    github_username = 'meera', collaboration_available = false, mentorship_available = true
  where id = meera;
  update public.profiles set
    organization_id = org_id,
    headline = 'Go, Kubernetes, distributed systems',
    bio = 'Systems person loves clear APIs',
    course = 'B.Tech CSE', department = 'Computer Science', graduation_year = 2026,
    skills = '{Go, Kubernetes, gRPC}', mentorship_available = true
  where id = rohan;
  update public.profiles set
    organization_id = org_id,
    headline = 'Design engineer, accessibility first',
    bio = 'Design engineer working in Figma and the browser. Fresh faces: come build accessible UIs with me.',
    course = 'B.Des', department = 'Design', graduation_year = 2027,
    skills = '{Figma, React, CSS}', profile_visibility = 'public', collaboration_available = true
  where id = priya;
  update public.profiles set
    organization_id = org_id,
    headline = 'ML for low-resource languages',
    course = 'B.Tech AI', department = 'Artificial Intelligence', graduation_year = 2028,
    skills = '{Python, PyTorch, NLP}'
  where id = kabir;
  update public.profiles set
    organization_id = org_id,
    headline = 'CampusLoop administrator',
    full_name = 'Campus Admin', course = 'Administration', department = 'Student Affairs', graduation_year = 2025,
    skills = '{Operations}', mentorship_available = false
  where id = admin;

  -- Verified organization memberships (feature uses these to gate the feed) --
  insert into public.organization_memberships (organization_id, user_id, role, status, verified_at)
  values
    (org_id, admin, 'college_admin', 'verified', now() - interval '119 days'),
    (org_id, aisha, 'student', 'verified', now() - interval '90 days'),
    (org_id, rohan, 'student', 'verified', now() - interval '90 days'),
    (org_id, priya, 'student', 'verified', now() - interval '85 days'),
    (org_id, kabir, 'student', 'verified', now() - interval '60 days'),
    (org_id, meera, 'student', 'verified', now() - interval '75 days')
  on conflict (organization_id, user_id) do nothing;

  -- Follows --------------------------------------------------------------
  insert into public.follows (follower_id, following_id, created_at) values
    (aisha, rohan, now() - interval '40 days'),
    (aisha, priya, now() - interval '40 days'),
    (rohan, aisha, now() - interval '40 days'),
    (priya, aisha, now() - interval '40 days'),
    (kabir, aisha, now() - interval '14 days'),
    (meera, rohan, now() - interval '20 days')
  on conflict do nothing;

  -- Projects ---------------------------------------------------------------
  insert into public.projects (id, owner_id, organization_id, title, description, tech_stack, repository_url, status, visibility, openings, accepted_count, created_at, updated_at)
  values
    ('22222222-2222-4222-8222-222222222201', aisha, org_id,
     'CampusLoop Mobile', 'A React Native companion app for the campus feed and messaging. First milestone is offline-first sync for the inbox.',
     '{React Native, TypeScript, Expo}', 'https://github.com/aisha/campusloop-mobile', 'active', 'campus', 2, 1, now() - interval '30 days', now() - interval '2 days'),
    ('22222222-2222-4222-8222-222222222202', rohan, org_id,
     'OpenTimetable', 'Conflict-free timetable planning for student clubs and labs. Reads course data and finds shared free slots across teams.',
     '{Go, PostgreSQL, HTMX}', null, 'active', 'public', 1, 0, now() - interval '20 days', now() - interval '4 days'),
    ('22222222-2222-4222-8222-222222222203', priya, org_id,
     'Accessible Campus Map', 'Mapping wheelchair-accessible entrances, ramps and lifts across campus, verified by students.',
     '{React, MapLibre, CSS}', null, 'active', 'public', 1, 0, now() - interval '10 days', now() - interval '1 day')
  on conflict (id) do nothing;

  select id into capstone from public.projects where id = '22222222-2222-4222-8222-222222222201';
  select id into timetable from public.projects where id = '22222222-2222-4222-8222-222222222202';
  select id into accessmap from public.projects where id = '22222222-2222-4222-8222-222222222203';

  insert into public.project_members (project_id, user_id, role) values
    (capstone, aisha, 'owner'),
    (capstone, kabir, 'member'),
    (timetable, rohan, 'owner'),
    (accessmap, priya, 'owner')
  on conflict do nothing;

  -- Seeded demo applications. The before-insert guard triggers compare
  -- applicant_id with auth.uid(), which is null for a superuser seed script;
  -- bypass ordinary triggers for these specific guarded inserts only, so the
  -- counter-maintenance triggers for posts/likes/comments keep working.
  EXECUTE 'set session_replication_role = replica';
  insert into public.project_applications (project_id, applicant_id, message, status, created_at) values
    (capstone, priya, 'I have shipped two Expo apps and would happily own the offline sync layer with you.', 'pending', now() - interval '3 days'),
    (accessmap, kabir, 'Happy to help with data collection and building the reporting dashboard.', 'pending', now() - interval '2 days')
  on conflict (project_id, applicant_id) do nothing;
  EXECUTE 'set session_replication_role = origin';

  insert into public.project_tasks (project_id, title, description, assignee_id, status, due_at, created_by) values
    (capstone, 'Audit dark mode contrast in feed', 'Check the mobile feed hits WCAG AA in dark mode before beta.', priya, 'in_progress', now() + interval '5 days', aisha),
    (capstone, 'Offline message queue', 'Persist outbound messages locally when offline and flush on reconnect.', kabir, 'todo', now() - interval '2 days', aisha),
    (timetable, 'Import 2nd-year course data', 'Write the Go importer for the registrar CSV export.', null, 'todo', now() + interval '10 days', rohan)
  on conflict do nothing;

  -- Posts ------------------------------------------------------------------
  insert into public.posts (id, author_id, organization_id, body, visibility, project_id, created_at, updated_at) values
    ('33333333-3333-4333-8333-333333333101', aisha, org_id,
     'Beacon-riders, we just opened one more slot on CampusLoop Mobile. If you like React Native and offline sync, apply from the project page. #buildinpublic', 'campus', capstone, now() - interval '3 hours', now()),
    ('33333333-3333-4333-8333-333333333102', rohan, org_id,
     'OpenTimetable now resolves club conflicts in under 40ms on 12k rows. Postgres indexes are still undefeated. #postgres', 'public', timetable, now() - interval '26 hours', now()),
    ('33333333-3333-4333-8333-333333333103', priya, org_id,
     'Accessibility is not a checklist at the end. It decides your layout on day one.', 'public', null, now() - interval '2 days', now()),
    ('33333333-3333-4333-8333-333333333104', kabir, org_id,
     'Teammete needed: someone who knows speech datasets for low-resource languages. I have the model, need annotated data and a second pair of eyes. #nlp #testing', 'campus', null, now() - interval '3 days', now()),
    ('33333333-3333-4333-8333-333333333105', meera, org_id,
     'Reminder for first-years: a boring, well-indexed schema beats a clever one every time.', 'public', null, now() - interval '6 days', now())
  on conflict (id) do nothing;

  insert into public.post_likes (post_id, user_id, created_at) values
    ('33333333-3333-4333-8333-333333333101', rohan, now() - interval '2 hours'),
    ('33333333-3333-4333-8333-333333333101', priya, now() - interval '1 hour'),
    ('33333333-3333-4333-8333-333333333101', kabir, now() - interval '40 minutes'),
    ('33333333-3333-4333-8333-333333333102', aisha, now() - interval '20 hours'),
    ('33333333-3333-4333-8333-333333333103', aisha, now() - interval '1 day'),
    ('33333333-3333-4333-8333-333333333103', rohan, now() - interval '1 day'),
    ('33333333-3333-4333-8333-333333333103', kabir, now() - interval '20 hours'),
    ('33333333-3333-4333-8333-333333333103', meera, now() - interval '18 hours')
  on conflict do nothing;

  insert into public.comments (id, post_id, author_id, body, created_at) values
    ('33333333-3333-4333-8333-333333333201', '33333333-3333-4333-8333-333333333101', rohan, 'Applied as Meera pointed me here. Nice writeup on the sync layer.',  now() - interval '2 hours'),
    ('33333333-3333-4333-8333-333333333202', '33333333-3333-4333-8333-333333333102', aisha, 'Any chance of a write-up on the index choices?', now() - interval '18 hours'),
    ('33333333-3333-4333-8333-333333333203', '33333333-3333-4333-8333-333333333102', rohan, 'Sure, after the club pilot ends.', now() - interval '16 hours')
  on conflict (id) do nothing;

  insert into public.bookmarks (user_id, post_id) values
    (aisha, '33333333-3333-4333-8333-333333333102')
  on conflict do nothing;

  -- Clubs --------------------------------------------------------------
  insert into public.clubs (id, organization_id, name, slug, description, created_by)
  values ('24444444-4444-4444-8444-444444444401', org_id, 'Coding Club', 'coding-club',
          'Weekly build nights, contest practice and open-source sprints.', admin)
  on conflict (slug) do nothing;
  insert into public.club_memberships (club_id, user_id, role, status) values
    ('24444444-4444-4444-8444-444444444401', admin, 'lead', 'active'),
    ('24444444-4444-4444-8444-444444444401', aisha, 'member', 'active'),
    ('24444444-4444-4444-8444-444444444401', rohan, 'member', 'active'),
    ('24444444-4444-4444-8444-444444444401', priya, 'member', 'active')
  on conflict do nothing;

  -- Events (one upcoming, full-ish; one past) ------------------------------
  insert into public.events (id, organization_id, club_id, created_by, title, description, location, starts_at, ends_at, capacity, status, created_at) values
    ('28888888-8888-4888-8888-888888888801', org_id, '24444444-4444-4444-8444-444444444401', admin, 'Hack Night', 'Teams of four, twelve hours, shuttle at midnight.', 'Innovation Lab', now() + interval '10 days', now() + interval '10 days' + interval '12 hours', 40, 'published', now() - interval '2 days'),
    ('28888888-8888-4888-8888-888888888802', org_id, null, admin, 'Career Prep Clinic', 'Bring your resume and a problem you are stuck on.', 'Library Seminar Room', now() - interval '12 days' + interval '4 hours', null, 30, 'published', now() - interval '20 days')
  on conflict (id) do nothing;
  -- Same seed-notification trigger bypass for event registrations (guarded by
  -- registration_must_be_current_user in migration 0003).
  EXECUTE 'set session_replication_role = replica';
  insert into public.event_registrations (event_id, user_id) values
    ('28888888-8888-4888-8888-888888888801', aisha),
    ('28888888-8888-4888-8888-888888888801', rohan),
    ('28888888-8888-4888-8888-888888888801', priya),
    ('28888888-8888-4888-8888-888888888801', kabir)
  on conflict do nothing;
  EXECUTE 'set session_replication_role = origin';

  -- Opportunities (live, upcoming deadlines) -------------------------------
  -- These records use fixed IDs so repeating `supabase db reset` or the seed
  -- script does not create duplicate listings.
  delete from public.opportunities
  where organization_id = org_id
    and title in ('Backend Engineering Intern — Northfield Labs', 'Hackathon: Civic Tech Challenge', 'Research Datalog Assistant — AI Lab');
  insert into public.opportunities (id, organization_id, publisher_id, title, category, description, source_url, eligibility, location, deadline, status, created_at) values
    ('29999999-9999-4999-8999-999999999901', org_id, admin, 'Backend Engineering Intern — Northfield Labs', 'internship',
     'Work on Postgres-backed services with a small platform team. Paid 8-week summer internship, campus interview round first.',
     'https://example.edu/jobs/backend-intern', '2nd and 3rd year CSE/IT', 'Bengaluru (hybrid)', now() + interval '20 days', 'published', now() - interval '8 days'),
    ('29999999-9999-4999-8999-999999999902', org_id, admin, 'Hackathon: Civic Tech Challenge', 'hackathon',
     '24-hour civic-tech hackathon. Winning project gets a atbay sponsorship and mentorship through the open source accelerator.',
     'https://example.edu/civic-tech', 'All students', 'Innovation Lab', now() + interval '45 days', 'published', now() - interval '3 days'),
    ('29999999-9999-4999-8999-999999999903', org_id, admin, 'Research Datalog Assistant — AI Lab', 'campus_recruitment',
     'The AI lab is taking two research assistants for NLP on low-resource Indian languages.',
     'https://example.edu/ai-lab', '2nd year and above, AI/CS', 'On campus', now() + interval '30 days', 'published', now() - interval '5 days')
  on conflict (id) do update set
    title = excluded.title, category = excluded.category, description = excluded.description,
    source_url = excluded.source_url, eligibility = excluded.eligibility, location = excluded.location,
    deadline = excluded.deadline, status = excluded.status;

  -- Messages (one pair DM, one group thread, both with history) -------------
  insert into public.conversations (id, is_group, title, created_by) values
    ('26666666-6666-4666-8666-666666666601', false, null, aisha),
    ('26666666-6666-4666-8666-666666666602', true, 'Mobile team standup', aisha)
  on conflict (id) do nothing;
  insert into public.conversation_members (conversation_id, user_id) values
    ('26666666-6666-4666-8666-666666666601', aisha),
    ('26666666-6666-4666-8666-666666666601', rohan),
    ('26666666-6666-4666-8666-666666666602', aisha),
    ('26666666-6666-4666-8666-666666666602', rohan),
    ('26666666-6666-4666-8666-666666666602', meera)
  on conflict do nothing;

  -- guard_message_participants (0006/0007) also compares against auth.uid().
  EXECUTE 'set session_replication_role = replica';
  insert into public.messages (conversation_id, sender_id, body, created_at) values
    ('26666666-6666-4666-8666-666666666601', aisha,      'Hey Rohan — is the timetable importer free this week? Want help on the CSV side.',        now() - interval '2 hours'),
    ('26666666-6666-4666-8666-666666666601', rohan,      'It is. Send patches on the branch, let us sync tomorrow evening.',                        now() - interval '100 minutes'),
    ('26666666-6666-4666-8666-666666666601', aisha,      'Call it. I will have a slice ready.',                                                     now() - interval '90 minutes'),
    ('26666666-6666-4666-8666-666666666602', meera,      'Standup notes in the thread please so new members can catch up.',                          now() - interval '5 hours'),
    ('26666666-6666-4666-8666-666666666602', aisha,      'Did the dark-mode contrast fix, PR 12. Needs a reviewer.',                                 now() - interval '4 hours'),
    ('26666666-6666-4666-8666-666666666602', rohan,      'Going to take the PR this evening.',                                                       now() - interval '2 hours')
  on conflict do nothing;
  EXECUTE 'set session_replication_role = origin';

  -- Resume for the primary demo user ---------------------------------------
  insert into public.resumes (user_id, title, template, content) values
    (aisha, 'Final-year resume — backend', 'modern', '{
      "summary": "Third-year CSE student who ships real things: working Postgres-backed apps, campus tools and OpenTimetable importer patches.",
      "education": [
        { "school": "Northfield Institute of Technology", "major": "B.Tech Computer Science", "start": "2023-08", "end": "2027-05" }
      ],
      "experience": [
        { "company": "CampusLoop (student-built)", "title": "Full-stack developer", "start": "2025-01", "end": "Present", "bullets": ["Built offline-first sync for the mobile client.", "Shipped the project marketplace: applications, roles, capacity.", "Cut the feed query to under 15ms with covering indexes."] }
      ],
      "projects": [
        { "name": "CampusLoop Mobile", "stack": "React Native, Expo, TypeScript", "notes": "Offline-first companion app." },
        { "name": "OpenTimetable", "stack": "Go, PostgreSQL", "notes": "CSV importer and conflict resolver." }
      ],
      "skills": ["TypeScript", "React", "Next.js", "PostgreSQL", "Expo", "Testing"],
      "certifications": [{ "name": "Postgen Junior Admin (Coursework)", "year": 2025 }],
      "achievements": ["Hack Night winner (team of 4)", "Open source sprint mentor"]
    }'::jsonb)
  on conflict do nothing;

  -- Notifications for the demo inbox ---------------------------------------
  insert into public.notifications (recipient_id, actor_id, type, entity_type, message, is_read, idempotency_key, created_at) values
    (aisha, rohan, 'follow', 'profile', 'Rohan Mehta started following you.', false, 'seed-follow-rohan-aisha', now() - interval '2 days'),
    (aisha, priya, 'like', 'post', 'Priya Nair liked your post.', false, 'seed-like-priya-post1', now() - interval '1 hour'),
    (aisha, null, 'application', 'project', 'New application on CampusLoop Mobile.', false, 'seed-notif-app1', now() - interval '3 days'),
    (rohan, aisha, 'comment', 'post', 'Aisha commented on your update.', true, 'seed-notif-comment1', now() - interval '16 hours')
  on conflict (idempotency_key) do nothing;

  raise notice 'Seed complete. Demo password for every account: Password123!';
end $$;
