-- 1) In Supabase: Authentication > Users > Add user (email + password, tick "Auto Confirm").
-- 2) Put that email below and run this once in the SQL Editor.
insert into public.profiles (id, full_name, role, is_active)
select id, 'Owner', 'admin', true from auth.users where email = 'YOUR-EMAIL@example.com'
on conflict (id) do update set role = 'admin', is_active = true;

-- Later, for a reporter: same steps, but use role 'editor'.
