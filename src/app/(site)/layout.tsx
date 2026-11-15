import { Suspense } from "react";
import { config } from "@/lib/config";
import { Header, HeaderView } from "@/components/layout/header";
import { Footer, FooterView } from "@/components/layout/footer";
import { BreakingStrip } from "@/components/layout/breaking-strip";
import { SocialBar } from "@/components/ads/social-bar";
import { Analytics } from "@/components/layout/analytics";
import { MobileNavLoader } from "@/components/layout/mobile-nav-server";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";

const fallbackCats = config.categories.map((c) => ({ name: c.name, slug: c.slug }));

function PageSkeleton() {
  return (
    <div className="shell animate-pulse py-6 md:py-10" aria-busy="true" aria-label="लोड हो रहा है">
      <div className="aspect-[16/10] w-full rounded-3xl bg-muted md:aspect-[16/7]" />
      <div className="mt-5 h-6 w-4/5 rounded-full bg-muted" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-muted" />
      <div className="mt-8 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="aspect-[16/10] w-32 shrink-0 rounded-xl bg-muted sm:w-56" />
            <div className="flex-1 space-y-3 pt-1"><div className="h-3 w-1/3 rounded-full bg-muted" /><div className="h-4 w-full rounded-full bg-muted" /><div className="h-4 w-3/4 rounded-full bg-muted" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderView categories={fallbackCats} />}><Header /></Suspense>
      {config.features.breakingStrip && <Suspense fallback={null}><BreakingStrip /></Suspense>}
      <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </div>
      <Suspense fallback={<FooterView categories={fallbackCats} />}><Footer /></Suspense>
      <Suspense fallback={null}><MobileNavLoader /></Suspense>
      <PullToRefresh />
      <SocialBar />
      <Analytics />
    </>
  );
}
