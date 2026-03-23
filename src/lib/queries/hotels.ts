import { eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { hotels, roomTypes } from "@/db/schema";

interface SearchHotelsParams {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export async function searchHotels(params: SearchHotelsParams) {
  const { city, guests } = params;

  const results = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      address: hotels.address,
      description: hotels.description,
      starRating: hotels.starRating,
      reviewScore: hotels.reviewScore,
      reviewCount: hotels.reviewCount,
      amenities: hotels.amenities,
      imageIndex: hotels.imageIndex,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      pricePerNight: roomTypes.pricePerNight,
      capacity: roomTypes.capacity,
      availableCount: roomTypes.availableCount,
    })
    .from(hotels)
    .innerJoin(roomTypes, eq(roomTypes.hotelId, hotels.id))
    .where(
      sql`LOWER(${hotels.city}) = LOWER(${city}) AND ${roomTypes.capacity} >= ${guests} AND ${roomTypes.availableCount} > 0`
    )
    .limit(100);

  // Group room types under their hotels
  const hotelMap = new Map<
    string,
    {
      id: string;
      name: string;
      city: string;
      country: string;
      address: string;
      description: string;
      starRating: number;
      reviewScore: number;
      reviewCount: number;
      amenities: string;
      imageIndex: number;
      roomTypes: {
        id: string;
        name: string;
        pricePerNight: number;
        capacity: number;
        availableCount: number;
      }[];
    }
  >();

  for (const row of results) {
    if (!hotelMap.has(row.id)) {
      hotelMap.set(row.id, {
        id: row.id,
        name: row.name,
        city: row.city,
        country: row.country,
        address: row.address,
        description: row.description,
        starRating: row.starRating,
        reviewScore: row.reviewScore,
        reviewCount: row.reviewCount,
        amenities: row.amenities,
        imageIndex: row.imageIndex,
        roomTypes: [],
      });
    }
    hotelMap.get(row.id)!.roomTypes.push({
      id: row.roomTypeId,
      name: row.roomTypeName,
      pricePerNight: row.pricePerNight,
      capacity: row.capacity,
      availableCount: row.availableCount,
    });
  }

  return Array.from(hotelMap.values());
}

export async function getHotelById(id: string) {
  const results = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      city: hotels.city,
      country: hotels.country,
      address: hotels.address,
      description: hotels.description,
      starRating: hotels.starRating,
      reviewScore: hotels.reviewScore,
      reviewCount: hotels.reviewCount,
      amenities: hotels.amenities,
      imageIndex: hotels.imageIndex,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      pricePerNight: roomTypes.pricePerNight,
      capacity: roomTypes.capacity,
      availableCount: roomTypes.availableCount,
    })
    .from(hotels)
    .innerJoin(roomTypes, eq(roomTypes.hotelId, hotels.id))
    .where(eq(hotels.id, id));

  if (results.length === 0) return null;

  const hotel = {
    id: results[0].id,
    name: results[0].name,
    city: results[0].city,
    country: results[0].country,
    address: results[0].address,
    description: results[0].description,
    starRating: results[0].starRating,
    reviewScore: results[0].reviewScore,
    reviewCount: results[0].reviewCount,
    amenities: results[0].amenities,
    imageIndex: results[0].imageIndex,
    roomTypes: results.map((row) => ({
      id: row.roomTypeId,
      name: row.roomTypeName,
      pricePerNight: row.pricePerNight,
      capacity: row.capacity,
      availableCount: row.availableCount,
    })),
  };

  return hotel;
}

export async function searchCities(query: string) {
  const pattern = `%${query}%`;

  const results = await db
    .selectDistinct({ city: hotels.city, country: hotels.country })
    .from(hotels)
    .where(like(hotels.city, pattern));

  return results;
}
