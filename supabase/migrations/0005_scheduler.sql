-- Ballia News: start the "Auto news" GitHub workflow every hour from Supabase,
-- because GitHub's own schedule is often late or skipped.
-- Run once in Supabase > SQL Editor.
--
-- FIRST store the GitHub token (once, in a separate query; never save the token in this file):
--   select vault.create_secret('PASTE_TOKEN_HERE', 'github_actions_token');
-- Token: fine-grained, only the Ballia_news repository, permission "Actions: Read and write".

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- "private" is not exposed through the Supabase API, so visitors cannot call this function.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.trigger_auto_news()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'github_actions_token';
  if token is null then
    raise exception 'Secret github_actions_token is missing (see the top of 0005_scheduler.sql)';
  end if;
  return net.http_post(
    url     := 'https://api.github.com/repos/adarshyadavx/Ballia_news/actions/workflows/auto-news.yml/dispatches',
    body    := jsonb_build_object('ref', 'main', 'inputs', jsonb_build_object('mode', 'run')),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'Content-Type', 'application/json',
      'User-Agent', 'ballia-news-scheduler'
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.trigger_auto_news() from public, anon, authenticated;

-- Times are UTC: minute 17 of hours 1-16 = 6:47 AM to 9:47 PM IST.
-- Running this again replaces the job with the same name.
select cron.schedule('auto-news-hourly', '17 1-16 * * *', 'select private.trigger_auto_news();');

-- Start one run now to test the setup.
select private.trigger_auto_news();

-- To check, a minute later (status_code 204 means GitHub accepted it):
--   select status_code, content, error_msg, created from net._http_response order by created desc limit 5;
-- To switch the scheduler off:
--   select cron.unschedule('auto-news-hourly');
