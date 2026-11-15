// Midnight cleanup (PRD 12.8). Run: npm run pipeline:housekeeping
import { alert, db, loadConfig, revalidateSite } from "./lib";

async function main() {
  const supabase = db();
  const cfg = await loadConfig(supabase);
  const day = 24 * 3600_000;

  // 1. Breaking off after 24 hours.
  await supabase.from("news").update({ is_breaking: false }).eq("is_breaking", true).lt("breaking_set_at", new Date(Date.now() - day).toISOString());
  // 2. Delete held stories older than N days.
  await supabase.from("news").delete().eq("is_auto", true).eq("review_status", "held").lt("created_at", new Date(Date.now() - cfg.deleteHeldAfterDays * day).toISOString());
  // 3. Forget seen items older than 30 days.
  await supabase.from("seen_items").delete().lt("seen_at", new Date(Date.now() - 30 * day).toISOString());
  // 4. Daily summary.
  const since = new Date(Date.now() - day).toISOString();
  const { count: pub } = await supabase.from("news").select("id", { count: "exact", head: true }).eq("is_auto", true).eq("status", "published").gte("created_at", since);
  const { count: held } = await supabase.from("news").select("id", { count: "exact", head: true }).eq("is_auto", true).eq("review_status", "held").gte("created_at", since);
  await alert(cfg, `आज ${pub ?? 0} खबरें प्रकाशित, ${held ?? 0} रोकी गईं`);
  await revalidateSite();
}

main().catch((e) => { console.error(e); process.exit(1); });
