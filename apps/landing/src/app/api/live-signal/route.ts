import { getSemanticBridgePreview } from "@/lib/semantic-bridge";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const preview = getSemanticBridgePreview();
  return NextResponse.json(preview, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
