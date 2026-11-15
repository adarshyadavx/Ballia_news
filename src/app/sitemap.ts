import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getCategories, getSitemapRows } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const [cats, news] = await Promise.all([getCategories(), getSitemapRows()]);
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    ...["about", "contact", "privacy"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...cats.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "hourly" as const, priority: 0.7 })),
    ...news.map((n) => ({ url: `${base}/news/${n.slug}`, lastModified: n.updated_at, priority: 0.8 })),
  ];
}
