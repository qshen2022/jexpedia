import { NextResponse } from "next/server";
import { getHotelById } from "@/lib/queries/hotels";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hotel = await getHotelById(id);

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}
