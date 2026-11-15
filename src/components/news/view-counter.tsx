"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

export function ViewCounter({ newsId }: { newsId: string }) {
  useEffect(() => {
    if (!config.features.viewCounter) return;
    const key = `bn_viewed_${newsId}`;
    try {
      if (sessionStorage.getItem(key)) return; // one count per session per story
      sessionStorage.setItem(key, "1");
    } catch {}
    createClient().rpc("increment_view", { p_news_id: newsId }).then(() => {});
  }, [newsId]);
  return null;
}
