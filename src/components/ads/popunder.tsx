"use client";
import { useEffect } from "react";
import { config } from "@/lib/config";
import { injectScript, isReal, scriptSrc } from "./ad-utils";

// News detail only. Never on the visitor's first page, max N per 24h, only after a click.
export function Popunder() {
  const c = config.ads.popunder;
  const on = config.ads.enabled && c.enabled && isReal(c.key);

  useEffect(() => {
    if (!on) return;
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
  }, [on, c]);

  return null;
}
