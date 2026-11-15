// Keeps Hindi letters; adds a short random tail so slugs are unique.
export function makeSlug(headline: string): string {
  const base = headline
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  const tail = Math.random().toString(36).slice(2, 7);
  return `${base || "news"}-${tail}`;
}

export function decodeParam(v: string): string {
  try { return decodeURIComponent(v); } catch { return v; }
}

export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
