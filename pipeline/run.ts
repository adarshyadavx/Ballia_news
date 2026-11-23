// Automatic daily Ballia news. Usage: npm run pipeline [-- --mode=collect|draft|run] [--force] [--max=N]
//   collect : only log what would be picked (test stage 1)
//   draft   : write stories but always save them as held drafts (test stage 2)
//   run     : normal mode; publishes when autoNews.autoPublish is true
// Without ANTHROPIC_API_KEY the pipeline runs in no-AI mode (pipeline/digest.ts): short briefs
// with the publisher's own headline and summary, credited and linked.
import { alert, db, istHour, loadConfig, makeSlug, revalidateSite, baseConfig } from "./lib";
import { collect, readArticle } from "./collect";
import { checkStory, filterItem, localSafety, wordOk, writeStory } from "./ai";
import { buildBrief, pickBrief } from "./digest";
import { pickImage } from "./images";

const mode = (process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "run") as "collect" | "draft" | "run";
const force = process.argv.includes("--force");
const maxArg = Number(process.argv.find((a) => a.startsWith("--max="))?.split("=")[1]) || 0;
const useAi = Boolean(process.env.ANTHROPIC_API_KEY);

async function main() {
  const supabase = db();
  const cfg = await loadConfig(supabase);
  if (!cfg.enabled && !force) { console.log("Auto news is switched off."); return; }
  const h = istHour();
  if (!force && (h < cfg.activeHoursIST.from || h >= cfg.activeHoursIST.to)) { console.log(`Outside active hours (IST ${h}).`); return; }
  const maxPerRun = maxArg || cfg.maxStoriesPerRun;
  console.log(useAi ? "AI mode." : "No-AI mode (ANTHROPIC_API_KEY not set): publishing source briefs.");

  const { data: runRow } = await supabase.from("pipeline_runs").insert({ mode, note: useAi ? null : "no-ai" }).select("id").single();
  const runId = runRow?.id as string | undefined;
  const errors: string[] = [];
  let published = 0, held = 0, rejected = 0, found = 0;

  try {
    const col = await collect(supabase, cfg);
    found = col.found; errors.push(...col.errors);
    console.log(`Found ${col.found} items, ${col.items.length} new after cleaning.`);

    const { count: todayCount } = await supabase.from("news").select("id", { count: "exact", head: true }).eq("is_auto", true).gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
    // A manual run with --max=N may add N stories even past the daily limit (the scheduled runs keep it).
    let dailyLeft = maxArg ? maxArg : Math.max(0, cfg.maxStoriesPerDay - (todayCount ?? 0));
    const { data: recentRows } = await supabase.from("news").select("headline").order("created_at", { ascending: false }).limit(60);
    const recent = (recentRows ?? []).map((r) => r.headline as string);
    const { data: catRows } = await supabase.from("categories").select("id,slug");
    const catId = new Map((catRows ?? []).map((c) => [c.slug as string, c.id as string]));

    let made = 0, checked = 0;
    const started = Date.now();
    for (const item of col.items) {
      if (made >= maxPerRun || dailyLeft <= 0) break;
      // Cost and time limits: unchecked items stay unseen and are picked up by the next run.
      if (useAi && checked >= cfg.maxChecksPerRun) { console.log(`Stopped: ${checked} items checked (maxChecksPerRun).`); break; }
      if (Date.now() - started > cfg.runBudgetMinutes * 60_000) { console.log("Stopped: run time budget used."); break; }
      checked++;
      const markSeen = () => supabase.from("seen_items").upsert([item.link, ...item.extra.map((x) => x.link)].map((url) => ({ url, title: item.title })));
      try {
        let story: { headline: string; summary: string; html: string; breaking: boolean; writer: string };
        let meta: { category: string; area: string; tags: string[]; keywords: string; photoCategory?: string };
        let sources: { name: string; url: string }[];
        let confidence: number | null = null;
        const reasons: string[] = [];

        if (!useAi) {
          const p = pickBrief(cfg, item, recent);
          if (!p.ok) {
            console.log(`skip (${p.reason}): ${item.title}`);
            if (mode !== "collect") await markSeen();
            rejected++; continue;
          }
          console.log(`pick ${p.category}/${p.area || "-"}${p.sensitive ? " (held: sensitive)" : ""}: ${item.title}`);
          if (mode === "collect") { recent.unshift(item.title); continue; }
          const art = await readArticle(item.link);
          const b = buildBrief(item, art, p.area);
          story = { headline: b.headline, summary: b.summary, html: b.content, breaking: false, writer: item.publisher };
          meta = p;
          sources = [{ name: item.publisher, url: art.url }, ...item.extra.map((x) => ({ name: x.publisher, url: x.link }))];
          const local = localSafety({ headline: b.headline, summary: b.summary, body: "", breaking: false }); if (local) reasons.push(local);
          if (p.sensitive && !local) reasons.push("संवेदनशील विषय: बिना जाँच प्रकाशित नहीं");
        } else {
          const rel = await filterItem(cfg, item, recent);
          if (!rel || rel.duplicate || rel.score < cfg.relevanceMinScore) {
            console.log(`skip (${rel?.duplicate ? "duplicate" : `score ${rel?.score ?? "?"}`}): ${item.title}`);
            if (mode !== "collect") await markSeen();
            rejected++; continue;
          }
          console.log(`pick [${rel.score}] ${rel.category}/${rel.area}: ${item.title}`);
          if (mode === "collect") continue;

          const art = await readArticle(item.link);
          sources = [{ name: item.publisher, url: art.url }, ...item.extra.map((x) => ({ name: x.publisher, url: x.link }))];
          const written = await writeStory(cfg, { title: item.title, snippet: item.snippet, text: art.text, sources: sources.map((s) => s.name) });
          // The model gave no usable story: mark it seen so it is not paid for again every 3 hours.
          // (Thrown errors such as network or API outages are left unseen and retried next run.)
          if (!written?.headline || !written.body) { errors.push(`write failed: ${item.title}`); await markSeen(); rejected++; continue; }

          const check = await checkStory(cfg, { title: item.title, snippet: item.snippet, text: art.text }, written);
          if (!check) reasons.push("जाँच विफल");
          else {
            if (!check.ok) reasons.push(`तथ्य जाँच: ${(check.problems ?? []).join("; ") || "असंगति"}`);
            if (check.sensitive) reasons.push("संवेदनशील विषय");
            if (check.confidence < cfg.confidenceMinScore) reasons.push(`कम भरोसा (${check.confidence})`);
          }
          const local = localSafety(written); if (local) reasons.push(local);
          if (!wordOk(cfg, written.body)) reasons.push("शब्द सीमा");
          if (!art.text) reasons.push("स्रोत का पूरा पाठ नहीं मिला");
          confidence = check?.confidence ?? null;
          story = {
            headline: written.headline, summary: written.summary, breaking: written.breaking, writer: baseConfig.site.name,
            html: written.body.split(/\n\s*\n/).map((p) => `<p>${p.trim().replace(/</g, "&lt;")}</p>`).join(""),
          };
          meta = { category: rel.category, area: rel.area, tags: rel.tags ?? [], keywords: rel.english_keywords ?? "" };
        }

        const img = await pickImage(supabase, cfg, {
          category: meta.photoCategory ?? meta.category, area: meta.area, tags: meta.tags, keywords: meta.keywords, seed: story.headline,
        });
        const publish = mode === "run" && cfg.autoPublish && reasons.length === 0;
        if (mode === "draft" || !cfg.autoPublish) reasons.push("ऑटो-पब्लिश बंद (ड्राफ्ट)");

        const category_id = catId.get(meta.category) ?? catId.get("ballia-city");
        if (!category_id) { errors.push("no category found"); continue; }

        const { error } = await supabase.from("news").insert({
          headline: story.headline.slice(0, 120), slug: makeSlug(story.headline), summary: story.summary.slice(0, 290), content: story.html,
          main_image: img.url, image_caption: `${cfg.images.caption} · ${img.credit}`, category_id,
          area: meta.area || null, tags: meta.tags, writer_name: story.writer,
          is_breaking: publish && cfg.autoBreaking && story.breaking, is_featured: false,
          status: publish ? "published" : "draft", review_status: publish ? "published" : "held",
          hold_reason: publish ? null : reasons.join(" | "),
          is_auto: true, source_names: sources.map((s) => s.name), source_urls: sources.map((s) => s.url),
          image_type: img.type, image_credit: img.credit, ai_confidence: confidence,
        });
        if (error) { errors.push(`insert: ${error.message}`); continue; }
        await markSeen();
        recent.unshift(story.headline);
        made++; dailyLeft--;
        if (publish) published++; else held++;
      } catch (e) {
        errors.push(`${item.title.slice(0, 40)}: ${(e as Error).message}`);
      }
    }

    if (published > 0) await revalidateSite();
    if (col.found === 0 && col.errors.length) await alert(cfg, `कोई फ़ीड नहीं पढ़ी जा सकी: ${col.errors[0]}`);
  } catch (e) {
    errors.push((e as Error).message);
    await alert(cfg, `पाइपलाइन विफल: ${(e as Error).message}`);
  }

  if (runId) await supabase.from("pipeline_runs").update({ ended_at: new Date().toISOString(), found, published, held, rejected, errors }).eq("id", runId);
  console.log(`Done: published ${published}, held ${held}, skipped ${rejected}, errors ${errors.length}`);
  if (errors.length) { console.error(errors.join("\n")); }
}

main().catch(async (e) => { console.error(e); try { await alert((await loadConfig(db())), `पाइपलाइन क्रैश: ${(e as Error).message}`); } catch {} process.exit(1); });
