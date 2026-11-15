"use client";
import { useEffect } from "react";
import { config } from "@/lib/config";
import { injectScript, isExcluded, isReal, scriptSrc } from "./ad-utils";

// One Social Bar per page, only after a delay or half-page scroll.
export function SocialBar() {
  const c = config.ads.socialBar;
  const on = config.ads.enabled && c.enabled && isReal(c.key);

  useEffect(() => {
    if (!on || isExcluded(window.location.pathname)) return;
    const src = scriptSrc(c.key);
    if (!src) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      injectScript(src, document.body);
    };
    const timer = setTimeout(fire, c.delaySeconds * 1000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && (window.scrollY / max) * 100 >= c.orShowAfterScrollPercent) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, [on, c]);

  return null;
}
