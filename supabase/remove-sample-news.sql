-- Run before launch: deletes the demo stories (slug starts with "sample-").
delete from public.news where slug like 'sample-%';
