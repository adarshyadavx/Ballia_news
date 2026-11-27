import { Suspense } from "react";
import { config } from "@/lib/config";
import { Header, HeaderView } from "@/components/layout/header";
import { Footer, FooterView } from "@/components/layout/footer";
import { BreakingStrip } from "@/components/layout/breaking-strip";
import { SocialBar } from "@/components/ads/social-bar";
import { Popunder } from "@/components/ads/popunder";
import { Analytics } from "@/components/layout/analytics";
import { MobileNavLoader } from "@/components/layout/mobile-nav-server";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";
import { PageSkeleton } from "@/components/layout/page-skeleton";

const fallbackCats = config.categories.map((c) => ({ name: c.name, slug: c.slug }));


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
      <Suspense fallback={null}><Popunder /></Suspense>
      <Analytics />
    </>
  );
}
