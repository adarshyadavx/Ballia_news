"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(params.get("error") === "noprofile"
    ? "This account is not set up as a team member yet. Ask the admin to activate it." : "");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const now = Date.now();
    const lock = Number(localStorage.getItem("bn_lock") || 0);
    if (lock > now) { setError(`Too many wrong tries. Try again in ${Math.ceil((lock - now) / 60000)} minute(s).`); return; }

    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithPassword({
      email: String(f.get("email")), password: String(f.get("password")),
    });
    setBusy(false);
    if (err) {
      const tries = Number(localStorage.getItem("bn_tries") || 0) + 1;
      if (tries >= MAX_TRIES) {
        localStorage.setItem("bn_lock", String(now + LOCK_MS));
        localStorage.setItem("bn_tries", "0");
        setError("Too many wrong tries. Login is locked for 5 minutes.");
      } else {
        localStorage.setItem("bn_tries", String(tries));
        setError(`Wrong email or password. ${MAX_TRIES - tries} tries left.`);
      }
      return;
    }
    localStorage.setItem("bn_tries", "0");
    router.replace("/admin");
    router.refresh();
  }

  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
      <label className="block text-sm font-semibold">Email
        <input name="email" type="email" required autoComplete="username" className={field} /></label>
      <label className="block text-sm font-semibold">Password
        <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className={field} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
      {error && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full">{busy ? "Signing in…" : "Login"}</Button>
    </form>
  );
}
