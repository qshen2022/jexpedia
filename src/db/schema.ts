import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const airports = sqliteTable("airports", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
});

export const airlines = sqliteTable("airlines", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#1a56db"),
});

export const flights = sqliteTable("flights", {
  id: text("id").primaryKey(),
  airlineCode: text("airline_code").notNull().references(() => airlines.code),
  flightNumber: text("flight_number").notNull(),
  departureAirport: text("departure_airport").notNull().references(() => airports.code),
  arrivalAirport: text("arrival_airport").notNull().references(() => airports.code),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  stops: integer("stops").notNull().default(0),
  aircraft: text("aircraft").notNull(),
  economyPrice: real("economy_price").notNull(),
  businessPrice: real("business_price").notNull(),
  availableSeats: integer("available_seats").notNull(),
});

export const hotels = sqliteTable("hotels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  address: text("address").notNull(),
  description: text("description").notNull(),
  starRating: integer("star_rating").notNull(),
  reviewScore: real("review_score").notNull(),
  reviewCount: integer("review_count").notNull(),
  amenities: text("amenities").notNull().default("[]"), // JSON array
  imageIndex: integer("image_index").notNull().default(0),
});

export const roomTypes = sqliteTable("room_types", {
  id: text("id").primaryKey(),
  hotelId: text("hotel_id").notNull().references(() => hotels.id),
  name: text("name").notNull(),
  pricePerNight: real("price_per_night").notNull(),
  capacity: integer("capacity").notNull(),
  availableCount: integer("available_count").notNull(),
});

export const flightBookings = sqliteTable("flight_bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  flightId: text("flight_id").notNull().references(() => flights.id),
  tripGroupId: text("trip_group_id"),
  passengers: text("passengers").notNull().default("[]"), // JSON
  seatClass: text("seat_class").notNull().default("economy"),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("confirmed"),
  bookedAt: text("booked_at").notNull(),
});

export const hotelBookings = sqliteTable("hotel_bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  hotelId: text("hotel_id").notNull().references(() => hotels.id),
  roomTypeId: text("room_type_id").notNull().references(() => roomTypes.id),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guests: integer("guests").notNull(),
  rooms: integer("rooms").notNull().default(1),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("confirmed"),
  bookedAt: text("booked_at").notNull(),
});
