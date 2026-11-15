import Link from "next/link";
import { config } from "@/lib/config";
import { getCategories } from "@/lib/data";
import { AdSlot } from "@/components/ads/ad-slot";
import { CurrentYear } from "./current-year";
import { Smartlink } from "@/components/ads/smartlink";
import { Logo } from "./logo";

type Cat = { name: string; slug: string };

const link = "text-muted-foreground transition-colors hover:text-foreground";

export function FooterView({ categories }: { categories: Cat[] }) {
  const social = Object.entries(config.social).filter(([, v]) => v);
  const labels: Record<string, string> = {
    facebook: "Facebook", youtube: "YouTube", whatsappChannel: "WhatsApp चैनल", x: "X", instagram: "Instagram",
  };
  return (
    <footer className="mt-12 border-t md:mt-20 bg-muted/30">
      <div className="shell py-12">
        <AdSlot slot="desktopFooter" />
        <AdSlot slot="mobileFooter" />
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo tagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{config.site.tagline}। बलिया जिले की सटीक, भरोसेमंद और स्थानीय खबरें।</p>
            {social.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {social.map(([k, v]) => (
                  <li key={k}>
                    <a href={v} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground">{labels[k] ?? k}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden md:col-span-4 md:block">
            <h3 className="text-sm font-semibold">श्रेणियाँ</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug}><Link href={`/category/${c.slug}`} className={link}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold">जानकारी</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className={link}>हमारे बारे में</Link></li>
              <li><Link href="/contact" className={link}>संपर्क करें</Link></li>
              <li><Link href="/privacy" className={link}>गोपनीयता नीति और शर्तें</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6"><Smartlink where="footer" /></div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© <CurrentYear /> {config.site.name}. सर्वाधिकार सुरक्षित।</p>
          <p>{config.contact.address}</p>
        </div>
      </div>
    </footer>
  );
}

export async function Footer() {
  return <FooterView categories={await getCategories()} />;
}
