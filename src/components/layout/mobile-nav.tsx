"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, Search, Menu, Info, Mail, ShieldCheck, Moon, ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { toggleTheme } from "./theme-toggle";
import { config } from "@/lib/config";

type Cat = { name: string; slug: string };
type Sheet = "cats" | "more" | null;

const rowCls = "flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-2xl px-4 text-base font-medium transition-colors active:bg-foreground/10";

export function MobileNav({ categories }: { categories: Cat[] }) {
  const pathname = decodeURIComponent(usePathname() || "/");
  const [sheet, setSheet] = useState<Sheet>(null);
  useEffect(() => setSheet(null), [pathname]);

  const tabs: { key: string; label: string; icon: typeof Home; href?: string; active: boolean; onClick?: () => void }[] = [
    { key: "home", label: "होम", icon: Home, href: "/", active: pathname === "/" && !sheet },
    { key: "cats", label: "श्रेणियाँ", icon: LayoutGrid, active: sheet === "cats" || (pathname.startsWith("/category") && !sheet), onClick: () => setSheet("cats") },
    { key: "search", label: "खोजें", icon: Search, href: "/search", active: pathname.startsWith("/search") && !sheet },
    { key: "more", label: "और", icon: Menu, active: sheet === "more" || (["/about", "/contact", "/privacy"].includes(pathname) && !sheet), onClick: () => setSheet("more") },
  ];

  return (
    <>
      <nav aria-label="मुख्य नेविगेशन"
        className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="mx-auto grid h-20 max-w-md grid-cols-4">
          {tabs.map(({ key, label, icon: Icon, href, active, onClick }) => {
            const inner = (
              <>
                <span className={`flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300 ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span className={`text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </>
            );
            const cls = "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 active:scale-95 transition-transform";
            return (
              <li key={key}>
                {href
                  ? <Link href={href} aria-current={active ? "page" : undefined} className={cls}>{inner}</Link>
                  : <button type="button" onClick={onClick} aria-haspopup="dialog" className={cls}>{inner}</button>}
              </li>
            );
          })}
        </ul>
      </nav>

      <BottomSheet open={sheet === "cats"} onClose={() => setSheet(null)} title="श्रेणियाँ">
        <ul>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className={rowCls}>
                <span className="flex-1">{c.name}</span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <BottomSheet open={sheet === "more"} onClose={() => setSheet(null)} title={config.site.name}>
        <ul>
          <li><Link href="/about" className={rowCls}><Info size={22} strokeWidth={1.75} className="text-muted-foreground" /> हमारे बारे में</Link></li>
          <li><Link href="/contact" className={rowCls}><Mail size={22} strokeWidth={1.75} className="text-muted-foreground" /> संपर्क करें</Link></li>
          <li><Link href="/privacy" className={rowCls}><ShieldCheck size={22} strokeWidth={1.75} className="text-muted-foreground" /> गोपनीयता नीति और शर्तें</Link></li>
          {config.site.darkMode && (
            <li>
              <button type="button" className={rowCls} onClick={toggleTheme} role="switch" aria-checked={undefined}>
                <Moon size={22} strokeWidth={1.75} className="text-muted-foreground" />
                <span className="flex-1 text-left">डार्क मोड</span>
                <span aria-hidden className="relative h-8 w-14 rounded-full border-2 border-muted-foreground/60 bg-muted transition-colors dark:border-primary dark:bg-primary">
                  <span className="absolute top-1/2 left-1 size-4 -translate-y-1/2 rounded-full bg-muted-foreground/70 transition-all dark:left-7 dark:size-6 dark:bg-white" />
                </span>
              </button>
            </li>
          )}
        </ul>
      </BottomSheet>
    </>
  );
}
