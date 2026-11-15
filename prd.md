# PRD — Ballia News Website

**Document type:** Product Requirements Document (plan only, no code)
**Working name:** Ballia News (बलिया न्यूज़) — change the name anywhere in this file if needed
**Built with:** Antigravity + Claude (AI coding agent)
**Version:** 1.2 (adds folder structure, data models, and admin plan)

---

## 1. What we are building

A fast, mobile-first local news website for Ballia district (Uttar Pradesh). Readers open the homepage, see the latest Ballia news, tap any story, and read the full article. A small private admin panel lets the owner publish and manage news without touching code.

**Assumptions made in this plan (edit if wrong):**

- News is written mainly in Hindi; the site layout supports Hindi (Devanagari) text properly.
- One owner / a small team publishes the news by hand through the admin panel.
- Readers do not need an account. Only the admin logs in.
- Version 1 is a website only (no mobile app).

## 2. Goals

1. A reader can find and read today's Ballia news in under 3 taps.
2. The site loads quickly on a low-cost Android phone on mobile data.
3. The owner can publish a news story with a photo in under 2 minutes.
4. Every story can be shared on WhatsApp with a proper title and image preview.
5. Stories show up on Google search (good SEO).

## 3. Not in version 1

- Reader login, comments, or user profiles
- Mobile app
- Paid subscriptions / paywall
- Automatic news import from other websites
- Live TV / live video streaming
- Multi-language switcher

These can be added later (see section 18).

## 4. Who uses it

| User | What they want |
|---|---|
| **Reader** (Ballia resident, or someone from Ballia living elsewhere) | Latest local news, quick to read, easy to share on WhatsApp |
| **Admin / Editor** (site owner) | Add, edit, and delete news easily; mark a story as breaking or featured |

---

## 5. Pages — total 14

### Public pages (8)

| # | Page | Address | Purpose |
|---|---|---|---|
| 1 | Home | `/` | Latest and top news at a glance |
| 2 | Category | `/category/[category-name]` | All news of one category |
| 3 | News Detail | `/news/[news-title]` | Full story (opens after clicking any news) |
| 4 | Search | `/search` | Find news by keyword |
| 5 | About Us | `/about` | Who runs the site |
| 6 | Contact Us | `/contact` | Phone, email, WhatsApp, and a "send us news" form |
| 7 | Privacy Policy & Terms | `/privacy` | Legal information |
| 8 | Not Found (404) | any wrong link | Friendly message + link back to Home |

### Admin pages (6) — private, login required

| # | Page | Address | Purpose |
|---|---|---|---|
| 9 | Admin Login | `/admin/login` | Email + password login |
| 10 | Dashboard | `/admin` | Counts of total, published, and draft news; most-viewed stories |
| 11 | Manage News | `/admin/news` | List of all news with search, edit, delete, publish/unpublish |
| 12 | Add / Edit News | `/admin/news/new` and `/admin/news/[id]` | The form for writing a story |
| 13 | Categories | `/admin/categories` | Add, rename, reorder, hide categories |
| 14 | Messages | `/admin/messages` | Reader messages from the contact form |

---

## 6. Page details

### 6.1 Parts shown on every public page

**Header**
- Logo and site name (left)
- Today's date in Hindi
- Category menu (scrolls sideways on mobile)
- Search icon

**Breaking news strip**
- A thin red bar under the header that scrolls breaking headlines
- Shown only when at least one story is marked "breaking"
- Tapping a headline opens that story

**Footer**
- Short "about" line
- Category links
- About, Contact, Privacy links
- Social links (Facebook, YouTube, WhatsApp channel, X)
- Copyright line

### 6.2 Home page

Sections from top to bottom:

1. **Top story** — one big featured story with large photo, headline, and 2-line summary.
2. **Next top stories** — 3 to 4 smaller featured stories beside/below the top story.
3. **Latest news (ताज़ा खबरें)** — list of the newest 10 stories with photo, headline, category tag, and time ("2 घंटे पहले"). A "Load more" button shows the next 10.
4. **Category blocks** — one block each for the main categories, showing the 4 newest stories of that category and a "See all" link to the category page.
5. **Most read (सबसे ज़्यादा पढ़ी गई)** — top 5 stories by views in the last 7 days.
6. **Video news** (optional block) — latest 3 stories that have a YouTube video.

On desktop, "Most read" sits in a right-side column. On mobile, everything stacks in one column.

### 6.3 Category page

- Category name as page title
- Stories in a card list, newest first
- 12 stories per page, with "Load more"
- If the category is empty, show "अभी कोई खबर नहीं है"

**Starting categories:**
बलिया शहर · तहसील / क्षेत्र · अपराध · राजनीति · शिक्षा · खेल · कृषि · धर्म-संस्कृति · नौकरी · उत्तर प्रदेश

The admin can add, rename, or hide categories later.

### 6.4 News Detail page (after clicking any news)

This is the most important page. From top to bottom:

1. **Path line** — Home › Category › Story
2. **Category tag** (tappable)
3. **Headline** — large, bold
4. **Short summary** — one or two lines under the headline
5. **Info line** — writer name, publish date and time, "updated" time if edited, and area (e.g., रसड़ा)
6. **Share buttons** — WhatsApp (most prominent), Facebook, X, and "Copy link"
7. **Main photo** with caption
8. **Full story text** — comfortable large font, short paragraphs, supports sub-headings, extra photos, and quotes
9. **YouTube video** (only if the story has one)
10. **Tags** — tappable keywords
11. **Share buttons again** at the end
12. **Related news (संबंधित खबरें)** — 4 stories from the same category
13. **Latest news** — 5 newest stories

**Behaviour:**
- Each open counts as one view (used for "Most read").
- When the link is shared on WhatsApp/Facebook, it shows the headline, summary, and main photo.
- On mobile, a small WhatsApp share button stays fixed at the bottom of the screen.
- If the story was deleted or unpublished, show the 404 page.

### 6.5 Search page

- Search box at the top
- Results show photo, headline, category, and date
- Searches in headline, summary, and tags
- If nothing is found: "कोई खबर नहीं मिली" and a list of latest news

### 6.6 About, Contact, Privacy

- **About:** who runs the site, mission, editor name, office address.
- **Contact:** phone, email, WhatsApp number, plus a simple form (name, phone, message) so readers can send news tips. Submissions appear in the admin dashboard.
- **Privacy & Terms:** plain text page, including a note on third-party ads (Adsterra) and cookies.

### 6.7 Admin pages

**Login** — email and password. Wrong password shows a clear error. No public sign-up.

**Dashboard** — four number cards (total news, published, drafts, today's views), list of 5 most-viewed stories, and latest reader messages from the contact form.

**Manage News** — table with headline, category, status (draft/published), date, and views. Search box and category filter. Buttons to edit, delete (with a confirmation), and publish/unpublish.

**Add / Edit News form fields:**

| Field | Required | Notes |
|---|---|---|
| Headline | Yes | |
| Short summary | Yes | Max about 200 characters |
| Full story | Yes | Rich text editor: bold, sub-heading, list, quote, image, link |
| Main photo | Yes | Upload from phone or computer; auto-compressed |
| Photo caption | No | |
| Category | Yes | Pick from list |
| Area / tehsil | No | e.g., बलिया सदर, बांसडीह, रसड़ा, बेल्थरा रोड, सिकंदरपुर, बैरिया |
| Tags | No | |
| YouTube link | No | |
| Writer name | No | Defaults to site name |
| Breaking news | No | On/off switch |
| Featured (top story) | No | On/off switch |
| Status | Yes | Draft or Published |

The page address (slug) is created automatically from the headline.

Roles, all admin workflows, and safety rules are in **section 11 (Admin plan)**.

---

## 7. Features list

### Must have (version 1)

- [ ] Home page with top story, latest news, category blocks, most read
- [ ] Category pages
- [ ] News detail page with share buttons and related news
- [ ] Breaking news strip
- [ ] Search
- [ ] About, Contact (with form), Privacy pages
- [ ] Admin login
- [ ] Add, edit, delete, publish/unpublish news
- [ ] Category management and Messages pages in admin
- [ ] Admin and Editor roles (section 11.1)
- [ ] Photo upload with automatic compression
- [ ] View counter and "Most read"
- [ ] Correct WhatsApp / Facebook link previews
- [ ] SEO basics: page titles, descriptions, sitemap, news-article structured data
- [ ] Fully responsive (mobile, tablet, desktop)
- [ ] Proper Hindi font and readable text size
- [ ] Adsterra ads with user-friendly placement and limits (section 14)
- [ ] All site settings and ad switches read from `config.json` (section 15)

### Good to have (if time allows)

- [ ] Dark mode
- [ ] Schedule a story to publish later

---

## 8. Tech stack

Chosen to be simple, low-cost (free tiers to start), and easy for an AI coding agent to build.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router) with **TypeScript** | Fast pages, great SEO, one project for site + admin |
| Styling | **Tailwind CSS** | Quick, consistent, responsive design |
| UI components | **shadcn/ui** | Ready-made buttons, forms, tables for the admin panel |
| Database | **Supabase** (PostgreSQL) | Stores news, categories, messages; free tier available |
| Admin login | **Supabase Auth** | Email + password, no custom security code needed |
| Image storage | **Supabase Storage** | Stores uploaded news photos |
| Text editor | **Tiptap** | Simple rich text editor for writing stories |
| Hindi font | **Noto Sans Devanagari** (Google Fonts) | Clean and readable Hindi |
| Hosting | **Vercel** | One-click deploy for Next.js; free tier available |
| Analytics | **Google Analytics** (or Microsoft Clarity) | See visitor counts and behaviour |
| Ads | **Adsterra** (Native, Banner, Social Bar, Popunder, Smartlink) | Monetization — see section 14 |
| Site settings | **config.json** | One file for names, links, categories, and ad switches — see section 15 |

Full details of the stored data are in **section 10 (Data models)**.

---

## 9. Folder structure

A simple Next.js layout. Each folder has one clear job, so the AI agent and the owner can always find things.

```
ballia-news/
├── prd.md                  ← this plan
├── config.json             ← site settings and ad switches (section 15)
├── .env.local              ← secret keys only (never shared, never uploaded to GitHub)
├── README.md               ← how to run the project
│
├── public/                 ← files served as they are
│   ├── logo.png
│   ├── favicon.ico
│   ├── default-news.jpg    ← used when a story photo is missing
│   └── ads.txt             ← only if Adsterra provides a line for it
│
├── src/
│   ├── app/                ← every page of the website
│   │   ├── (site)/         ← public pages
│   │   │   ├── home page
│   │   │   ├── category/[slug]/
│   │   │   ├── news/[slug]/
│   │   │   ├── search/
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── privacy/
│   │   ├── admin/          ← private pages (login required)
│   │   │   ├── login/
│   │   │   ├── dashboard (admin home)
│   │   │   ├── news/       ← list, new/, [id]/ edit
│   │   │   ├── categories/
│   │   │   └── messages/
│   │   ├── not-found       ← 404 page
│   │   ├── sitemap         ← auto sitemap for Google
│   │   └── robots          ← search engine rules
│   │
│   ├── components/         ← reusable building blocks
│   │   ├── layout/         ← header, footer, breaking strip, menu
│   │   ├── news/           ← news cards, top story, share buttons, related news
│   │   ├── ads/            ← one block per ad format (native, banner, social bar, popunder, smartlink)
│   │   ├── admin/          ← news form, tables, number cards, editor
│   │   └── ui/             ← shadcn/ui basics (buttons, inputs, dialogs)
│   │
│   ├── lib/                ← shared helpers
│   │   ├── supabase        ← database connection
│   │   ├── config          ← reads config.json
│   │   ├── dates           ← Hindi dates and "2 घंटे पहले" style times
│   │   └── seo             ← page titles, share previews, structured data
│   │
│   ├── types/              ← shapes of News, Category, Message, Profile
│   └── middleware          ← blocks /admin pages without login
│
└── supabase/
    ├── migrations/         ← database tables and access rules
    └── seed/               ← starting categories and sample news
```

**Rules:** one component per file; file and folder names in English and lowercase-with-dashes; reader-facing text in Hindi.

---

## 10. Data models

Five tables in Supabase. Plain descriptions — the agent turns these into the real tables.

### 10.1 News

| Field | Type | Required | Notes |
|---|---|---|---|
| id | unique ID | auto | |
| headline | text | Yes | |
| slug | text | auto | Made from headline; must be unique; used in the page address |
| summary | text | Yes | Up to about 200 characters |
| content | rich text | Yes | Full story from the editor |
| main_image | link to photo | Yes | Stored in Supabase Storage |
| image_caption | text | No | |
| category_id | link → Categories | Yes | |
| area | text | No | One of the areas in `config.json` |
| tags | list of text | No | |
| youtube_url | text | No | |
| writer_name | text | No | Defaults to site name |
| author_id | link → Profiles | auto | Who created it |
| is_breaking | yes/no | auto: no | |
| is_featured | yes/no | auto: no | |
| status | draft / published | Yes | |
| view_count | number | auto: 0 | Total views ever |
| published_at | date & time | auto | Set when first published |
| created_at / updated_at | date & time | auto | |

### 10.2 Categories

| Field | Type | Required | Notes |
|---|---|---|---|
| id | unique ID | auto | |
| name | text | Yes | Hindi name, e.g., अपराध |
| slug | text | Yes | English, e.g., `crime`; unique |
| display_order | number | Yes | Order in the menu |
| show_on_home | yes/no | Yes | Show a block on the Home page |
| is_visible | yes/no | Yes | Hidden categories disappear from the site |

### 10.3 Daily views

Used for "Most read in the last 7 days".

| Field | Type | Notes |
|---|---|---|
| news_id | link → News | |
| date | date | |
| views | number | Increases by 1 for each open that day |

### 10.4 Messages (from the contact form)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | unique ID | auto | |
| name | text | Yes | |
| phone | text | Yes | |
| message | text | Yes | |
| status | new / read / done | auto: new | |
| created_at | date & time | auto | |

### 10.5 Profiles (admin team)

Login itself is handled by Supabase Auth; this table stores the extra details.

| Field | Type | Notes |
|---|---|---|
| id | same as login user ID | |
| full_name | text | |
| role | admin / editor | See section 11.1 |
| is_active | yes/no | Turn off to block a person without deleting them |

### 10.6 How the tables connect

- One **Category** has many **News**.
- One **Profile** (writer) has many **News**.
- One **News** has many **Daily views** rows (one per day).
- **Messages** stand alone.

### 10.7 Access rules

| Who | News | Categories | Daily views | Messages | Profiles |
|---|---|---|---|---|---|
| Public reader | Read **published** only | Read visible only | Add a view only | Send only | None |
| Editor | Create; edit own | Read | Read | Read, mark as read | Read own |
| Admin | Everything | Everything | Read | Everything | Everything |

**Photos:** anyone can view; only logged-in team members can upload; only admin can delete.

---

## 11. Admin plan

### 11.1 Roles

| Role | Can do | Cannot do |
|---|---|---|
| **Admin** (owner) | Everything: publish, edit any story, delete, manage categories, read messages, add/remove team members | — |
| **Editor** (reporter) | Write stories, edit their own stories, upload photos, send stories for review, read messages | Publish, delete, change categories, manage team |

Version 1 can start with only the Admin. The Editor role is ready for when reporters join.

### 11.2 Admin pages (6)

| Page | What it has |
|---|---|
| **Login** | Email + password, "show password", clear error message. No public sign-up — the admin adds team members |
| **Dashboard** | Number cards: total news, published, drafts, today's views. Lists: top 5 stories this week, 5 newest messages, my latest drafts. Big **"+ नई खबर"** button |
| **Manage News** | Table: headline, category, writer, status, date, views. Filters: status, category, date. Search. Actions: edit, view on site, publish/unpublish, delete |
| **Add / Edit News** | The form in section 6.7, plus **Save draft**, **Preview**, and **Publish** buttons. Auto-saves a draft every 30 seconds |
| **Categories** | Add, rename, reorder, show/hide, "show on Home" switch. A category with stories cannot be deleted — only hidden |
| **Messages** | Contact form messages with new/read/done status, a one-tap "call" and "WhatsApp" button for each |

All admin pages work well on a phone, since news is often posted from the field. No ads appear on any admin page.

### 11.3 Main workflows

**Publish a story (target: under 2 minutes)**
1. Tap **+ नई खबर**.
2. Fill headline, summary, story; upload photo; pick category and area.
3. Tap **Preview** to see it as readers will.
4. Tap **Publish** (admin) or **Send for review** (editor).
5. The story appears on Home and its category page at once; a WhatsApp share button appears so the admin can share it immediately.

**Breaking news**
1. Switch on **Breaking** in the story form and publish.
2. The headline appears in the red strip on every page.
3. Breaking turns off automatically after **24 hours** (or the admin turns it off sooner).

**Featured / top story**
- Only one story is the main top story at a time; the next 3–4 featured stories fill the boxes beside it. Marking a new top story moves the old one down automatically.

**Correction or update**
- Edit the story and save. The page shows "अपडेट: [time]" so readers know it changed. The page address stays the same, so shared links keep working.

**Remove a story**
- Preferred: **Unpublish** (hidden from readers, kept in admin).
- Permanent **Delete**: admin only, with a "Are you sure?" confirmation.

**Reader messages**
- New messages show a count badge in the admin menu. Mark each as read, then done after action is taken.

### 11.4 Admin safety

- Admin pages are blocked for anyone not logged in.
- Strong passwords required; login stops for a few minutes after 5 wrong tries.
- Automatic logout after 7 days of no use.
- Every story records who created it and when it was last changed.
- **Backup:** download a database backup from Supabase once a week and keep it on Google Drive or a computer.

### 11.5 Daily admin routine (suggested)

| Time | Task |
|---|---|
| Morning | Publish the morning's top stories; set today's top story |
| During the day | Post news as it happens; use Breaking for big events |
| Evening | Check new messages; review editor drafts |
| Weekly | Check Adsterra earnings vs. visitors (section 14.4); download backup |

---

## 12. Design guidelines

- **Look:** clean, newspaper-like, white background, one strong accent colour (red suggested for a news feel).
- **Mobile first:** design for a 360px-wide phone first, then scale up.
- **Text:** body text large enough for comfortable Hindi reading (around 17–18px on mobile), generous line spacing.
- **Images:** same shape (16:9) everywhere so cards line up; load lazily.
- **Speed:** pages should feel instant; show placeholder shapes while content loads.
- **Simple navigation:** every page reachable within 2 taps from Home.

## 13. Quality requirements

| Area | Target |
|---|---|
| Speed | Home page usable within about 2.5 seconds on a 4G phone |
| SEO | Unique title and description on every page; sitemap; clean readable addresses |
| Security | Admin pages blocked without login; database protected by access rules; secret keys never in the public code |
| Accessibility | Good colour contrast, image descriptions, works with keyboard |
| Reliability | Friendly error and empty states everywhere — never a blank page |

---

## 14. Monetization — Adsterra ads (user-experience first)

**Main idea:** ads are on the site all the time, but the news always comes first. A reader should never feel that ads are blocking the story. Happy readers come back daily, and returning readers earn more over time than one aggressive pop-up.

### 14.1 Ad formats used and where they go

| Format | Role | Where it appears | UX rule |
|---|---|---|---|
| **Native Banner** | Main, steady earner | Home: inside "Latest news" after every 5th story. Category page: after every 6th story. News detail: after paragraph 3 and just above "Related news" | Looks like a news card but always labelled **"प्रायोजित (Sponsored)"** |
| **Display Banner** | Support earner | Desktop: 300×250 in the right column (sticky) and 728×90 above the footer. Mobile: 300×250 at the end of the article and 320×100 above the footer | Space is reserved before the ad loads, so the page never "jumps" |
| **Social Bar** | High earner, light | All public pages, one per page | Shows only after **10 seconds** or after the reader scrolls half the page. Placed so it **never covers the WhatsApp share button** or the headline |
| **Popunder** | Highest earner, most intrusive | **News detail page only** | Never on the first page a new visitor opens. Maximum **1 per visitor per 24 hours**. Fires only after the reader taps something on the page |
| **Smartlink** | Extra earner, zero intrusion | A clearly labelled **"Sponsored"** link in the footer and on the 404 page; also usable in the owner's own social media posts | Never disguised as a news headline and never replaces a news share link |

**Turned off on purpose:** Interstitial (full-screen) ads and In-Page Push style options inside Social Bar. Full-screen ads hurt both readers and Google search ranking on mobile.

### 14.2 Ad limits per page

| Page | Native | Banner | Social Bar | Popunder |
|---|---|---|---|---|
| Home | up to 2 | 1 (mobile) / 2 (desktop) | Yes | No |
| Category | up to 2 | 1 | Yes | No |
| News Detail | 2 | 1 (mobile) / 2 (desktop) | Yes | Yes (capped) |
| Search | 1 | 0 | Yes | No |
| About, Contact, Privacy, 404 | 0 | 0 | No | No (404 shows Smartlink only) |
| All admin pages | **No ads at all** | | | |

### 14.3 UX rules (must follow)

1. **No ad above the headline** on the news detail page — the reader sees the story first.
2. **Every ad is labelled** "प्रायोजित / Sponsored".
3. **Ads load after the news.** Ad scripts start only after the page content has loaded, so ads never slow down the story.
4. **Ads load only when needed.** In-feed and bottom ads load when the reader scrolls near them.
5. **No layout jump.** Each ad slot has a fixed size reserved in advance.
6. **No ads in forms** (contact form, search box area, admin).
7. **Ad-blocker users can still read.** No "turn off your ad blocker" wall.
8. **One switch to turn any format off** — every format can be enabled or disabled in `config.json` (section 15) without changing pages.
9. **Bad ad reporting:** if a misleading or adult ad appears, report it to Adsterra support and ask for mainstream / family-safe ads only.
10. **Privacy page mentions third-party ads** and cookies used by the ad network.

### 14.4 Roll-out strategy (earn more without losing readers)

| Week | What is switched on | What to watch |
|---|---|---|
| 1 | Native Banner + Display Banner | Page speed and normal reading time (baseline) |
| 2 | + Social Bar | Earnings vs. bounce rate |
| 3 | + Popunder (news detail only, capped) | Returning visitors should not drop |
| 4 onward | + Smartlink in footer, 404, and social posts | Weekly review |

**Weekly review:** compare Adsterra earnings with Google Analytics (visitors, returning visitors, time on page). If returning visitors fall by more than about 10%, reduce the popunder first, then the Social Bar. Change only **one** setting per week so the effect is clear.

**Note:** Google AdSense does not allow popunders. If AdSense is added later, turn the popunder off in `config.json`.

---

## 15. App configuration — `config.json`

One settings file at the project root controls the whole site, so the owner can change names, links, categories, and ads **without editing pages**.

**Rules:**
- Pages read all site names, links, categories, and ad settings from this file — nothing is hard-coded.
- **Secret keys** (Supabase, admin passwords) never go here; they stay in the private environment file.
- Adsterra keys go here, since they are already visible in the page.

**Sample structure** (replace the placeholder values):

```json
{
  "site": {
    "name": "बलिया न्यूज़",
    "nameEnglish": "Ballia News",
    "tagline": "बलिया की हर खबर, सबसे पहले",
    "url": "https://www.yourdomain.com",
    "language": "hi",
    "logo": "/logo.png",
    "themeColor": "#D32F2F",
    "darkMode": false
  },
  "contact": {
    "email": "news@yourdomain.com",
    "phone": "+91XXXXXXXXXX",
    "whatsapp": "+91XXXXXXXXXX",
    "address": "बलिया, उत्तर प्रदेश"
  },
  "social": {
    "facebook": "",
    "youtube": "",
    "whatsappChannel": "",
    "x": "",
    "instagram": ""
  },
  "categories": [
    { "name": "बलिया शहर", "slug": "ballia-city", "showOnHome": true },
    { "name": "अपराध", "slug": "crime", "showOnHome": true },
    { "name": "राजनीति", "slug": "politics", "showOnHome": true },
    { "name": "शिक्षा", "slug": "education", "showOnHome": true },
    { "name": "खेल", "slug": "sports", "showOnHome": false }
  ],
  "areas": ["बलिया सदर", "बांसडीह", "रसड़ा", "बेल्थरा रोड", "सिकंदरपुर", "बैरिया"],
  "homepage": {
    "latestNewsCount": 10,
    "mostReadDays": 7,
    "showVideoBlock": true
  },
  "features": {
    "breakingStrip": true,
    "search": true,
    "contactForm": true,
    "viewCounter": true,
    "stickyWhatsappShare": true
  },
  "analytics": {
    "googleAnalyticsId": "G-XXXXXXX",
    "clarityId": ""
  },
  "ads": {
    "enabled": true,
    "label": "प्रायोजित",
    "loadAfterContent": true,
    "excludedPages": ["/about", "/contact", "/privacy", "/admin"],
    "nativeBanner": {
      "enabled": true,
      "key": "ADSTERRA_NATIVE_KEY",
      "homeEvery": 5,
      "categoryEvery": 6,
      "articleAfterParagraph": 3,
      "maxPerPage": 2
    },
    "displayBanner": {
      "enabled": true,
      "desktopSidebar": { "key": "ADSTERRA_300x250_KEY", "sticky": true },
      "desktopFooter": { "key": "ADSTERRA_728x90_KEY" },
      "mobileArticleEnd": { "key": "ADSTERRA_300x250_KEY" },
      "mobileFooter": { "key": "ADSTERRA_320x100_KEY" }
    },
    "socialBar": {
      "enabled": true,
      "key": "ADSTERRA_SOCIALBAR_KEY",
      "delaySeconds": 10,
      "orShowAfterScrollPercent": 50
    },
    "popunder": {
      "enabled": false,
      "key": "ADSTERRA_POPUNDER_KEY",
      "pages": ["newsDetail"],
      "maxPerDay": 1,
      "skipFirstPageView": true
    },
    "smartlink": {
      "enabled": false,
      "url": "https://ADSTERRA_SMARTLINK_URL",
      "text": "Sponsored",
      "showInFooter": true,
      "showOn404": true
    }
  }
}
```

The `categories` list is only the **starting list** used to fill the database the first time; after that, categories are managed from the admin Categories page.

Popunder and Smartlink start as `false` so they can be switched on in weeks 3 and 4 of the roll-out plan.

---

## 16. Execution plan

Build in 7 phases. **Finish and test each phase before starting the next.**

### Phase 1 — Project setup
- Create the Next.js project with TypeScript and Tailwind CSS
- Add shadcn/ui and the Hindi font
- Set up folder structure and the colour theme
- **Done when:** a blank styled page runs locally with Hindi text displaying correctly

### Phase 2 — Database and sample data
- Create the Supabase project
- Create the News, Categories, Daily views, Messages, and Profiles tables with the access rules in section 10.7
- Set up the folder structure from section 9
- Create the image storage bucket
- Add the starting categories and 15–20 sample news stories
- **Done when:** sample news and categories are visible in the Supabase dashboard

### Phase 3 — Public pages
- Header, breaking strip, and footer
- Home page with all sections
- Category page
- News detail page with share buttons, related news, and view counting
- Search page
- About, Contact (form saves to database), Privacy, and 404
- **Done when:** a visitor can browse from Home → Category → News detail → Share, on both mobile and desktop

### Phase 4 — Admin panel
- Admin login and route protection
- Dashboard
- Manage News list
- Add / Edit News form with rich text editor, photo upload, preview, and auto-save
- Categories and Messages pages
- Admin and Editor roles; breaking news auto-off after 24 hours
- **Done when:** the admin can log in, publish a new story with a photo, and see it on the Home page

### Phase 5 — SEO, sharing, and polish
- Page titles, descriptions, and social preview images for every story
- Sitemap and robots file
- News-article structured data
- Loading states, empty states, and error states
- Speed check and image optimisation
- **Done when:** a story link pasted in WhatsApp shows the headline and photo, and the speed target is met

### Phase 6 — Ads and config.json
- Create `config.json` and make all pages read settings from it
- Create the Adsterra account, add the website, and create the ad units
- Add ad slots in the places listed in section 14.1, with reserved space and "प्रायोजित" labels
- Add Social Bar delay, popunder daily limit, and page exclusions
- Check page speed again with ads switched on
- **Done when:** turning any ad format on/off in `config.json` works, no ad appears on admin/contact/privacy pages, and pages do not jump when ads load

### Phase 7 — Launch
- Deploy to Vercel
- Connect the domain name
- Add analytics
- Create the real admin account and remove sample news
- Final test on a real Android phone and a desktop
- **Done when:** the live site is working on the real domain

### Final test checklist

- [ ] Home page loads and shows latest news
- [ ] Clicking any news opens the correct detail page
- [ ] WhatsApp share shows headline + photo
- [ ] Category and search pages work
- [ ] Contact form message reaches the admin dashboard
- [ ] Admin pages cannot be opened without login
- [ ] New story published from admin appears on Home
- [ ] Draft stories are NOT visible to the public
- [ ] Editor cannot publish or delete; Admin can
- [ ] Breaking news strip clears itself after 24 hours
- [ ] Site looks right on mobile, tablet, and desktop
- [ ] Hindi text displays correctly everywhere
- [ ] No ad above the headline on the news detail page
- [ ] Social Bar never covers the WhatsApp share button
- [ ] Popunder shows at most once per day, only on news detail
- [ ] No ads on admin, contact, and privacy pages
- [ ] Changing a value in `config.json` changes the site

---

## 17. How to use this file with Antigravity + Claude

1. Keep this `prd.md` in the root of the project folder.
2. Start by asking the agent to **read `prd.md` fully and summarise the plan back** before writing anything.
3. Build **one phase at a time**. Example instruction: *"Read prd.md and complete Phase 1 only. Stop and show me the result when the 'Done when' condition is met."*
4. After each phase, check the result in the browser preview, then say *"Phase 1 approved, continue with Phase 2."*
5. When the agent needs Supabase or Vercel keys, create those accounts yourself and paste the keys only into the local environment file — never into chat logs or public code.
6. If you want to change something, **update this file first**, then ask the agent to follow the updated PRD. This keeps the plan and the site in sync.

### Rules for the AI agent

- Follow this PRD; do not add features that are not listed.
- Ask before changing the tech stack.
- Keep the code simple and readable; prefer fewer files and libraries.
- All reader-facing labels are in Hindi; admin panel labels can be in English.
- Test each phase against its "Done when" line before reporting it complete.

---

## 18. Later versions (ideas)

- Reader comments
- Push notifications for breaking news
- E-paper (PDF edition)
- Hindi/English language switch
- Android app
- Area-wise pages for each tehsil

## 19. Open questions for the owner

1. Final site name and domain?
2. Logo and brand colour?
3. Hindi only, or Hindi + English?
4. Adsterra account ready? Which week should popunder be switched on?
5. One admin, or several reporters?
6. Is there an existing website or Facebook/YouTube page whose content should be linked?
