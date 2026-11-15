import type { Metadata } from "next";
import { config } from "@/lib/config";
import type { NewsItem } from "@/lib/data";

export const siteUrl = () => config.site.url.replace(/\/$/, "");

export function absolute(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${siteUrl()}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}${path}` },
    openGraph: { title, description, url: `${siteUrl()}${path}`, siteName: config.site.name, locale: "hi_IN", type: "website" },
  };
}

export function newsMeta(n: NewsItem): Metadata {
  const url = `${siteUrl()}/news/${n.slug}`;
  const img = absolute(n.main_image || "/default-news.svg");
  return {
    title: n.headline,
    description: n.summary,
    alternates: { canonical: url },
    openGraph: {
      title: n.headline, description: n.summary, url, siteName: config.site.name, locale: "hi_IN",
      type: "article", publishedTime: n.published_at ?? undefined, modifiedTime: n.updated_at,
      images: [{ url: img, alt: n.headline }],
    },
    twitter: { card: "summary_large_image", title: n.headline, description: n.summary, images: [img] },
  };
}

export function newsJsonLd(n: NewsItem) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.headline,
    description: n.summary,
    image: [absolute(n.main_image || "/default-news.svg")],
    datePublished: n.published_at,
    dateModified: n.updated_at,
    author: { "@type": "Person", name: n.writer_name || config.site.name },
    publisher: { "@type": "Organization", name: config.site.name, logo: { "@type": "ImageObject", url: absolute(config.site.logo) } },
    mainEntityOfPage: `${siteUrl()}/news/${n.slug}`,
  };
}
