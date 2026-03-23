import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, "jexpedia.db");
// Remove existing DB for clean re-seed
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

const db = drizzle(sqlite, { schema });

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS airports (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS airlines (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#1a56db'
  );
  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    airline_code TEXT NOT NULL REFERENCES airlines(code),
    flight_number TEXT NOT NULL,
    departure_airport TEXT NOT NULL REFERENCES airports(code),
    arrival_airport TEXT NOT NULL REFERENCES airports(code),
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    stops INTEGER NOT NULL DEFAULT 0,
    aircraft TEXT NOT NULL,
    economy_price REAL NOT NULL,
    business_price REAL NOT NULL,
    available_seats INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    star_rating INTEGER NOT NULL,
    review_score REAL NOT NULL,
    review_count INTEGER NOT NULL,
    amenities TEXT NOT NULL DEFAULT '[]',
    image_index INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS room_types (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES hotels(id),
    name TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    capacity INTEGER NOT NULL,
    available_count INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS flight_bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    flight_id TEXT NOT NULL REFERENCES flights(id),
    trip_group_id TEXT,
    passengers TEXT NOT NULL DEFAULT '[]',
    seat_class TEXT NOT NULL DEFAULT 'economy',
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    booked_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hotel_bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    hotel_id TEXT NOT NULL REFERENCES hotels(id),
    room_type_id TEXT NOT NULL REFERENCES room_types(id),
    trip_group_id TEXT,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL,
    rooms INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    booked_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(departure_airport, arrival_airport, departure_time);
  CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city, country);
  CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
  CREATE INDEX IF NOT EXISTS idx_flight_bookings_user ON flight_bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user ON hotel_bookings(user_id);
`);

// --- SEED DATA ---

const airportsData = [
  { code: "SFO", name: "San Francisco International", city: "San Francisco", country: "USA" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA" },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "USA" },
  { code: "ORD", name: "O'Hare International", city: "Chicago", country: "USA" },
  { code: "MIA", name: "Miami International", city: "Miami", country: "USA" },
  { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "USA" },
  { code: "DEN", name: "Denver International", city: "Denver", country: "USA" },
  { code: "ATL", name: "Hartsfield-Jackson Atlanta", city: "Atlanta", country: "USA" },
  { code: "BOS", name: "Boston Logan International", city: "Boston", country: "USA" },
  { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "USA" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "Japan" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "KIX", name: "Kansai International", city: "Osaka", country: "Japan" },
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  { code: "FCO", name: "Leonardo da Vinci", city: "Rome", country: "Italy" },
  { code: "BCN", name: "Barcelona-El Prat", city: "Barcelona", country: "Spain" },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany" },
  { code: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea" },
  { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "China" },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China" },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia" },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "UAE" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
  { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India" },
  { code: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "India" },
  { code: "GRU", name: "Guarulhos International", city: "Sao Paulo", country: "Brazil" },
  { code: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico" },
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada" },
  { code: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada" },
  { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
  { code: "VIE", name: "Vienna International", city: "Vienna", country: "Austria" },
  { code: "LIS", name: "Lisbon Portela", city: "Lisbon", country: "Portugal" },
  { code: "DOH", name: "Hamad International", city: "Doha", country: "Qatar" },
  { code: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "South Africa" },
  { code: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt" },
  { code: "NBO", name: "Jomo Kenyatta International", city: "Nairobi", country: "Kenya" },
  { code: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", country: "USA" },
  { code: "CUN", name: "Cancun International", city: "Cancun", country: "Mexico" },
  { code: "MNL", name: "Ninoy Aquino International", city: "Manila", country: "Philippines" },
  { code: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia" },
  { code: "TPE", name: "Taiwan Taoyuan", city: "Taipei", country: "Taiwan" },
  { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden" },
];

const airlinesData = [
  { code: "UA", name: "United Airlines", color: "#002868" },
  { code: "AA", name: "American Airlines", color: "#b6001a" },
  { code: "DL", name: "Delta Air Lines", color: "#003366" },
  { code: "SW", name: "Southwest Airlines", color: "#304cb2" },
  { code: "NH", name: "ANA", color: "#00467f" },
  { code: "JL", name: "Japan Airlines", color: "#c3002f" },
  { code: "BA", name: "British Airways", color: "#075aaa" },
  { code: "AF", name: "Air France", color: "#002157" },
  { code: "LH", name: "Lufthansa", color: "#05164d" },
  { code: "EK", name: "Emirates", color: "#d71921" },
  { code: "SQ", name: "Singapore Airlines", color: "#f0ab00" },
  { code: "QF", name: "Qantas", color: "#e0001a" },
  { code: "CX", name: "Cathay Pacific", color: "#005d3b" },
  { code: "TK", name: "Turkish Airlines", color: "#c8102e" },
  { code: "QR", name: "Qatar Airways", color: "#5c0632" },
];

const aircraftTypes = [
  "Boeing 787-9", "Boeing 777-300ER", "Boeing 737 MAX 8", "Airbus A350-900",
  "Airbus A380", "Airbus A320neo", "Boeing 767-300ER", "Airbus A330-300",
];

// Popular routes for generating flights
const routes = [
  ["SFO", "NRT"], ["SFO", "LHR"], ["SFO", "CDG"], ["SFO", "HND"], ["SFO", "ICN"],
  ["JFK", "LHR"], ["JFK", "CDG"], ["JFK", "NRT"], ["JFK", "FCO"], ["JFK", "BCN"],
  ["LAX", "NRT"], ["LAX", "SYD"], ["LAX", "HKG"], ["LAX", "LHR"], ["LAX", "CDG"],
  ["ORD", "LHR"], ["ORD", "FRA"], ["ORD", "NRT"], ["ORD", "CDG"],
  ["MIA", "LHR"], ["MIA", "CDG"], ["MIA", "GRU"], ["MIA", "CUN"],
  ["SEA", "NRT"], ["SEA", "ICN"], ["SEA", "LHR"],
  ["DFW", "LHR"], ["DFW", "NRT"], ["DFW", "CUN"],
  ["SFO", "LAX"], ["SFO", "JFK"], ["SFO", "SEA"], ["SFO", "DEN"],
  ["JFK", "LAX"], ["JFK", "MIA"], ["JFK", "ORD"], ["JFK", "BOS"],
  ["LAX", "JFK"], ["LAX", "ORD"], ["LAX", "MIA"], ["LAX", "HNL"],
  ["LHR", "DXB"], ["LHR", "SIN"], ["LHR", "HKG"],
  ["SIN", "SYD"], ["SIN", "BKK"], ["SIN", "NRT"],
  ["DXB", "SIN"], ["DXB", "BKK"], ["DXB", "DEL"],
  ["HKG", "NRT"], ["HKG", "SIN"], ["HKG", "BKK"],
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// Seasonal price multiplier
function getSeasonMultiplier(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month >= 6 && month <= 8) return 1.5;
  if ((month === 12 && day >= 20) || (month === 1 && day <= 5)) return 1.5;
  return 1.0;
}

console.log("Seeding airports...");
for (const a of airportsData) {
  db.insert(schema.airports).values(a).run();
}

console.log("Seeding airlines...");
for (const a of airlinesData) {
  db.insert(schema.airlines).values(a).run();
}

console.log("Seeding flights...");
const today = new Date();
today.setHours(0, 0, 0, 0);

let flightCount = 0;
for (let dayOffset = 1; dayOffset <= 90; dayOffset++) {
  const date = addDays(today, dayOffset);
  const dateStr = formatDate(date);
  const multiplier = getSeasonMultiplier(date);

  for (const [dep, arr] of routes) {
    // 1-3 flights per route per day
    const numFlights = randomInt(1, 3);
    for (let i = 0; i < numFlights; i++) {
      const airline = randomChoice(airlinesData);
      const depHour = randomInt(6, 22);
      const depMin = randomChoice([0, 15, 30, 45]);
      const isLongHaul = !["SFO","LAX","JFK","ORD","MIA","SEA","DEN","ATL","BOS","DFW"].includes(dep) ||
                         !["SFO","LAX","JFK","ORD","MIA","SEA","DEN","ATL","BOS","DFW"].includes(arr);

      const duration = isLongHaul ? randomInt(480, 960) : randomInt(120, 360);
      const stops = isLongHaul ? randomChoice([0, 0, 0, 1, 1]) : randomChoice([0, 0, 0, 0, 1]);

      const arrDate = new Date(date);
      arrDate.setHours(depHour, depMin, 0, 0);
      arrDate.setMinutes(arrDate.getMinutes() + duration);

      const basePrice = isLongHaul ? randomInt(400, 1200) : randomInt(80, 400);
      const economyPrice = Math.round(basePrice * multiplier);
      const businessPrice = Math.round(economyPrice * randomChoice([2.5, 3, 3.5]));

      db.insert(schema.flights).values({
        id: uuid(),
        airlineCode: airline.code,
        flightNumber: `${airline.code} ${randomInt(100, 999)}`,
        departureAirport: dep,
        arrivalAirport: arr,
        departureTime: `${dateStr}T${formatTime(depHour, depMin)}`,
        arrivalTime: arrDate.toISOString().slice(0, 16),
        durationMinutes: duration,
        stops,
        aircraft: randomChoice(aircraftTypes),
        economyPrice,
        businessPrice,
        availableSeats: randomInt(1, 180),
      }).run();
      flightCount++;
    }
  }
}
console.log(`  ${flightCount} flights seeded`);

console.log("Seeding hotels...");
const hotelCities = [
  { city: "Tokyo", country: "Japan" },
  { city: "London", country: "UK" },
  { city: "Paris", country: "France" },
  { city: "New York", country: "USA" },
  { city: "San Francisco", country: "USA" },
  { city: "Los Angeles", country: "USA" },
  { city: "Rome", country: "Italy" },
  { city: "Barcelona", country: "Spain" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Dubai", country: "UAE" },
  { city: "Singapore", country: "Singapore" },
  { city: "Sydney", country: "Australia" },
  { city: "Seoul", country: "South Korea" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Hong Kong", country: "China" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Miami", country: "USA" },
  { city: "Chicago", country: "USA" },
  { city: "Seattle", country: "USA" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Copenhagen", country: "Denmark" },
  { city: "Munich", country: "Germany" },
  { city: "Zurich", country: "Switzerland" },
  { city: "Honolulu", country: "USA" },
  { city: "Cancun", country: "Mexico" },
];

const hotelPrefixes = [
  "Grand", "Royal", "The", "Park", "Hotel", "Palace", "Metro", "City",
  "Ocean", "Sakura", "Golden", "Silver", "Crystal", "Diamond", "Azure",
];
const hotelSuffixes = [
  "Hotel", "Inn", "Suites", "Resort", "Lodge", "Plaza", "Tower", "View",
  "Garden", "Heights", "Court", "House", "Residences",
];
const amenitiesPool = [
  "WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service",
  "Parking", "Airport Shuttle", "Business Center", "Concierge",
  "Laundry", "Pet Friendly", "EV Charging", "Rooftop Terrace",
];

let hotelCount = 0;
for (const { city, country } of hotelCities) {
  const numHotels = randomInt(6, 12);
  for (let i = 0; i < numHotels; i++) {
    const hotelId = uuid();
    const stars = randomChoice([3, 3, 4, 4, 4, 5, 5]);
    const reviewScore = stars === 5 ? (4.2 + Math.random() * 0.8) :
                        stars === 4 ? (3.5 + Math.random() * 1.0) :
                        (3.0 + Math.random() * 1.0);
    const numAmenities = randomInt(4, 10);
    const selectedAmenities = [...amenitiesPool].sort(() => Math.random() - 0.5).slice(0, numAmenities);

    db.insert(schema.hotels).values({
      id: hotelId,
      name: `${randomChoice(hotelPrefixes)} ${city} ${randomChoice(hotelSuffixes)}`,
      city,
      country,
      address: `${randomInt(1, 999)} ${city} Main Street`,
      description: `A beautiful ${stars}-star hotel in the heart of ${city} offering world-class hospitality and modern amenities.`,
      starRating: stars,
      reviewScore: Math.round(reviewScore * 10) / 10,
      reviewCount: randomInt(50, 2000),
      amenities: JSON.stringify(selectedAmenities),
      imageIndex: randomInt(0, 9),
    }).run();

    // Room types
    const roomTypes = [
      { name: "Standard Room", priceMult: 1, capacity: 2 },
      { name: "Deluxe Room", priceMult: 1.6, capacity: 2 },
      { name: "Suite", priceMult: 2.8, capacity: 4 },
    ];

    const basePrice = stars === 5 ? randomInt(200, 500) :
                      stars === 4 ? randomInt(100, 250) :
                      randomInt(60, 150);

    for (const rt of roomTypes) {
      db.insert(schema.roomTypes).values({
        id: uuid(),
        hotelId,
        name: rt.name,
        pricePerNight: Math.round(basePrice * rt.priceMult),
        capacity: rt.capacity,
        availableCount: randomInt(1, 20),
      }).run();
    }

    hotelCount++;
  }
}
console.log(`  ${hotelCount} hotels seeded`);

console.log("Done! Database seeded at data/jexpedia.db");
