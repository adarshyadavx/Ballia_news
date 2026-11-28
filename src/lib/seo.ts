import type { Metadata } from "next";
import { config } from "@/lib/config";
import type { NewsItem } from "@/lib/data";

export const siteUrl = () => config.site.url.replace(/\/$/, "");

export function absolute(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${siteUrl()}${src.startsWith("/") ? "" : "/"}${src}`;
}

// WhatsApp, Facebook and X do not show SVG pictures, so a story that only has a drawing (or no
// picture) is shared with the site's logo (public/share.jpg, a small square copy of the badge).
function shareImage(src: string | null | undefined) {
  const own = src && !/\.svg(\?|$)/i.test(src);
  return { url: absolute(own ? src : "/share.jpg"), isLogo: !own };
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
  const img = shareImage(n.main_image);
  return {
    title: n.headline,
    description: n.summary,
    alternates: { canonical: url },
    openGraph: {
      title: n.headline, description: n.summary, url, siteName: config.site.name, locale: "hi_IN",
      type: "article", publishedTime: n.published_at ?? undefined, modifiedTime: n.updated_at,
      images: [{ url: img.url, alt: n.headline, ...(img.isLogo ? { width: 800, height: 800 } : {}) }],
    },
    // The wide card would cut off the top and bottom of the square logo.
    twitter: { card: img.isLogo ? "summary" : "summary_large_image", title: n.headline, description: n.summary, images: [img.url] },
  };
}

export function newsJsonLd(n: NewsItem) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.headline,
    description: n.summary,
    image: [shareImage(n.main_image).url],
    datePublished: n.published_at,
    dateModified: n.updated_at,
    author: { "@type": "Person", name: n.writer_name || config.site.name },
    publisher: { "@type": "Organization", name: config.site.name, logo: { "@type": "ImageObject", url: absolute(config.site.logo) } },
    mainEntityOfPage: `${siteUrl()}/news/${n.slug}`,
  };
}
