import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { config } from "@/lib/config";
import { pageMeta } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export const metadata = pageMeta("संपर्क करें", "हमें खबर भेजें या संपर्क करें", "/contact");

export default function ContactPage() {
  const { phone, email, whatsapp, address } = config.contact;
  const items = [
    { icon: Phone, label: "फ़ोन", value: phone, href: `tel:${phone}` },
    { icon: Mail, label: "ईमेल", value: email, href: `mailto:${email}` },
    { icon: MessageCircle, label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    { icon: MapPin, label: "पता", value: address },
  ];
  return (
    <main className="shell shell-narrow rise py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">संपर्क करें</h1>
      <p className="mt-3 text-lg text-muted-foreground">कोई खबर, सुझाव या शिकायत हो तो हमें बताइए।</p>

      <div className="mt-10 grid gap-10 md:grid-cols-5">
        <ul className="space-y-3 md:col-span-2">
          {items.map(({ icon: Icon, label, value, href }) => {
            const body = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon size={18} strokeWidth={1.75} /></span>
                <span className="min-w-0 text-sm leading-snug">
                  <span className="block text-muted-foreground">{label}</span>
                  <span className="block font-semibold break-words">{value}</span>
                </span>
              </>
            );
            const cls = "flex items-center gap-4 rounded-2xl border bg-card p-4";
            return (
              <li key={label}>
                {href ? <a href={href} rel="noopener noreferrer" className={`${cls} transition-colors hover:border-foreground/25`}>{body}</a> : <div className={cls}>{body}</div>}
              </li>
            );
          })}
        </ul>
        {config.features.contactForm && (
          <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8 md:col-span-3">
            <h2 className="mb-5 text-xl font-bold tracking-tight">हमें खबर भेजें</h2>
            <ContactForm />
          </section>
        )}
      </div>
    </main>
  );
}
