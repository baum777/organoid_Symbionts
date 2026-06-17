import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      service: "consult",
      surface: "practice",
      week: 3,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
