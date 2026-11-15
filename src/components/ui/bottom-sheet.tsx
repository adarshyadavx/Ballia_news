"use client";
import { useEffect, useRef, useState } from "react";

// Material-style modal bottom sheet: scrim, drag handle, swipe down or Esc to close.
export function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const [dy, setDy] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="बंद करें" onClick={onClose} className="scrim absolute inset-0 bg-black/40" />
      <div className="sheet absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[28px] bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: drag ? "none" : "transform .25s ease" }}>
        <div className="sticky top-0 z-10 touch-none bg-card pt-3 pb-2"
          onTouchStart={(e) => { start.current = e.touches[0].clientY; setDrag(true); }}
          onTouchMove={(e) => { if (start.current !== null) setDy(Math.max(0, e.touches[0].clientY - start.current)); }}
          onTouchEnd={() => { const d = dy; start.current = null; setDrag(false); setDy(0); if (d > 100) onClose(); }}>
          <div className="mx-auto h-1 w-8 rounded-full bg-muted-foreground/40" />
          <h2 className="px-6 pt-4 text-lg font-semibold">{title}</h2>
        </div>
        <div className="px-3">{children}</div>
      </div>
    </div>
  );
}
