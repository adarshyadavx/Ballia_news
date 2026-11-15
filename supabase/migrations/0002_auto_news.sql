-- Ballia News: automatic daily news (PRD section 12.6).
-- Run once in Supabase Dashboard > SQL Editor, after 0001_init.sql.

-- ---------- Extra fields on news ----------
alter table public.news
  add column if not exists is_auto boolean not null default false,
  add column if not exists source_names text[] not null default '{}',
  add column if not exists source_urls text[] not null default '{}',
  add column if not exists image_type text check (image_type in ('library','stock','default','upload')),
  add column if not exists image_credit text,
  add column if not exists ai_confidence int,
  add column if not exists review_status text not null default 'published' check (review_status in ('published','held','rejected')),
  add column if not exists hold_reason text;
create index if not exists news_auto_idx on public.news (is_auto, review_status, created_at desc);

-- ---------- Sources ----------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,                      -- feed address
  type text not null check (type in ('google-news','publisher','official','api')),
  enabled boolean not null default true,
  last_checked_at timestamptz
);

-- ---------- Seen items (links already processed) ----------
create table if not exists public.seen_items (
  url text primary key,
  title text,
  seen_at timestamptz not null default now()
);

-- ---------- Image library (owner's own Ballia photos) ----------
create table if not exists public.image_library (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  category_slug text,
  area text,
  keywords text[] not null default '{}',
  credit text not null default 'बलिया न्यूज़',
  created_at timestamptz not null default now()
);

-- ---------- Pipeline runs ----------
create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  mode text not null default 'run',
  found int not null default 0,
  published int not null default 0,
  held int not null default 0,
  rejected int not null default 0,
  errors text[] not null default '{}',
  note text
);

-- ---------- Admin overrides for config.json autoNews (on/off switches) ----------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Only the admin (and the pipeline's server key, which bypasses these rules) can touch them.
alter table public.sources enable row level security;
alter table public.seen_items enable row level security;
alter table public.image_library enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.app_settings enable row level security;
create policy "admin manages sources" on public.sources for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages seen" on public.seen_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages image library" on public.image_library for all using (public.is_admin()) with check (public.is_admin());
create policy "admin reads runs" on public.pipeline_runs for select using (public.is_admin());
create policy "admin manages settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Starting sources (edit freely in Admin > Auto News) ----------
insert into public.sources (name, url, type) values
  ('Google News: बलिया', 'https://news.google.com/rss/search?q=%E0%A4%AC%E0%A4%B2%E0%A4%BF%E0%A4%AF%E0%A4%BE+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: Ballia', 'https://news.google.com/rss/search?q=Ballia+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: रसड़ा', 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%B8%E0%A4%A1%E0%A4%BC%E0%A4%BE+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: बांसडीह', 'https://news.google.com/rss/search?q=%E0%A4%AC%E0%A4%BE%E0%A4%82%E0%A4%B8%E0%A4%A1%E0%A5%80%E0%A4%B9+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: बेल्थरा रोड', 'https://news.google.com/rss/search?q=%E0%A4%AC%E0%A5%87%E0%A4%B2%E0%A5%8D%E0%A4%A5%E0%A4%B0%E0%A4%BE+%E0%A4%B0%E0%A5%8B%E0%A4%A1+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: सिकंदरपुर', 'https://news.google.com/rss/search?q=%E0%A4%B8%E0%A4%BF%E0%A4%95%E0%A4%82%E0%A4%A6%E0%A4%B0%E0%A4%AA%E0%A5%81%E0%A4%B0+%E0%A4%AC%E0%A4%B2%E0%A4%BF%E0%A4%AF%E0%A4%BE+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news'),
  ('Google News: बैरिया', 'https://news.google.com/rss/search?q=%E0%A4%AC%E0%A5%88%E0%A4%B0%E0%A4%BF%E0%A4%AF%E0%A4%BE+%E0%A4%AC%E0%A4%B2%E0%A4%BF%E0%A4%AF%E0%A4%BE+when:1d&hl=hi&gl=IN&ceid=IN:hi', 'google-news')
on conflict do nothing;
