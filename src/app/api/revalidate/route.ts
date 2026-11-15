import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// The pipeline calls this after publishing so new stories show up within seconds.
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
