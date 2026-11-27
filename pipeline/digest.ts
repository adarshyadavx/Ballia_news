// No-AI mode: used when neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is set.
// Each story becomes a short brief: the publisher's own headline and summary, credited to the
// publisher and linked to the full story. Nothing is invented; topic and area come from keywords.
import type { Item } from "./collect";
import { baseConfig, jaccard, type AutoCfg } from "./lib";

const hasHindi = (s: string) => /[ऀ-ॿ]/.test(s);

// First match wins, so the more specific topics come first.
const TOPICS: [slug: string, re: RegExp][] = [
  ["crime", /पुलिस|थाना|गिरफ्तार|हत्या|चोरी|लूट|मारपीट|फायरिंग|गोली|मुकदमा|अपराध|ठगी|हिरासत|जेल|अदालत|न्यायालय|कोर्ट|सजा|गैंगस्टर|तस्कर|छापेमारी|फरार/],
  ["politics", /विधायक|सांसद|मंत्री|चुनाव|भाजपा|सपा|बसपा|कांग्रेस|सुभासपा|पार्टी|नेता|जिला पंचायत|मतदाता|वोटर/],
  ["education", /स्कूल|विद्यालय|कॉलेज|महाविद्यालय|विश्वविद्यालय|परीक्षा|छात्र|छात्रा|शिक्षक|शिक्षा|प्रवेश/],
  ["sports", /खेल|क्रिकेट|फुटबॉल|कबड्डी|वॉलीबॉल|खिलाड़ी|टूर्नामेंट|मैच/],
  ["agriculture", /किसान|खेती|फसल|धान|गेहूं|गेहूँ|खाद|बीज|मंडी|सिंचाई|पशुपालन/],
  // Bare "भर्ती" also means admitted to hospital ("मरीज भर्ती"), so only job phrases count.
  ["jobs", /नौकरी|रोजगार|रोज़गार|वैकेंसी|नियुक्ति|भर्ती\s*(?:परीक्षा|प्रक्रिया|अभियान|रैली|निकली)|पदों\s*पर\s*भर्ती|करेंगी\s*भर्ती/],
  ["culture", /मेला|मंदिर|पूजा|आरती|कथा|जयंती|पर्व|त्योहार|त्यौहार|स्नान|धार्मिक|संस्कृति|साहित्य|कवि|सम्मेलन|ददरी/],
];

const AREAS: [area: string, re: RegExp][] = [
  ["बांसडीह", /बांसडीह|बाँसडीह/],
  ["रसड़ा", /रसड़ा|रसडा/],
  ["बेल्थरा रोड", /बेल्थरा\s*रोड|बेल्थरारोड/],
  ["सिकंदरपुर", /सिकंदरपुर|सिकन्दरपुर/],
  ["बैरिया", /बैरिया/],
];

// English words for a stock photo search (only used when PEXELS_API_KEY is set).
// English words for a photo search (Openverse, or Pexels when PEXELS_API_KEY is set).
export const PHOTO_WORDS: Record<string, string> = {
  crime: "india police", politics: "india election rally", education: "india school classroom", sports: "india football match",
  agriculture: "india farmer field", jobs: "india office", culture: "ganga ghat", tehsil: "uttar pradesh village",
  "ballia-city": "uttar pradesh town", "uttar-pradesh": "uttar pradesh", accident: "india highway traffic",
};
const ACCIDENT = /हादसा|हादसे|दुर्घटना|टक्कर|सड़क\s*हादसे/;

// Photo topic can differ from the news category: a road accident gets a road photo.
export function photoTopic(category: string, headline: string): { photoCategory: string; keywords: string } {
  const photoCategory = ACCIDENT.test(headline) ? "accident" : category;
  return { photoCategory, keywords: PHOTO_WORDS[photoCategory] ?? PHOTO_WORDS["ballia-city"] };
}

export type Pick =
  | { ok: true; category: string; area: string; tags: string[]; keywords: string; photoCategory: string; sensitive: boolean }
  | { ok: false; reason: string };

// Sexual offences and similar cases are never published without a human (or AI) check.
const SENSITIVE = /दुष्कर्म|बलात्कार|यौन|गैंगरेप|छेड़छाड़|छेड़खानी|पॉक्सो|pocso|अश्लील|आत्महत्या/i;
// Begusarai (Bihar) has its own "बलिया"; those stories are not about Ballia, UP.
// Bihar also has a Balia block (Begusarai) and a "बलिया मोड़" in Manjhi (Saran), across the river.
const OTHER_BALLIA = /बेगूसराय|begusarai|बिहार|bihar|बलिया\s*मोड़|मांझी|सारण/i;

// Zero-width characters sometimes sit inside Hindi words (e.g. "बल‍िया").
const norm = (s: string) => s.replace(/[​-‍⁠﻿]/g, "");

const STOP = new Set(("के में की का से को ने पर और है हैं था थी हुआ हुई हुए गया गई गए एक लिए बाद साथ बीच दौरान किया किए दी दिया " +
  "करने कर रहा रहे रही होगी होगा होंगे बोले यह वह भी तो ही news ballia बलिया जिले जिला").split(" "));
const words = (t: string) => new Set(norm(t).toLowerCase().split(/[\s\p{P}\p{S}]+/u).filter((w) => w.length > 1 && !STOP.has(w)));

// Same event told in different words: enough shared key words, measured against the shorter headline.
export function sameEvent(a: string, b: string): boolean {
  const A = words(a), B = words(b);
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared >= 3 && shared / Math.min(A.size, B.size) >= 0.35;
}

// Keywords must start a word ("मंडी" matches "मंडी में", not part of a longer word).
const startsWord = (re: RegExp) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${re.source})`, "iu");
const TOPIC_RES = TOPICS.map(([slug, re]) => [slug, startsWord(re)] as const);

export function pickBrief(cfg: AutoCfg, item: Item, recent: string[]): Pick {
  const raw = norm(item.title);
  const title = cleanHeadline(raw);
  if (!hasHindi(title)) return { ok: false, reason: "not Hindi" };
  // Ballia or one of its areas must be in the headline itself (a "Ballia News:" prefix counts, and so does
  // Amar Ujala's "Balia News:" spelling; the Begusarai check below still applies).
  const named = cfg.keywords.some((k) => raw.toLowerCase().includes(k.toLowerCase())) || /^\s*balia\s*news\s*[:\-–|]/i.test(raw);
  if (!named) return { ok: false, reason: "not about Ballia" };
  if (OTHER_BALLIA.test(raw)) return { ok: false, reason: "Begusarai/Bihar" };
  if (recent.some((h) => jaccard(h, title) >= 0.5 || sameEvent(h, title))) return { ok: false, reason: "duplicate" };

  const text = norm(`${title} ${item.snippet}`);
  const area = AREAS.find(([, re]) => re.test(text))?.[0] ?? "";
  // Topic from the headline first; the snippet only when the headline gives no clue.
  // Road accidents go to the local category ("स्कूली वैन की टक्कर" is not education news).
  const accident = /हादसा|हादसे|दुर्घटना|टक्कर/.test(title);
  const topic = accident ? undefined : TOPIC_RES.find(([, re]) => re.test(title))?.[0] ?? TOPIC_RES.find(([, re]) => re.test(text))?.[0];
  const category = topic ?? (area ? "tehsil" : "ballia-city");
  const catName = baseConfig.categories.find((c) => c.slug === category)?.name;
  const tags = [area || "बलिया", ...(topic && catName ? [catName] : [])];
  return { ok: true, category, area, tags, ...photoTopic(category, title), sensitive: SENSITIVE.test(text) };
}

export function cleanHeadline(t: string): string {
  return norm(t)
    .replace(/^\s*(ballia\s*news|balia\s*news|ballia|बलिया\s*न्यूज़?|up\s*news)\s*[:\-–|]\s*/i, "")
    // Other English labels before a Hindi headline ("Purvanchal Weather: ...", "UP Petrol Diesel Price: ...")
    .replace(/^\s*[A-Za-z][A-Za-z0-9 .,&'’-]{1,50}\s*:\s*(?=[ऀ-ॿ])/, "")
    .replace(/\s+[-–|]\s+[A-Za-z0-9 ,.'’!?&-]+$/, "") // trailing " - Ballia News" or an English web-address tail
    .replace(/\s+/g, " ")
    .trim()
    // Feeds cut long headlines ("मुख्य बात: ब्योरा ..."). Keep the complete part before the colon when it still
    // names the place; otherwise keep the whole headline with a clean ellipsis.
    .replace(/^(.{15,}?):\s.*?(?:\.{3}|…)$/, (all, head: string) => (PLACE.test(head) ? head : all.replace(/\s*(?:\.{3}|…)$/, "…")));
}

const PLACE = /बलिया|ballia|बांसडीह|बाँसडीह|रसड़ा|रसडा|बेल्थरा|सिकंदरपुर|सिकन्दरपुर|बैरिया/i;

// Headline for the site: at most `max` characters, ending on a whole word.
export function shortHeadline(t: string, max = 120): string {
  const h = cleanHeadline(t);
  if (h.length <= max) return h;
  const cut = h.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:!-]+$/, "")}…`;
}

// Cut at a sentence or word end so the summary never stops mid-word.
function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf("।"), cut.lastIndexOf(". "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// True when `s` adds almost nothing beyond the headline (e.g. Google's snippet = headline + publisher).
function repeatsHeadline(s: string, headline: string): boolean {
  const S = words(s.replace(/[A-Za-z][A-Za-z.]*/g, " ")), H = words(headline); // ignore English tails / publisher names
  let shared = 0;
  for (const w of S) if (H.has(w)) shared++;
  return S.size - shared < 4;
}

// The first one or two sentences of the article: a short credited quote, like a search result.
function lead(text: string): string {
  let t = norm(text).replace(/\s+/g, " ").trim();
  // Some pages put a photo caption first; the story starts at the place-name dateline ("बलिया। ...").
  const dateline = t.slice(0, 300).search(/(?<![\p{L}\p{M}])(बलिया|बांसडीह|रसड़ा|बेल्थरा\s*रोड|सिकंदरपुर|सिकन्दरपुर|बैरिया|इंदरपुर|नगरा|मनियर|फेफना|चितबड़ागांव|रेवती|हल्दी|बांसडीहरोड)।\s/u);
  if (dateline > 0) t = t.slice(dateline);
  const sentences = t.match(/[^।!?]+[।!?]/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > 260) break;
    out += s;
  }
  return out.trim();
}

export function buildBrief(item: Item, article: { url: string; excerpt: string; text: string }, area: string) {
  const headline = shortHeadline(item.title);
  // The publisher's own words, in order of preference: share description, feed snippet, opening
  // sentences of the article. Only Hindi text that says more than the headline is used.
  const candidates = [article.excerpt, item.snippet, lead(article.text)].map((s) => norm(s).replace(/\s+/g, " ").trim());
  const own = candidates.find((s) => s.length > 40 && hasHindi(s) && !repeatsHeadline(s, headline) && !repeatsHeadline(s, norm(item.title)));
  const summary = own
    ? clip(own, 280)
    : `${area || "बलिया"} से जुड़ी यह खबर ${item.publisher} ने प्रकाशित की है। पूरी जानकारी के लिए मूल खबर पढ़ें।`;
  const content =
    `<p>${esc(summary)}</p>` +
    `<p><a href="${esc(article.url)}">पूरी खबर ${esc(item.publisher)} पर पढ़ें →</a></p>`;
  return { headline, summary, content };
}
