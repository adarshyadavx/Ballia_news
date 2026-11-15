"use client";
import { useState } from "react";
import { NewsCard } from "./news-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import type { NewsItem } from "@/lib/data";

// List of stories with "Load more" and native ads after every N stories.
export function NewsFeed({ initial, pageSize, categorySlug, adEvery, maxAds }: {
  initial: NewsItem[]; pageSize: number; categorySlug?: string; adEvery: number; maxAds: number;
}) {
  const [items, setItems] = useState(initial);
  const [done, setDone] = useState(initial.length < pageSize);
  const [loading, setLoading] = useState(false);

  async function more() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ offset: String(items.length), limit: String(pageSize) });
      if (categorySlug) qs.set("category", categorySlug);
      const res = await fetch(`/api/news?${qs}`);
      const next: NewsItem[] = res.ok ? await res.json() : [];
      setItems((cur) => [...cur, ...next]);
      if (next.length < pageSize) setDone(true);
    } catch {
      setDone(true);
    }
    setLoading(false);
  }

  let adsShown = 0;
  return (
    <div>
      {items.map((item, i) => {
        const showAd = config.ads.nativeBanner.enabled && (i + 1) % adEvery === 0 && adsShown < maxAds;
        if (showAd) adsShown++;
        return (
          <div key={item.id}>
            <NewsCard item={item} variant="row" />
            {showAd && <AdSlot slot="native" />}
          </div>
        );
      })}
      {!done && (
        <div className="mt-8 text-center">
          <Button onClick={more} disabled={loading} variant="outline" size="lg">
            {loading ? "लोड हो रहा है…" : "और खबरें देखें"}
          </Button>
        </div>
      )}
    </div>
  );
}
