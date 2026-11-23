// Adds free Ballia photos from Wikimedia Commons to the image library (run once: npm run pipeline:commons).
// Each photo is copied into our storage with its photographer, licence and source page as the credit.
import { db } from "./lib";
import { storeImage } from "./images";

const UA = "BalliaNewsBot/1.0 (+https://github.com/adarshyadavx/Ballia_news)";

// Hand-picked: real places in Ballia district, no portraits of people.
const PHOTOS: { file: string; category: string; area: string | null; keywords: string[] }[] = [
  { file: "Shaheed Park Ballia.jpg", category: "ballia-city", area: "बलिया सदर", keywords: ["बलिया", "पार्क", "शहीद"] },
  { file: "Ballia India banner.jpg", category: "ballia-city", area: "बलिया सदर", keywords: ["बलिया"] },
  { file: "Chhath Puja Ghat Piyarahi Ballia.jpg", category: "culture", area: null, keywords: ["घाट", "छठ", "पूजा", "स्नान"] },
  { file: "Vrittikut Ashram Pakdi Ballia.jpg", category: "culture", area: null, keywords: ["आश्रम", "मंदिर"] },
  { file: "Vrittikut Ashram Pakdi Ballia 2.jpg", category: "culture", area: null, keywords: ["आश्रम", "मंदिर"] },
  { file: "VIEW OF DOPAHI VILLAGE.jpg", category: "tehsil", area: null, keywords: ["गाँव", "गांव"] },
  { file: "An local area of town maniyar.jpg", category: "tehsil", area: null, keywords: ["मनियर"] },
  { file: "Maniyar.jpg", category: "tehsil", area: null, keywords: ["मनियर"] },
];

const strip = (html = "") => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const supabase = db();
  const { data: existing } = await supabase.from("image_library").select("credit");
  const have = (existing ?? []).map((r) => r.credit as string).join("\n");

  for (const p of PHOTOS) {
    const title = `File:${p.file}`;
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600`;
    const page = Object.values((await (await fetch(api, { headers: { "user-agent": UA } })).json()).query.pages)[0] as {
      imageinfo?: { thumburl: string; descriptionurl: string; width: number; height: number; extmetadata: Record<string, { value: string }> }[];
    };
    const info = page.imageinfo?.[0];
    if (!info) { console.log("not found:", p.file); continue; }
    if (have.includes(info.descriptionurl)) { console.log("already in library:", p.file); continue; }
    if (info.width / info.height > 2.2) { console.log("too wide, skipped:", p.file); continue; }

    const m = info.extmetadata;
    const credit = `${strip(m.Artist?.value) || "Unknown"} / Wikimedia Commons, ${strip(m.LicenseShortName?.value) || "see source"} (${info.descriptionurl})`;
    const url = await storeImage(supabase, info.thumburl, "library").catch(() => null);
    if (!url) { console.log("download failed:", p.file); continue; }
    const { error } = await supabase.from("image_library").insert({ image_url: url, category_slug: p.category, area: p.area, keywords: p.keywords, credit });
    console.log(error ? `insert failed: ${p.file}: ${error.message}` : `added: ${p.file} -> ${p.category}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
