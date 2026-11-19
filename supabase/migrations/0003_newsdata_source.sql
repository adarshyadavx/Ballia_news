-- Ballia News: add NewsData.io as a news source (run once in Supabase SQL Editor, after 0002).
-- The API key is NOT stored here; the pipeline reads NEWSDATA_API_KEY from the environment.
insert into public.sources (name, url, type)
select 'NewsData.io: बलिया / Ballia',
       -- qInTitle = "बलिया OR Ballia" in the headline only (much fewer off-topic results than q=)
       'https://newsdata.io/api/1/latest?qInTitle=%E0%A4%AC%E0%A4%B2%E0%A4%BF%E0%A4%AF%E0%A4%BE%20OR%20Ballia&country=in',
       'api'
where not exists (select 1 from public.sources where url like 'https://newsdata.io/%');
