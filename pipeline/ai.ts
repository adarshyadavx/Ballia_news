// Steps 3, 5, 6: relevance filter, Hindi writing, safety + fact check.
import { askJson, modelFor, words, type AutoCfg } from "./lib";
import { baseConfig } from "./lib";

const cats = baseConfig.categories.map((c) => `${c.slug} (${c.name})`).join(", ");
const areas = baseConfig.areas.join(", ");

export type Relevance = { score: number; duplicate: boolean; category: string; area: string; tags: string[]; english_keywords: string };

export async function filterItem(cfg: AutoCfg, item: { title: string; snippet: string; publisher: string }, recent: string[]) {
  const rel = await askJson<Relevance>(modelFor(cfg, "filter"),
    `You screen news for a Ballia (Uttar Pradesh, India) district news site. Score how clearly the story is about Ballia district or a place inside it (${areas}).`,
    `Headline: ${item.title}\nSnippet: ${item.snippet}\nPublisher: ${item.publisher}\n\nRecently published headlines:\n${recent.slice(0, 30).map((h) => `- ${h}`).join("\n") || "(none)"}\n\n` +
    `JSON keys: score (0-100, only high if the event happens in Ballia district), duplicate (true if same event as a recent headline), ` +
    `category (one slug of: ${cats}), area (one of: ${areas}, or ""), tags (up to 4 short Hindi tags), english_keywords (3-4 English words describing a generic stock photo for this story, no names).`);
  if (rel) {
    // Some models return lists where a string is expected; keep the pipeline robust to that.
    const kw: unknown = rel.english_keywords;
    rel.english_keywords = Array.isArray(kw) ? kw.join(" ") : String(kw ?? "");
    rel.tags = Array.isArray(rel.tags) ? rel.tags.map(String) : [];
    rel.area = String(rel.area ?? ""); rel.category = String(rel.category ?? "");
  }
  return rel;
}

export type Written = { headline: string; summary: string; body: string; breaking: boolean };

export async function writeStory(cfg: AutoCfg, input: { title: string; snippet: string; text: string; sources: string[] }) {
  const { min, max } = cfg.wordCount;
  return askJson<Written>(modelFor(cfg, "write"),
    `You are a careful Hindi news writer for a Ballia local news website. Rules: 1) write in your own words, never copy sentences from the source; ` +
    `2) use ONLY facts present in the material given, no guesses, no opinions, no invented names, numbers or quotes; ` +
    `3) neutral simple Hindi; attribute claims ("पुलिस के अनुसार", "प्रशासन के अनुसार"); 4) never name victims of sexual offences or child victims; ` +
    `5) never call an accused person guilty; 6) do not write the source line, it is added separately.`,
    `Source headline: ${input.title}\nSnippet: ${input.snippet}\nSource text:\n${input.text || "(not available, use the headline and snippet only)"}\nPublishers: ${input.sources.join(", ")}\n\n` +
    `JSON keys: headline (Hindi, max 70 characters), summary (Hindi, one line, max 180 characters), body (Hindi, ${min}-${max} words, plain paragraphs separated by a blank line), ` +
    `breaking (true only for a major emergency or disaster). Cover who, what, where, when, why and background in separate short paragraphs, using every relevant fact in the source text.`, 4000);
}

export type Check = { ok: boolean; confidence: number; problems: string[]; sensitive: boolean };

export async function checkStory(cfg: AutoCfg, source: { title: string; snippet: string; text: string }, story: Written) {
  return askJson<Check>(modelFor(cfg, "check"),
    `You are a strict fact checker. Compare a written Hindi news story with the source material. Flag any claim not supported by the source.`,
    `SOURCE headline: ${source.title}\nSOURCE snippet: ${source.snippet}\nSOURCE text: ${source.text || "(none)"}\n\nSTORY headline: ${story.headline}\nSTORY summary: ${story.summary}\nSTORY body: ${story.body}\n\n` +
    `JSON keys: ok (false if any unsupported fact, wrong number, or guilt claimed for an accused), confidence (0-100), problems (list of short strings), ` +
    `sensitive (true if it could identify a sexual-offence or child victim, is communal or caste provoking, or has differing death/injury numbers).`);
}

// Simple local safety net on top of the AI check.
const RISKY = /(बलात्कार|दुष्कर्म|यौन\s*शोषण|गैंगरेप)[^।]{0,60}(पीड़िता|नाबालिग|बच्ची|छात्रा)/;
export function localSafety(story: Written): string | null {
  if (RISKY.test(`${story.headline} ${story.summary} ${story.body}`)) return "संवेदनशील मामला: पीड़ित की पहचान का जोखिम";
  return null;
}

export const wordOk = (cfg: AutoCfg, body: string) => {
  const n = words(body);
  return n >= cfg.wordCount.min * 0.7 && n <= cfg.wordCount.max * 1.5;
};
