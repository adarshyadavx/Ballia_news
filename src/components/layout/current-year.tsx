"use client";
import { useEffect, useState } from "react";

export function CurrentYear() {
  const [y, setY] = useState(2026);
  useEffect(() => setY(new Date().getFullYear()), []);
  return <>{y}</>;
}
