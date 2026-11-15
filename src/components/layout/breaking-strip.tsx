import Link from "next/link";
import { getBreaking } from "@/lib/data";

export async function BreakingStrip() {
  const items = await getBreaking();
  if (!items.length) return null;
  const line = (suffix: string) => items.map((n) => (
    <Link key={n.slug + suffix} href={`/news/${n.slug}`} className="mr-12 transition-colors hover:text-primary">{n.headline}</Link>
  ));
  return (
    <div className="border-b bg-muted/40" role="region" aria-label="ब्रेकिंग न्यूज़">
      <div className="shell flex items-center">
        <span className="relative z-10 flex shrink-0 items-center gap-2 bg-muted/0 py-2 pr-4 text-sm font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          ब्रेकिंग
        </span>
        <div className="marquee-wrap relative flex-1 overflow-hidden py-2 text-sm text-foreground/80 [mask-image:linear-gradient(to_right,transparent,#000_24px,#000_calc(100%-24px),transparent)]">
          <div className="marquee">{line("a")}{line("b")}</div>
        </div>
      </div>
    </div>
  );
}
