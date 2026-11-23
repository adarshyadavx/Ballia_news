"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { config } from "@/lib/config";
import { injectScript, isExcluded, isReal, scriptSrc } from "./ad-utils";

// Pages from config.ads.popunder.pages ("all" or "newsDetail"). Never on the visitor's first page,
// never on excluded pages (about/contact/privacy), max N per 24h, only after a click.
export function Popunder() {
  const c = config.ads.popunder;
  const on = config.ads.enabled && c.enabled && isReal(c.key);
  const path = usePathname(); // the layout stays mounted, so re-check on every page change

  useEffect(() => {
    if (!on || !path) return;
    const pages: string[] = c.pages;
    if (isExcluded(path) || !(pages.includes("all") || (pages.includes("newsDetail") && path.startsWith("/news/")))) return;
    const src = scriptSrc(c.key);
    if (!src) return;
    try {
      const views = Number(sessionStorage.getItem("bn_pv") || 0) + 1;
      sessionStorage.setItem("bn_pv", String(views));
      if (c.skipFirstPageView && views < 2 && !localStorage.getItem("bn_seen")) {
        localStorage.setItem("bn_seen", "1");
        return;
      }
      const log: number[] = JSON.parse(localStorage.getItem("bn_pop") || "[]").filter(
        (t: number) => Date.now() - t < 24 * 3600 * 1000,
      );
      if (log.length >= c.maxPerDay) return;
      const onClick = () => {
        log.push(Date.now());
        localStorage.setItem("bn_pop", JSON.stringify(log));
        injectScript(src, document.body);
      };
      document.addEventListener("click", onClick, { once: true });
      return () => document.removeEventListener("click", onClick);
    } catch {}
  }, [on, c, path]);

  return null;
}
