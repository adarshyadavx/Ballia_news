// Shared helpers for the automatic news pipeline (PRD section 12).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import raw from "../config.json";

export type AutoCfg = typeof raw.autoNews;
export const baseConfig = raw;

export function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// config.json values, with the on/off switches from Admin > Auto News layered on top.
export async function loadConfig(supabase: SupabaseClient): Promise<AutoCfg> {
  const cfg = structuredClone(raw.autoNews);
  const { data } = await supabase.from("app_settings").select("key,value").in("key", ["autoNews.enabled", "autoNews.autoPublish"]);
  for (const r of data ?? []) {
    if (r.key === "autoNews.enabled") cfg.enabled = Boolean(r.value);
    if (r.key === "autoNews.autoPublish") cfg.autoPublish = Boolean(r.value);
  }
  return cfg;
}

let _ai: Anthropic | null = null;
const ai = () => (_ai ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

// Free option: Google Gemini (key from https://aistudio.google.com/apikey). Used when GEMINI_API_KEY is set,
// otherwise the pipeline falls back to Anthropic. Model names come from config.json (autoNews.geminiModels).
// The free tier allows only a few requests a minute, so calls are spaced out and 429 answers are retried.
let lastGemini = 0;
const GEMINI_GAP_MS = 6500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geminiText(model: string, system: string, user: string, maxTokens: number): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastGemini + GEMINI_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastGemini = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3, responseMimeType: "application/json", thinkingConfig: model.includes("2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "low" } },
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (res.status === 429 || res.status === 503) { await sleep(15000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  }
  throw new Error("gemini: rate limit (free quota used up), will retry next run");
}

// Which of the two model names in config.json to use for a given step.
export function modelFor(cfg: AutoCfg, step: "filter" | "write" | "check"): string {
  const g = (cfg as AutoCfg & { geminiModels?: Record<string, string> }).geminiModels;
  return process.env.GEMINI_API_KEY && g ? g[step] : cfg.models[step];
}

// Ask a model for JSON only and parse it. Returns null if the answer is not valid JSON.
export async function askJson<T>(model: string, system: string, user: string, maxTokens = 1200): Promise<T | null> {
  const sys = `${system}\n\nReply with one JSON object only. No markdown, no commentary.`;
  let text: string;
  if (model.startsWith("gemini")) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    text = await geminiText(model, sys, user, maxTokens);
  } else {
    const res = await ai().messages.create({ model, max_tokens: maxTokens, system: sys, messages: [{ role: "user", content: user }] });
    text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}

export const istHour = (d = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(d)) % 24;

export function makeSlug(headline: string): string {
  const base = headline.trim().toLowerCase().replace(/[^\p{L}\p{N}ऀ-ॿ]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `${base || "news"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function jaccard(a: string, b: string): number {
  const A = new Set(a.toLowerCase().split(/[\s\p{P}]+/u).filter((w) => w.length > 1));
  const B = new Set(b.toLowerCase().split(/[\s\p{P}]+/u).filter((w) => w.length > 1));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export async function alert(cfg: AutoCfg, text: string) {
  console.log(`[alert] ${text}`);
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (cfg.alerts.telegram && token && chat) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: `${baseConfig.site.nameEnglish}: ${text}` }),
      });
    } catch (e) { console.error("telegram failed", e); }
  }
  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL_TO;
  if (cfg.alerts.email && key && to) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM || "onboarding@resend.dev", to, subject: `${baseConfig.site.nameEnglish} alert`, text }),
      });
    } catch (e) { console.error("resend failed", e); }
  }
}

// Asks the site to refresh Home and category pages right away.
export async function revalidateSite() {
  const secret = process.env.REVALIDATE_SECRET;
  const site = baseConfig.site.url.replace(/\/$/, "");
  if (!secret || site.includes("yourdomain")) return;
  try { await fetch(`${site}/api/revalidate`, { method: "POST", headers: { authorization: `Bearer ${secret}` } }); }
  catch (e) { console.error("revalidate failed", e); }
}
