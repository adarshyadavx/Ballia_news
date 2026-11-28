# Ballia News (बलिया न्यूज़)

Local Hindi news website. Next.js 16 + Tailwind + shadcn/ui + Supabase. Plan: `prd.md`.

## Run locally
```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## First-time database setup (once)
1. Supabase Dashboard > SQL Editor > paste **all of** `supabase/setup-all.sql` > Run
   (it creates tables, access rules, the photo bucket, 10 categories and 18 sample stories).
2. Authentication > Users > Add user (your email + password, tick Auto Confirm).
3. Run `supabase/make-admin.sql` (edit the email first). Now log in at `/admin/login`.

## Settings
- `config.json`: site name, contacts, social links, areas, homepage counts, feature switches, ads.
- `.env.local`: Supabase URL and publishable key only. Never commit secrets.

## Ads (Adsterra)
Ad keys in `config.json` that still contain `ADSTERRA_` render nothing, so the site is clean until you add real ones.
- `displayBanner.*.key`: the banner **key** from Adsterra.
- `nativeBanner.key`, `socialBar.key`, `popunder.key`: paste the **script URL** Adsterra gives
  (looks like `//pl123.example.com/abcdef/invoke.js`).
- `smartlink.url`: your Smartlink. Set `enabled: true` to switch a format on.
- Week 3: set `popunder.enabled` true. Week 4: set `smartlink.enabled` true.
- Live now: native banner (one per page, first ad slot), social bar (all pages), popunder (all pages, max once a day,
  never on the first page view or on about/contact/privacy), smartlink (footer and 404).
- Adult ads cannot be filtered in code: the ad network picks the ad. In the Adsterra dashboard, register the site as a
  mainstream **News** site (not adult), and ask your Adsterra manager/support to block adult, dating and gambling ads
  on every ad unit.

## Launch checklist (Phase 7)
1. Run `supabase/remove-sample-news.sql`, then publish your first real stories.
   The built-in sample stories (`features.sampleData`) only show while no story is published; set it to `false` to turn them off completely.
   Also run `supabase/migrations/0004_hardening.sql` (contact-form flood limits, view-counter limits, held-story fix).
2. Put real values in `config.json` (domain `site.url`, phone, email, WhatsApp, GA id) and replace `public/logo.png` (and the icons in `src/app/`).
3. Push to GitHub, import the repo on Vercel, add the two env vars from `.env.local`.
4. Add your domain in Vercel, and set `site.url` to it.
5. Supabase > Authentication > URL Configuration: set Site URL to your domain.
6. Test on a real Android phone: WhatsApp share preview, admin login, publish a story.
7. Weekly: Supabase database backup; compare Adsterra earnings with Analytics.

## Automatic daily news (PRD section 12)
1. Supabase SQL Editor: run `supabase/migrations/0002_auto_news.sql` (new fields, 5 tables, starting sources).
2. Add the keys from `.env.example` to GitHub (Settings > Secrets > Actions). Add `REVALIDATE_SECRET` on Vercel too.
   Set a monthly spending limit in the Anthropic Console.
3. Admin > **Auto News**: upload 50-100 Ballia photos to the image library; check the sources list.
4. Test in three stages (Actions > Auto news > Run workflow, or locally with `npm run pipeline:collect`):
   - `collect`: only logs what would be picked (2-3 days).
   - `draft`: writes stories and saves them as held drafts to read and compare with the sources (3-5 days).
   - `run` with **Auto-publish** switched on in Admin > Auto News.
5. The workflow runs every 3 hours (6 AM - 9 PM IST) and a midnight cleanup. Settings are in `config.json` > `autoNews`.

**No-AI mode:** without `GEMINI_API_KEY` (free) or `ANTHROPIC_API_KEY` the pipeline still runs. It publishes short briefs: the newspaper's own
Hindi headline and opening lines, credited and linked to the full story (`pipeline/digest.ts`). Only Hindi headlines that
name Ballia or one of its areas are used; duplicates and Begusarai (Bihar) "बलिया" stories are skipped; sexual-offence
cases are held for review. Topic and area come from keywords. Add the key later to switch to AI-written stories.
To fill the site right away: `npm run pipeline -- --force --max=40`.

**Photos** (never the newspaper's own photo; each one is copied into Supabase storage and credited in the caption):
1. Your image library (Admin > Auto News). `npm run pipeline:commons` adds free Ballia photos from Wikimedia Commons.
2. Pexels, when `PEXELS_API_KEY` is set.
3. Openverse (Creative Commons photos allowing commercial use, no key needed), searched by topic.
4. The built-in illustration. `npm run pipeline:images` gives stories that still have one a real photo.
Stock photos are "सांकेतिक तस्वीर" (symbolic); swap any unsuitable one in the story editor.

NewsData.io source: run `supabase/migrations/0003_newsdata_source.sql`, and add `NEWSDATA_API_KEY` to `.env.local`
and GitHub secrets. Its links go straight to the publisher, so the full article text can be read (free plan: news is 12 hours late).

Notes: Google News links are redirects; when the real article page cannot be fetched, the story is written from the headline
and snippet only and is automatically **held** for review instead of published.
