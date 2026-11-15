"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Cat = { name: string; slug: string };

export function NavLinks({ categories }: { categories: Cat[] }) {
  const pathname = decodeURIComponent(usePathname() || "/");
  const ref = useRef<HTMLUListElement>(null);
  const items = [{ name: "मुख्य पृष्ठ", href: "/" }, ...categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` }))];

  // Keep the active tab in view on small screens.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav aria-label="श्रेणियाँ" className="-mx-4 sm:mx-0">
      <ul ref={ref} className="no-scrollbar flex gap-1 overflow-x-auto px-4 max-md:gap-2 sm:px-0">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="shrink-0">
              <Link href={it.href} aria-current={active ? "page" : undefined}
                className={`relative block px-3 py-3 max-md:my-1.5 max-md:rounded-lg max-md:border max-md:px-3.5 max-md:py-1.5 max-md:text-sm max-md:after:hidden max-md:active:scale-95 text-[0.9rem] font-medium whitespace-nowrap transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:transition-transform after:duration-300 ${
                  active ? "text-foreground after:scale-x-100 max-md:border-transparent max-md:bg-primary/12 max-md:font-semibold max-md:text-primary" : "text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100"
                }`}>
                {it.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
