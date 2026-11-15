import { config } from "@/lib/config";
import { isReal } from "./ad-utils";

export function Smartlink({ where }: { where: "footer" | "404" }) {
  const c = config.ads.smartlink;
  const allowed = where === "footer" ? c.showInFooter : c.showOn404;
  if (!config.ads.enabled || !c.enabled || !allowed || !isReal(c.url)) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {config.ads.label} / Sponsored:{" "}
      <a href={c.url} target="_blank" rel="sponsored nofollow noopener" className="underline">{c.text}</a>
    </p>
  );
}
