import { NextResponse } from "next/server";
import { searchHotels } from "@/lib/queries/hotels";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const guests = parseInt(searchParams.get("guests") ?? "1", 10);

  if (!city) {
    return NextResponse.json({ error: "Missing city" }, { status: 400 });
  }

  const results = await searchHotels({ city, checkIn, checkOut, guests });
  return NextResponse.json(results);
}
