"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Touch-only pull down at the top of the page to reload the content.
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!matchMedia("(max-width: 767px)").matches) return;
    const start = (e: TouchEvent) => { startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null; };
    const move = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) { pullRef.current = 0; setPull(0); return; }
      pullRef.current = Math.min(dy * 0.45, 90);
      setPull(pullRef.current);
    };
    const end = () => {
      const reached = pullRef.current >= 64;
      startY.current = null; pullRef.current = 0; setPull(0);
      if (reached) {
        setBusy(true);
        router.refresh();
        setTimeout(() => setBusy(false), 900);
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      window.removeEventListener("touchstart", start); window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end); window.removeEventListener("touchcancel", end);
    };
  }, [router]);

  const y = busy ? 56 : pull;
  if (!y) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 z-[55] flex justify-center md:hidden"
      style={{ top: "calc(env(safe-area-inset-top) + 3.5rem)", transform: `translateY(${y - 40}px)`, opacity: Math.min(1, y / 50) }}>
      <span className="grid size-10 place-items-center rounded-full bg-card text-primary shadow-lg ring-1 ring-foreground/10">
        <RefreshCw size={18} className={busy ? "spin" : ""} style={busy ? undefined : { transform: `rotate(${y * 4}deg)` }} />
      </span>
    </div>
  );
}
