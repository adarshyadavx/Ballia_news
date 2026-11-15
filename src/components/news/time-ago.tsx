"use client";
import { useEffect, useState } from "react";
import { shortDate, timeAgo } from "@/lib/dates";

// Server renders a fixed date; the browser then swaps in "2 घंटे पहले".
export function TimeAgo({ iso }: { iso: string | null }) {
  const [text, setText] = useState(iso ? shortDate(iso) : "");
  useEffect(() => {
    if (iso) setText(timeAgo(iso));
  }, [iso]);
  return <time dateTime={iso ?? undefined}>{text}</time>;
}
