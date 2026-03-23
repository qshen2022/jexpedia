import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/queries/flights";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const date = searchParams.get("date") ?? "";
  const pax = parseInt(searchParams.get("pax") ?? "1", 10);
  const seatClass = searchParams.get("class") === "business" ? "business" as const : "economy" as const;

  if (!from || !to || !date) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const results = await searchFlights({ from, to, date, pax, seatClass });
  return NextResponse.json(results);
}
