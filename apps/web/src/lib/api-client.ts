import type {
  FlightSearchResult,
  HotelWithRooms,
  Airport,
  TripsResponse,
  BookFlightResponse,
  BookHotelResponse,
  CancelBookingResponse,
  AuthResponse,
} from "@jexpedia/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API error: ${res.status}`);
    }

    return res.json();
  }

  // Flights
  async searchFlights(params: {
    from: string;
    to: string;
    date: string;
    pax: number;
    seatClass: string;
  }): Promise<FlightSearchResult[]> {
    const sp = new URLSearchParams({
      from: params.from,
      to: params.to,
      date: params.date,
      pax: String(params.pax),
      class: params.seatClass,
    });
    return this.fetch(`/api/flights/search?${sp}`);
  }

  async getFlightById(id: string): Promise<FlightSearchResult | null> {
    try {
      return await this.fetch(`/api/flights/${id}`);
    } catch {
      return null;
    }
  }

  // Hotels
  async searchHotels(params: {
    city: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }): Promise<HotelWithRooms[]> {
    const sp = new URLSearchParams({
      city: params.city,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: String(params.guests),
    });
    return this.fetch(`/api/hotels/search?${sp}`);
  }

  async getHotelById(id: string): Promise<HotelWithRooms | null> {
    try {
      return await this.fetch(`/api/hotels/${id}`);
    } catch {
      return null;
    }
  }

  // Airports
  async getAirportByCode(code: string): Promise<Airport | null> {
    try {
      return await this.fetch(`/api/airports/${code}`);
    } catch {
      return null;
    }
  }

  async searchAirports(query: string): Promise<Airport[]> {
    return this.fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
  }

  // Auth
  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.fetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Bookings
  async bookFlight(data: {
    flightId: string;
    passengers: { firstName: string; lastName: string }[];
    seatClass: string;
  }): Promise<BookFlightResponse> {
    return this.fetch("/api/bookings/flight", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async bookHotel(data: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    tripGroupId?: string;
  }): Promise<BookHotelResponse> {
    return this.fetch("/api/bookings/hotel", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelBooking(type: "flight" | "hotel", bookingId: string): Promise<CancelBookingResponse> {
    return this.fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  }

  async modifyFlightDates(oldBookingId: string, newFlightId: string): Promise<{ success: boolean; newBookingId?: string; error?: string }> {
    return this.fetch("/api/bookings/flight/modify", {
      method: "POST",
      body: JSON.stringify({ oldBookingId, newFlightId }),
    });
  }

  async modifyHotelDates(bookingId: string, newCheckIn: string, newCheckOut: string): Promise<CancelBookingResponse> {
    return this.fetch("/api/bookings/hotel/modify", {
      method: "POST",
      body: JSON.stringify({ bookingId, newCheckIn, newCheckOut }),
    });
  }

  // Trips
  async getMyTrips(): Promise<TripsResponse> {
    return this.fetch("/api/trips");
  }

  async modifyTrip(data: {
    flightBookingId: string;
    newFlightId: string;
    hotelBookingId: string;
    newHotelId: string;
    newRoomTypeId: string;
    newCheckIn: string;
    newCheckOut: string;
    guests: number;
    rooms: number;
  }): Promise<CancelBookingResponse> {
    return this.fetch("/api/trips/modify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Server-side: create with token for authenticated requests
export function createApiClient(token?: string) {
  return new ApiClient(token);
}

// Default unauthenticated client for public endpoints
export const api = new ApiClient();
