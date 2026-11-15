"use client";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendMessage, type ContactState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, { ok: false });
  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-green-500/10 p-4 text-green-700 dark:text-green-400">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
        <p className="font-semibold">धन्यवाद! आपका संदेश हमें मिल गया है।</p>
      </div>
    );
  }
  const label = "block text-sm font-medium";
  const field = "mt-2 h-11 rounded-xl px-3.5 text-base";
  return (
    <form action={action} className="space-y-5">
      <div className="hidden" aria-hidden><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className={label}>नाम<Input name="name" required maxLength={100} className={field} /></label>
      <label className={label}>फ़ोन नंबर<Input name="phone" type="tel" required inputMode="tel" className={field} /></label>
      <label className={label}>संदेश / खबर<Textarea name="message" required rows={5} maxLength={3000} className={`${field} h-auto min-h-32 py-3`} /></label>
      {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "भेजा जा रहा है…" : "भेजें"}</Button>
    </form>
  );
}
