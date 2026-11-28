import Image from "next/image";
import Link from "next/link";
import { config } from "@/lib/config";

// Brand mark: the round "BN News & Updates" badge (public/logo.png).
export function LogoMark({ size = 44, className = "" }: { size?: number; className?: string }) {
  return <Image src={config.site.logo} width={size} height={size} alt="" aria-hidden loading="eager" className={`shrink-0 rounded-full ${className}`} />;
}

export function Logo({ size = 44, tagline = false }: { size?: number; tagline?: boolean }) {
  return (
    <Link href="/" aria-label={`${config.site.name} - मुख्य पृष्ठ`} className="group flex min-h-12 items-center gap-2.5 md:gap-3">
      <LogoMark size={size} className="transition-transform duration-300 group-hover:scale-105" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold md:text-[1.35rem] tracking-tight text-foreground">{config.site.name}</span>
        {tagline && <span className="mt-1.5 hidden text-xs md:block text-muted-foreground">{config.site.nameEnglish}</span>}
      </span>
    </Link>
  );
}
