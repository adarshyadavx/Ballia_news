import Image from "next/image";

// Place inside a parent with the `group` class to get the soft hover zoom.
export function NewsImage({ src, alt, priority = false, sizes = "(min-width: 1024px) 33vw, 100vw", ratio = "aspect-[16/10]", className = "rounded-xl" }: {
  src: string; alt: string; priority?: boolean; sizes?: string; ratio?: string; className?: string;
}) {
  const url = src || "/default-news.svg";
  return (
    <div className={`relative w-full overflow-hidden bg-muted ring-1 ring-foreground/5 ${ratio} ${className}`}>
      {/* `priority` is deprecated in Next.js 16; `preload` + eager loading is the replacement for the top photo. */}
      <Image src={url} alt={alt} fill sizes={sizes} preload={priority} loading={priority ? "eager" : "lazy"}
        unoptimized={url.endsWith(".svg")}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
    </div>
  );
}
