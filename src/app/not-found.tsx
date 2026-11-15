import Link from "next/link";
import { config } from "@/lib/config";
import { Smartlink } from "@/components/ads/smartlink";
import { LogoMark } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <LogoMark size={48} />
      <div className="mt-8 text-7xl font-bold tracking-tight text-muted-foreground/40">404</div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">यह पृष्ठ नहीं मिला</h1>
      <p className="mt-2 text-muted-foreground">शायद लिंक गलत है या खबर हटा दी गई है।</p>
      <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{config.site.name} के मुख्य पृष्ठ पर जाएँ</Link>
      <div className="mt-8"><Smartlink where="404" /></div>
    </main>
  );
}
