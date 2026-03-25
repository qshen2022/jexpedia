// Shared types between API and Web app

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightSearchResult {
  id: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  aircraft: string;
  economyPrice: number;
  businessPrice: number;
  availableSeats: number;
  airlineCode: string;
  airlineName: string;
  airlineColor: string;
}

export interface HotelRoomType {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  availableCount: number;
}

export interface HotelWithRooms {
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
  roomTypes: HotelRoomType[];
}

export interface FlightBookingRow {
  bookingId: string;
  flightId: string;
  tripGroupId: string | null;
  passengers: string;
  seatClass: string;
  totalPrice: number;
  status: string;
  bookedAt: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
}

export interface HotelBookingRow {
  bookingId: string;
  hotelId: string;
  tripGroupId: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  status: string;
  bookedAt: string;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  roomTypeName: string;
  pricePerNight: number;
}

export interface TripsResponse {
  flightBookings: FlightBookingRow[];
  hotelBookings: HotelBookingRow[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name: string };
  error?: string;
}

export interface BookFlightRequest {
  flightId: string;
  passengers: { firstName: string; lastName: string }[];
  seatClass: string;
}

export interface BookFlightResponse {
  success: boolean;
  bookingId?: string;
  tripGroupId?: string;
  error?: string;
}

export interface BookHotelRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  tripGroupId?: string;
}

export interface BookHotelResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  error?: string;
}

export interface ModifyFlightDatesRequest {
  oldBookingId: string;
  newFlightId: string;
}

export interface ModifyHotelDatesRequest {
  bookingId: string;
  newCheckIn: string;
  newCheckOut: string;
}

export interface ModifyTripRequest {
  flightBookingId: string;
  newFlightId: string;
  hotelBookingId: string;
  newHotelId: string;
  newRoomTypeId: string;
  newCheckIn: string;
  newCheckOut: string;
  guests: number;
  rooms: number;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}
