// Gives auto stories that still show a default illustration a real (licensed) photo.
// Usage: npm run pipeline:images [-- --all]   (--all re-picks every auto story's photo)
import { db, loadConfig } from "./lib";
import { pickImage } from "./images";
import { photoTopic } from "./digest";

async function main() {
  const supabase = db();
  const cfg = await loadConfig(supabase);
  let q = supabase.from("news").select("id,headline,area,tags,image_type,category:categories(slug)").eq("is_auto", true);
  if (!process.argv.includes("--all")) q = q.eq("image_type", "default");
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let changed = 0;
  for (const n of data ?? []) {
    const category = (n.category as unknown as { slug: string } | null)?.slug ?? "ballia-city";
    const { photoCategory, keywords } = photoTopic(category, n.headline);
    const img = await pickImage(supabase, cfg, { category: photoCategory, area: n.area ?? "", tags: n.tags ?? [], keywords, seed: n.headline });
    if (img.type === "default" && n.image_type === "default") continue;
    await supabase.from("news").update({
      main_image: img.url, image_type: img.type, image_credit: img.credit, image_caption: `${cfg.images.caption} · ${img.credit}`,
    }).eq("id", n.id);
    changed++;
    console.log(`${img.type.padEnd(7)} ${photoCategory.padEnd(12)} ${n.headline.slice(0, 50)}`);
  }
  console.log(`Updated ${changed} of ${data?.length ?? 0} stories.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
