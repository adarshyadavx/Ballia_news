import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { NewsImage } from "./news-image";
import { TimeAgo } from "./time-ago";
import type { NewsItem } from "@/lib/data";

type Variant = "hero" | "card" | "row" | "text";

export function CategoryTag({ item }: { item: NewsItem }) {
  if (!item.category) return null;
  return (
    <Link href={`/category/${item.category.slug}`}
      className="text-[0.8rem] font-semibold text-primary transition-opacity hover:opacity-75">
      {item.category.name}
    </Link>
  );
}

function Meta({ item, className = "" }: { item: NewsItem; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[0.8rem] text-muted-foreground ${className}`}>
      <CategoryTag item={item} />
      {item.category && <span aria-hidden className="size-0.5 rounded-full bg-current opacity-60" />}
      <TimeAgo iso={item.published_at} />
    </div>
  );
}

const titleLink = "bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size,color] duration-300 group-hover:bg-[length:100%_1px]";

export function NewsCard({ item, variant = "card", priority = false, play = false }: {
  item: NewsItem; variant?: Variant; priority?: boolean; play?: boolean;
}) {
  const href = `/news/${item.slug}`;

  if (variant === "text") {
    return (
      <article className="group border-b py-4 first:pt-0 last:border-0 last:pb-0">
        <Meta item={item} />
        <h3 className="mt-1.5 text-[1.02rem] leading-snug font-semibold">
          <Link href={href} className={`${titleLink}`}>{item.headline}</Link>
        </h3>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="group flex gap-4 border-b py-5 first:pt-0 last:border-0 sm:gap-6">
        <Link href={href} className="block w-[8.5rem] shrink-0 sm:w-56" tabIndex={-1} aria-hidden>
          <NewsImage src={item.main_image} alt="" sizes="224px" />
        </Link>
        <div className="min-w-0 flex-1">
          <Meta item={item} />
          <h3 className="mt-1.5 text-[1.05rem] leading-snug font-semibold sm:text-xl sm:leading-snug">
            <Link href={href} className={titleLink}>{item.headline}</Link>
          </h3>
          <p className="mt-2 hidden text-[0.95rem] leading-relaxed text-muted-foreground sm:line-clamp-2 sm:block">{item.summary}</p>
        </div>
      </article>
    );
  }

  const hero = variant === "hero";
  return (
    <article className="group">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block">
        <NewsImage src={item.main_image} alt="" priority={priority} ratio={hero ? "aspect-[16/10]" : "aspect-[16/10]"}
          className={hero ? "rounded-2xl" : "rounded-xl"}
          sizes={hero ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} />
        {play && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition-transform duration-300 group-hover:scale-110">
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        )}
      </Link>
      <div className={hero ? "mt-5" : "mt-3.5"}>
        <Meta item={item} />
        <h3 className={`mt-2 font-bold tracking-tight ${hero ? "text-2xl leading-[1.4] sm:text-[1.9rem] sm:leading-[1.4]" : "text-[1.02rem] leading-snug font-semibold"}`}>
          <Link href={href} className={titleLink}>{item.headline}</Link>
        </h3>
        {hero && <p className="mt-3 line-clamp-2 text-base leading-relaxed text-muted-foreground">{item.summary}</p>}
      </div>
    </article>
  );
}

export function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b pb-3">
      <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <span aria-hidden className="h-5 w-1 rounded-full bg-primary" />
        {children}
      </h2>
      {href && (
        <Link href={href} className="group/all inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          सभी देखें <ArrowRight size={14} className="transition-transform group-hover/all:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
