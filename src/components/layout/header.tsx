import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { config } from "@/lib/config";
import { getCategories } from "@/lib/data";
import { TodayHindi } from "./today-hindi";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

type Cat = { name: string; slug: string };

export function HeaderView({ categories }: { categories: Cat[] }) {
  return (
    <header className="app-bar sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="shell">
        <div className="flex h-14 items-center md:h-16 justify-between gap-4">
          <Logo tagline size={46} />
          <div className="flex items-center gap-1.5">
            <span className="mr-3 hidden text-sm text-muted-foreground lg:block"><TodayHindi /></span>
            {config.features.search && (
              <Link href="/search" aria-label="खोजें"
                className="flex size-12 items-center justify-center gap-2 rounded-full text-foreground transition-colors active:bg-foreground/10 md:h-9 md:w-56 md:justify-start md:border md:bg-muted/50 md:px-3 md:text-sm md:text-muted-foreground md:hover:border-foreground/20 md:hover:bg-muted md:hover:text-foreground">
                <Search size={22} strokeWidth={1.75} className="md:size-4" />
                <span className="hidden md:inline">खबर खोजें…</span>
              </Link>
            )}
            {config.site.darkMode && <div className="hidden md:block"><ThemeToggle /></div>}
          </div>
        </div>
        <Suspense fallback={<div className="h-12" />}><NavLinks categories={categories} /></Suspense>
      </div>
    </header>
  );
}

export async function Header() {
  return <HeaderView categories={await getCategories()} />;
}
