import { config } from "@/lib/config";

// Keys still containing the ADSTERRA_ placeholder are treated as "not set up yet" and render nothing.
export const isReal = (v?: string) => !!v && !v.includes("ADSTERRA_");

export const isExcluded = (path: string) =>
  config.ads.excludedPages.some((p) => path === p || path.startsWith(`${p}/`));

// Adsterra native/social bar/popunder keys are the script URL Adsterra gives you
// (e.g. //pl123.example.com/abc123/invoke.js). Container id = the folder before invoke.js.
export const scriptSrc = (v: string) => (v.startsWith("//") || v.startsWith("http") ? v : "");
export const containerId = (src: string) => `container-${src.split("/").slice(-2, -1)[0]}`;

export function injectScript(src: string, parent: HTMLElement) {
  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  s.src = src.startsWith("//") ? `https:${src}` : src;
  parent.appendChild(s);
}
