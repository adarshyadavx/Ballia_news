import { Suspense } from "react";
import Link from "next/link";
import { requireTeam } from "@/lib/auth";
import { signOut } from "../actions";
import { LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

async function Shell({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireTeam();
  const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("status", "new");
  const isAdmin = profile.role === "admin";
  const link = "rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
        <div className="shell flex flex-wrap items-center gap-2 py-3">
          <Link href="/admin" className="mr-4 flex items-center gap-2.5 text-base font-bold tracking-tight"><LogoMark size={28} /> Ballia News <span className="font-normal text-muted-foreground">Admin</span></Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            <Link href="/admin" className={link}>Dashboard</Link>
            <Link href="/admin/news" className={link}>News</Link>
            {isAdmin && <Link href="/admin/categories" className={link}>Categories</Link>}
            {isAdmin && <Link href="/admin/auto-news" className={link}>Auto News</Link>}
            <Link href="/admin/messages" className={link}>
              Messages{count ? <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span> : null}
            </Link>
            <Link href="/" target="_blank" className={link}>View site ↗</Link>
          </nav>
          <span className="text-xs text-muted-foreground">{profile.full_name || "Team"} ({profile.role})</span>
          <ThemeToggle />
          <form action={signOut}><button className="cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted">Logout</button></form>
        </div>
      </header>
      <div className="shell py-8">{children}</div>
    </>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6">Loading…</p>}><Shell>{children}</Shell></Suspense>;
}
