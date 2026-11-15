"use server";
import { publicClient } from "@/lib/data";

export type ContactState = { ok: boolean; error?: string };

export async function sendMessage(_: ContactState, form: FormData): Promise<ContactState> {
  if (form.get("website")) return { ok: true }; // honeypot: bots fill this
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 20);
  const message = String(form.get("message") ?? "").trim().slice(0, 3000);
  if (!name || !message) return { ok: false, error: "कृपया नाम और संदेश भरें।" };
  if (!/^[+\d][\d\s-]{7,17}$/.test(phone)) return { ok: false, error: "कृपया सही फ़ोन नंबर लिखें।" };

  const { error } = await publicClient().from("messages").insert({ name, phone, message });
  if (error) {
    console.error("[contact]", error.message);
    return { ok: false, error: "संदेश भेजा नहीं जा सका। कृपया बाद में कोशिश करें।" };
  }
  return { ok: true };
}
