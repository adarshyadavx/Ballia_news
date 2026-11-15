import { NextRequest, NextResponse } from "next/server";
import { getLatest } from "@/lib/data";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const offset = Math.max(0, Number(p.get("offset")) || 0);
  const limit = Math.min(30, Math.max(1, Number(p.get("limit")) || 10));
  const categorySlug = p.get("category") || undefined;
  return NextResponse.json(await getLatest({ offset, limit, categorySlug }));
}
