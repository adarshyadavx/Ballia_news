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

-- Starting categories and SAMPLE news (delete sample news before launch).
insert into public.categories (name, slug, display_order, show_on_home) values
  ('बलिया शहर','ballia-city',1,true),
  ('तहसील / क्षेत्र','tehsil',2,true),
  ('अपराध','crime',3,true),
  ('राजनीति','politics',4,true),
  ('शिक्षा','education',5,true),
  ('खेल','sports',6,false),
  ('कृषि','agriculture',7,false),
  ('धर्म-संस्कृति','culture',8,false),
  ('नौकरी','jobs',9,false),
  ('उत्तर प्रदेश','uttar-pradesh',10,false)
on conflict (slug) do nothing;

-- SAMPLE stories (marked by slug prefix 'sample-')
insert into public.news (headline, slug, summary, content, main_image, category_id, area, writer_name, is_featured, is_breaking, status, published_at, tags)
select v.headline, v.slug, v.summary,
  '<p>'||v.summary||'</p><p>यह एक नमूना खबर है। असली खबरें एडमिन पैनल से जोड़ी जाएंगी।</p>',
  '/default-news.svg', c.id, nullif(v.area,''), 'बलिया न्यूज़', v.feat, v.brk, 'published', now() - (v.hrs || ' hours')::interval, array['नमूना']
from (values
  ('ballia-city','बलिया शहर में नई सड़क का काम शुरू','sample-1','नगर पालिका ने मुख्य बाज़ार की सड़क के चौड़ीकरण का काम शुरू किया, लोगों को मिलेगी जाम से राहत।','बलिया सदर',2,true,true),
  ('education','जिले के स्कूलों में नया सत्र शुरू, बच्चों में उत्साह','sample-2','बेसिक शिक्षा विभाग के अनुसार सभी विद्यालयों में प्रवेश अभियान चलाया जा रहा है।','बलिया सदर',5,true,false),
  ('crime','पुलिस ने चोरी के मामले में दो आरोपी पकड़े','sample-3','बैरिया थाना पुलिस ने मोटरसाइकिल चोरी के मामले में दो युवकों को गिरफ्तार किया।','बैरिया',8,true,false),
  ('politics','जिला पंचायत की बैठक में विकास कार्यों पर चर्चा','sample-4','बैठक में सड़क, पेयजल और स्वास्थ्य सुविधाओं के प्रस्ताव रखे गए।','बलिया सदर',12,true,false),
  ('tehsil','रसड़ा में बाढ़ से पहले तटबंध की मरम्मत तेज़','sample-5','सिंचाई विभाग ने घाघरा किनारे तटबंधों की मरम्मत के लिए अतिरिक्त टीमें लगाईं।','रसड़ा',20,false,false),
  ('sports','बलिया के खिलाड़ियों ने मंडल स्तरीय प्रतियोगिता में जीते पदक','sample-6','एथलेटिक्स में जिले के छह खिलाड़ियों ने स्वर्ण और रजत पदक अपने नाम किए।','बांसडीह',26,false,false),
  ('agriculture','किसानों को धान खरीद केंद्रों पर मिलेगी ऑनलाइन पर्ची','sample-7','कृषि विभाग ने किसानों से समय पर पंजीकरण कराने की अपील की है।','सिकंदरपुर',30,false,false),
  ('culture','ददरी मेले की तैयारियां शुरू, प्रशासन ने किया निरीक्षण','sample-8','कार्तिक पूर्णिमा पर लगने वाले ऐतिहासिक ददरी मेले के लिए सफाई और सुरक्षा इंतज़ाम शुरू।','बलिया सदर',36,false,false),
  ('jobs','जिला रोज़गार कार्यालय में रोज़गार मेला 20 तारीख को','sample-9','विभिन्न कंपनियां युवाओं का साक्षात्कार लेंगी, पंजीकरण निशुल्क है।','बलिया सदर',40,false,false),
  ('uttar-pradesh','प्रदेश में ठंड बढ़ने की संभावना, मौसम विभाग का अलर्ट','sample-10','पूर्वांचल के कई जिलों में सुबह कोहरा छाने का अनुमान जताया गया है।','',44,false,false),
  ('ballia-city','शहर में पेयजल पाइपलाइन बिछाने का कार्य अंतिम चरण में','sample-11','जल निगम के अनुसार अगले माह तक कई मोहल्लों में नई पाइपलाइन से आपूर्ति शुरू होगी।','बलिया सदर',50,false,false),
  ('crime','साइबर ठगी से बचने के लिए पुलिस ने चलाया जागरूकता अभियान','sample-12','लोगों को अनजान लिंक और ओटीपी साझा न करने की सलाह दी गई।','बेल्थरा रोड',56,false,false),
  ('education','डिग्री कॉलेज में प्रवेश के लिए आवेदन की अंतिम तिथि बढ़ी','sample-13','विश्वविद्यालय ने छात्रों को राहत देते हुए आवेदन की तारीख आगे बढ़ाई।','बांसडीह',60,false,false),
  ('politics','विधायक ने क्षेत्र में स्वास्थ्य केंद्र का किया निरीक्षण','sample-14','निरीक्षण के दौरान दवाओं की उपलब्धता और स्टाफ की उपस्थिति की जांच की गई।','बैरिया',70,false,false),
  ('tehsil','बेल्थरा रोड स्टेशन पर नई ट्रेन का ठहराव शुरू','sample-15','यात्रियों की मांग पर रेलवे ने एक एक्सप्रेस ट्रेन का ठहराव मंजूर किया।','बेल्थरा रोड',76,false,false),
  ('sports','जिला क्रिकेट लीग का फाइनल रविवार को खेला जाएगा','sample-16','दो मज़बूत टीमों के बीच रोमांचक मुकाबले की उम्मीद है।','सिकंदरपुर',84,false,false),
  ('agriculture','गेहूं की बुवाई से पहले मिट्टी जांच शिविर','sample-17','कृषि विज्ञान केंद्र में किसानों की निशुल्क मिट्टी जांच की जाएगी।','रसड़ा',90,false,false),
  ('culture','छठ पर्व के लिए घाटों की सफाई शुरू','sample-18','गंगा किनारे घाटों पर रोशनी और बैरिकेडिंग की व्यवस्था की जा रही है।','बलिया सदर',96,false,false)
) as v(cat, headline, slug, summary, area, hrs, feat, brk)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;
