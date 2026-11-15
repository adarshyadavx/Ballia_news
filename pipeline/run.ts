// Automatic daily Ballia news. Usage: npm run pipeline [-- --mode=collect|draft|run]
//   collect : only log what would be picked (test stage 1)
//   draft   : write stories but always save them as held drafts (test stage 2)
//   run     : normal mode; publishes when autoNews.autoPublish is true
import { alert, db, istHour, loadConfig, makeSlug, revalidateSite, baseConfig } from "./lib";
import { collect, readArticle } from "./collect";
import { checkStory, filterItem, localSafety, wordOk, writeStory } from "./ai";
import { pickImage } from "./images";

const mode = (process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "run") as "collect" | "draft" | "run";
const force = process.argv.includes("--force");

async function main() {
  const supabase = db();
  const cfg = await loadConfig(supabase);
  if (!cfg.enabled && !force) { console.log("Auto news is switched off."); return; }
  const h = istHour();
  if (!force && (h < cfg.activeHoursIST.from || h >= cfg.activeHoursIST.to)) { console.log(`Outside active hours (IST ${h}).`); return; }

  const { data: runRow } = await supabase.from("pipeline_runs").insert({ mode }).select("id").single();
  const runId = runRow?.id as string | undefined;
  const errors: string[] = [];
  let published = 0, held = 0, rejected = 0, found = 0;

  try {
    const col = await collect(supabase, cfg);
    found = col.found; errors.push(...col.errors);
    console.log(`Found ${col.found} items, ${col.items.length} new after cleaning.`);

    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase.from("news").select("id", { count: "exact", head: true }).eq("is_auto", true).gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
    let dailyLeft = Math.max(0, cfg.maxStoriesPerDay - (todayCount ?? 0));
    const { data: recentRows } = await supabase.from("news").select("headline").order("created_at", { ascending: false }).limit(30);
    const recent = (recentRows ?? []).map((r) => r.headline as string);
    const { data: catRows } = await supabase.from("categories").select("id,slug");
    const catId = new Map((catRows ?? []).map((c) => [c.slug as string, c.id as string]));

    let made = 0;
    for (const item of col.items) {
      if (made >= cfg.maxStoriesPerRun || dailyLeft <= 0) break;
      const markSeen = () => supabase.from("seen_items").upsert([item.link, ...item.extra.map((x) => x.link)].map((url) => ({ url, title: item.title })));
      try {
        const rel = await filterItem(cfg, item, recent);
        if (!rel || rel.duplicate || rel.score < cfg.relevanceMinScore) {
          console.log(`skip (${rel?.duplicate ? "duplicate" : `score ${rel?.score ?? "?"}`}): ${item.title}`);
          if (mode !== "collect") await markSeen();
          rejected++; continue;
        }
        console.log(`pick [${rel.score}] ${rel.category}/${rel.area}: ${item.title}`);
        if (mode === "collect") continue;

        const art = await readArticle(item.link);
        const sources = [{ name: item.publisher, url: art.url }, ...item.extra.map((x) => ({ name: x.publisher, url: x.link }))];
        const story = await writeStory(cfg, { title: item.title, snippet: item.snippet, text: art.text, sources: sources.map((s) => s.name) });
        if (!story?.headline || !story.body) { errors.push(`write failed: ${item.title}`); continue; }

        const check = await checkStory(cfg, { title: item.title, snippet: item.snippet, text: art.text }, story);
        const reasons: string[] = [];
        if (!check) reasons.push("जाँच विफल");
        else {
          if (!check.ok) reasons.push(`तथ्य जाँच: ${(check.problems ?? []).join("; ") || "असंगति"}`);
          if (check.sensitive) reasons.push("संवेदनशील विषय");
          if (check.confidence < cfg.confidenceMinScore) reasons.push(`कम भरोसा (${check.confidence})`);
        }
        const local = localSafety(story); if (local) reasons.push(local);
        if (!wordOk(cfg, story.body)) reasons.push("शब्द सीमा");
        if (!art.text) reasons.push("स्रोत का पूरा पाठ नहीं मिला");

        const img = await pickImage(supabase, cfg, { category: rel.category, area: rel.area, tags: rel.tags ?? [], keywords: rel.english_keywords ?? "" });
        const publish = mode === "run" && cfg.autoPublish && reasons.length === 0;
        if (mode === "draft" || !cfg.autoPublish) reasons.push("ऑटो-पब्लिश बंद (ड्राफ्ट)");

        const html = story.body.split(/\n\s*\n/).map((p) => `<p>${p.trim().replace(/</g, "&lt;")}</p>`).join("");
        const category_id = catId.get(rel.category) ?? catId.get("ballia-city");
        if (!category_id) { errors.push("no category found"); continue; }

        const { error } = await supabase.from("news").insert({
          headline: story.headline.slice(0, 120), slug: makeSlug(story.headline), summary: story.summary.slice(0, 290), content: html,
          main_image: img.url, image_caption: `${cfg.images.caption} · ${img.credit}`, category_id,
          area: rel.area || null, tags: rel.tags ?? [], writer_name: baseConfig.site.name,
          is_breaking: publish && cfg.autoBreaking && story.breaking, is_featured: false,
          status: publish ? "published" : "draft", review_status: publish ? "published" : "held",
          hold_reason: publish ? null : reasons.join(" | "),
          is_auto: true, source_names: sources.map((s) => s.name), source_urls: sources.map((s) => s.url),
          image_type: img.type, image_credit: img.credit, ai_confidence: check?.confidence ?? null,
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
