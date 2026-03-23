import { NextResponse } from "next/server";
import { getAirportByCode } from "@/lib/queries/flights";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const airport = getAirportByCode(code.toUpperCase());
  if (!airport) {
    return NextResponse.json({ error: "Airport not found" }, { status: 404 });
  }
  return NextResponse.json(airport);
}
