const TZ = "Asia/Kolkata";

export function hindiDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("hi-IN", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function shortDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("hi-IN", {
    timeZone: TZ, day: "numeric", month: "short", year: "numeric",
  });
}

export function hindiDateTime(d: Date | string): string {
  const date = new Date(d);
  const t = date.toLocaleTimeString("hi-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  return `${shortDate(date)}, ${t}`;
}

// "2 घंटे पहले" style. Pass `now` explicitly; only call from the browser or after dynamic data.
export function timeAgo(iso: string, now: number = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "अभी अभी";
  if (mins < 60) return `${mins} मिनट पहले`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} घंटे पहले`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} दिन पहले`;
  return shortDate(iso);
}
