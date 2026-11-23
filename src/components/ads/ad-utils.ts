import { config } from "@/lib/config";

// Keys still containing the ADSTERRA_ placeholder are treated as "not set up yet" and render nothing.
export const isReal = (v?: string) => !!v && !v.includes("ADSTERRA_");

export const isExcluded = (path: string) =>
  config.ads.excludedPages.some((p) => path === p || path.startsWith(`${p}/`));

// Adsterra native/social bar/popunder keys are the script URL Adsterra gives you, either the
// new form https://domain/21/<id> or the old //pl123.example.com/<id>/invoke.js.
// The native banner fills <div id="container-<id>">.
export const scriptSrc = (v: string) => (v.startsWith("//") || v.startsWith("http") ? v : "");
export function containerId(src: string): string {
  const parts = src.split("?")[0].split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return `container-${last === "invoke.js" ? parts[parts.length - 2] : last}`;
}

export function injectScript(src: string, parent: HTMLElement) {
  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  s.src = src.startsWith("//") ? `https:${src}` : src;
  parent.appendChild(s);
}
