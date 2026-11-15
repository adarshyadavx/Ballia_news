"use client";
import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareButtons({ headline }: { headline: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const btn = "inline-flex h-11 cursor-pointer md:h-9 active:scale-95 items-center gap-2 rounded-full border px-4 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/25 hover:bg-muted hover:text-foreground";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="शेयर करें">
      <span className="mr-1 hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex"><Share2 size={15} /> शेयर करें</span>
      <button className={btn}
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${headline}\n${url()}`)}`)}><MessageCircle size={15} /> WhatsApp</button>
      <button className={btn}
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>Facebook</button>
      <button className={btn}
        onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(url())}`)}>X</button>
      <button className={btn}
        onClick={async () => { try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} }}>
        {copied ? <><Check size={15} className="text-green-600" /> कॉपी हो गया</> : <><Link2 size={15} /> लिंक कॉपी करें</>}
      </button>
      {copied && (
        <div role="status" className="snack fixed left-1/2 z-[65] flex min-h-12 w-[calc(100%-2rem)] max-w-sm items-center rounded-xl bg-foreground px-4 text-sm text-background shadow-xl bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-6">
          लिंक कॉपी हो गया
        </div>
      )}
    </div>
  );
}

// Extended FAB (mobile only): native share sheet when available, otherwise WhatsApp.
export function ShareFab({ headline }: { headline: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: headline, url }); return; } catch { return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${headline}\n${url}`)}`, "_blank", "noopener,noreferrer");
  }
  return (
    <button aria-label="शेयर करें" onClick={share}
      className="fixed right-4 z-[58] inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-2xl bg-primary px-5 text-[0.95rem] font-semibold text-primary-foreground shadow-lg shadow-black/25 transition-transform active:scale-95 md:hidden"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}>
      <Share2 size={20} /> शेयर करें
    </button>
  );
}
