-- Ballia News: safety fixes. Run once in Supabase Dashboard > SQL Editor, after 0002 (and 0003).
-- Safe to run more than once.

-- ---------- 1. A held auto story that gets published is no longer "held" ----------
-- Before: publishing a held story from Manage News or the editor left review_status = 'held',
-- so the midnight cleanup deleted the live story after 7 days.
create or replace function public.news_before_write() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status = 'published' and new.review_status = 'held' then
    new.review_status := 'published';
    new.hold_reason := null;
  end if;
  if new.is_breaking and (tg_op = 'INSERT' or not old.is_breaking) then
    new.breaking_set_at := now();
  end if;
  if not new.is_breaking then new.breaking_set_at := null; end if;
  if new.is_featured and (tg_op = 'INSERT' or not old.is_featured) then
    new.featured_at := now();
  end if;
  if not new.is_featured then new.featured_at := null; end if;
  return new;
end $$;

-- Repair stories already affected.
update public.news set review_status = 'published', hold_reason = null
  where status = 'published' and review_status = 'held';

-- ---------- 2. Contact form: no more direct inserts with the public key ----------
-- Messages now go through send_message(), which checks the fields and limits floods:
-- at most 3 messages per phone number per hour and 20 messages in total per 10 minutes.
alter table public.messages drop constraint if exists messages_length;
alter table public.messages add constraint messages_length
  check (char_length(name) <= 100 and char_length(phone) <= 20 and char_length(message) <= 3000) not valid;

drop policy if exists "anyone sends message" on public.messages;

create or replace function public.send_message(p_name text, p_phone text, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  p_name := btrim(coalesce(p_name, ''));
  p_phone := btrim(coalesce(p_phone, ''));
  p_message := btrim(coalesce(p_message, ''));
  if p_name = '' or p_message = '' or char_length(p_name) > 100 or char_length(p_message) > 3000
     or p_phone !~ '^[+0-9][0-9 -]{7,17}$' then
    raise exception 'invalid message' using errcode = '22023';
  end if;
  if (select count(*) from messages where phone = p_phone and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from messages where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'too many messages' using errcode = 'P0001';
  end if;
  insert into messages (name, phone, message) values (p_name, p_phone, p_message);
end $$;
revoke all on function public.send_message(text, text, text) from public;
grant execute on function public.send_message(text, text, text) to anon, authenticated;

-- ---------- 3. View counter: one visitor cannot inflate "Most read" ----------
-- Counts at most 50 views per visitor IP per story per day. Only a hash is stored, never the IP.
create table if not exists public.view_hits (
  key text primary key,
  hits int not null default 1,
  day date not null default current_date
);
alter table public.view_hits enable row level security; -- no policies: only increment_view() and the server key

create or replace function public.increment_view(p_news_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_headers json := nullif(current_setting('request.headers', true), '')::json;
  v_ip text := coalesce(v_headers->>'cf-connecting-ip', btrim(split_part(v_headers->>'x-forwarded-for', ',', 1)), '');
  v_hits int;
begin
  if not exists (select 1 from news where id = p_news_id and status = 'published') then return; end if;
  if v_ip <> '' then
    insert into view_hits (key) values (md5(v_ip || '|' || p_news_id || '|' || current_date))
      on conflict (key) do update set hits = view_hits.hits + 1
      returning hits into v_hits;
    if v_hits > 50 then return; end if;
  end if;
  update news set view_count = view_count + 1 where id = p_news_id;
  insert into daily_views (news_id, date, views) values (p_news_id, current_date, 1)
    on conflict (news_id, date) do update set views = daily_views.views + 1;
end $$;
grant execute on function public.increment_view(uuid) to anon, authenticated;
