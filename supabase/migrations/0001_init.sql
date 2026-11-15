-- Ballia News: tables, access rules (RLS), view counter, image bucket.
-- Run once in Supabase Dashboard > SQL Editor.


-- ---------- Profiles (admin team) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'editor' check (role in ('admin','editor')),
  is_active boolean not null default true
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.is_team() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active);
$$;

-- ---------- Categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order int not null default 0,
  show_on_home boolean not null default false,
  is_visible boolean not null default true
);

-- ---------- News ----------
create table public.news (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  slug text not null unique,
  summary text not null check (char_length(summary) <= 300),
  content text not null,
  main_image text not null,
  image_caption text,
  category_id uuid not null references public.categories(id),
  area text,
  tags text[] not null default '{}',
  youtube_url text,
  writer_name text,
  author_id uuid references public.profiles(id),
  is_breaking boolean not null default false,
  breaking_set_at timestamptz,          -- breaking shows only for 24h after this
  is_featured boolean not null default false,
  featured_at timestamptz,              -- newest featured = main top story
  status text not null default 'draft' check (status in ('draft','pending_review','published')),
  view_count bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index news_published_idx on public.news (status, published_at desc);
create index news_category_idx on public.news (category_id);

create or replace function public.news_before_write() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
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
create trigger news_before_write before insert or update on public.news
  for each row execute function public.news_before_write();

-- ---------- Daily views ----------
create table public.daily_views (
  news_id uuid not null references public.news(id) on delete cascade,
  date date not null default current_date,
  views int not null default 0,
  primary key (news_id, date)
);

-- Public readers can only "add a view" through this function.
create or replace function public.increment_view(p_news_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from news where id = p_news_id and status = 'published') then return; end if;
  update news set view_count = view_count + 1 where id = p_news_id;
  insert into daily_views (news_id, date, views) values (p_news_id, current_date, 1)
    on conflict (news_id, date) do update set views = daily_views.views + 1;
end $$;
grant execute on function public.increment_view(uuid) to anon, authenticated;

-- Most read in the last N days (public-safe, published only).
create or replace function public.most_read(p_days int default 7, p_limit int default 5)
returns setof public.news
language sql stable security definer set search_path = public as $$
  select n.* from news n
  join (select news_id, sum(views) v from daily_views
        where date > current_date - p_days group by news_id) d on d.news_id = n.id
  where n.status = 'published'
  order by d.v desc limit p_limit;
$$;
grant execute on function public.most_read(int, int) to anon, authenticated;

-- ---------- Messages (contact form) ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','done')),
  created_at timestamptz not null default now()
);

-- ---------- Access rules (section 10.7) ----------
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.news       enable row level security;
alter table public.daily_views enable row level security;
alter table public.messages   enable row level security;

-- profiles
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin manages profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- categories
create policy "public reads visible categories" on public.categories for select using (is_visible or public.is_team());
create policy "admin manages categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- news
create policy "public reads published news" on public.news for select using (status = 'published');
create policy "team reads own, admin reads all" on public.news for select using (public.is_admin() or (public.is_team() and author_id = auth.uid()));
create policy "admin full access news" on public.news for all using (public.is_admin()) with check (public.is_admin());
create policy "editor creates draft or review" on public.news for insert
  with check (public.is_team() and author_id = auth.uid() and status in ('draft','pending_review'));
create policy "editor edits own unpublished" on public.news for update
  using (public.is_team() and author_id = auth.uid() and status <> 'published')
  with check (author_id = auth.uid() and status in ('draft','pending_review'));

-- daily views: team reads; writes only via increment_view()
create policy "team reads views" on public.daily_views for select using (public.is_team());

-- messages
create policy "anyone sends message" on public.messages for insert with check (status = 'new');
create policy "team reads messages" on public.messages for select using (public.is_team());
create policy "team updates messages" on public.messages for update using (public.is_team()) with check (public.is_team());
create policy "admin deletes messages" on public.messages for delete using (public.is_admin());

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public) values ('news-images', 'news-images', true)
  on conflict (id) do nothing;
create policy "anyone views photos" on storage.objects for select using (bucket_id = 'news-images');
create policy "team uploads photos" on storage.objects for insert with check (bucket_id = 'news-images' and public.is_team());
create policy "admin deletes photos" on storage.objects for delete using (bucket_id = 'news-images' and public.is_admin());
