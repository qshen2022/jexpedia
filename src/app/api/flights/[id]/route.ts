import { NextResponse } from "next/server";
import { getFlightById } from "@/lib/queries/flights";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const flight = await getFlightById(id);

  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  return NextResponse.json(flight);
}
