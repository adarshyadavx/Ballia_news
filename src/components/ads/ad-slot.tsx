"use client";
import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { containerId, injectScript, isExcluded, isReal, scriptSrc } from "./ad-utils";

type Slot = "native" | "sidebar" | "desktopFooter" | "mobileArticleEnd" | "mobileFooter";

function resolve(slot: Slot) {
  const a = config.ads;
  if (!a.enabled) return null;
  switch (slot) {
    case "native":
      return a.nativeBanner.enabled ? { type: "native" as const, key: a.nativeBanner.key, w: 0, h: 250, cls: "" } : null;
    case "sidebar":
      return a.displayBanner.enabled ? { type: "banner" as const, key: a.displayBanner.desktopSidebar.key, w: 300, h: 250, cls: "hidden lg:block lg:sticky lg:top-4" } : null;
    case "desktopFooter":
      return a.displayBanner.enabled ? { type: "banner" as const, key: a.displayBanner.desktopFooter.key, w: 728, h: 90, cls: "hidden lg:block" } : null;
    case "mobileArticleEnd":
      return a.displayBanner.enabled ? { type: "banner" as const, key: a.displayBanner.mobileArticleEnd.key, w: 300, h: 250, cls: "lg:hidden" } : null;
    case "mobileFooter":
      return a.displayBanner.enabled ? { type: "banner" as const, key: a.displayBanner.mobileFooter.key, w: 320, h: 100, cls: "lg:hidden" } : null;
  }
}

// One native banner code fills one container per page, so only the first native slot on a page
// shows it; the other native slots on that page render nothing (no empty boxes).
const nativeOwner = { path: "", id: 0 };
let nextSlotId = 1;

export function AdSlot({ slot, className = "" }: { slot: Slot; className?: string }) {
  const [path, setPath] = useState<string | null>(null);
  const [slotId] = useState(() => nextSlotId++);
  const [owner, setOwner] = useState(slot !== "native");
  const cfg = resolve(slot);

  useEffect(() => {
    const here = window.location.pathname;
    setPath(here);
    if (slot !== "native") return;
    if (nativeOwner.path !== here) {
      nativeOwner.path = here;
      nativeOwner.id = slotId;
    }
    setOwner(nativeOwner.id === slotId);
    return () => {
      if (nativeOwner.id === slotId) nativeOwner.path = "";
    };
  }, [slot, slotId]);

  const box = useRef<HTMLDivElement>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);

  const active = path !== null && owner && !!cfg && isReal(cfg.key) && !isExcluded(path);

  // Ads wait for the page, then for the reader to scroll near them.
  useEffect(() => {
    if (!active) return;
    if (document.readyState === "complete" || !config.ads.loadAfterContent) { setPageLoaded(true); return; }
    const on = () => setPageLoaded(true);
    window.addEventListener("load", on);
    return () => window.removeEventListener("load", on);
  }, [active]);

  useEffect(() => {
    if (!active || !box.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "300px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active || !cfg || !pageLoaded || !visible || started.current || !box.current) return;
    started.current = true;
    if (cfg.type === "native") {
      const src = scriptSrc(cfg.key);
      if (!src) return;
      const holder = document.createElement("div");
      holder.id = containerId(src);
      box.current.appendChild(holder);
      injectScript(src, box.current);
    }
  }, [active, cfg, pageLoaded, visible]);

  if (!active || !cfg) return null;

  const label = (
    <div className="mb-1.5 text-center text-[11px] text-muted-foreground/80">{config.ads.label} / Sponsored</div>
  );

  if (cfg.type === "banner") {
    const doc = `<html><body style="margin:0"><script>atOptions={'key':'${cfg.key}','format':'iframe','height':${cfg.h},'width':${cfg.w},'params':{}};</script><script src="https://www.highperformancedisplayformat.com/${cfg.key}/invoke.js"></script></body></html>`;
    return (
      <div className={`my-4 ${cfg.cls} ${className}`}>
        {label}
        <div ref={box} className="mx-auto" style={{ width: cfg.w, maxWidth: "100%", height: cfg.h }}>
          {pageLoaded && visible && (
            <iframe title="Sponsored" srcDoc={doc} width={cfg.w} height={cfg.h} scrolling="no"
              style={{ border: 0 }} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`my-6 rounded-xl border bg-muted/30 p-3 ${className}`}>
      {label}
      <div ref={box} style={{ minHeight: cfg.h }} />
    </div>
  );
}
