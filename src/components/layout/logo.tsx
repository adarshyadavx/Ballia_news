import Link from "next/link";
import { config } from "@/lib/config";

// Brand mark: a rising sun over the Ganga. Colours follow the theme.
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={`shrink-0 text-primary ${className}`}>
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <circle cx="32" cy="22" r="7" fill="#fff" />
      <path d="M11 37q5.25-6 10.5 0t10.5 0 10.5 0 10.5 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M11 49q5.25-6 10.5 0t10.5 0 10.5 0 10.5 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function Logo({ size = 36, tagline = false }: { size?: number; tagline?: boolean }) {
  return (
    <Link href="/" aria-label={`${config.site.name} - मुख्य पृष्ठ`} className="group flex min-h-12 items-center gap-2.5 md:gap-3">
      <LogoMark size={size} className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold md:text-[1.35rem] tracking-tight text-foreground">{config.site.name}</span>
        {tagline && <span className="mt-1.5 hidden text-xs md:block text-muted-foreground">{config.site.nameEnglish}</span>}
      </span>
    </Link>
  );
}
