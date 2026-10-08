-- Run ONCE in Supabase SQL Editor if you already ran the old schema.sql.
-- Removes the login/roles system and lets the site read and write without signing in.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
do $$ declare t text; begin
  foreach t in array array['contacts','deals','activities','tasks','tickets'] loop
    execute format('drop policy if exists "staff access" on %I', t);
    execute format('drop policy if exists "open access" on %I', t);
    execute format('create policy "open access" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
drop table if exists profiles cascade;
drop function if exists my_role();
