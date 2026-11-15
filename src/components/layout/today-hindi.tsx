"use client";
import { useEffect, useState } from "react";
import { hindiDate } from "@/lib/dates";

export function TodayHindi() {
  const [t, setT] = useState("");
  useEffect(() => setT(hindiDate(new Date())), []);
  return <span suppressHydrationWarning>{t}</span>;
}
