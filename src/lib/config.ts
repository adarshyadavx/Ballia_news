import raw from "../../config.json";

// Single place that reads config.json. Pages import `config` from here.
export const config = raw;
export type SiteConfig = typeof raw;
