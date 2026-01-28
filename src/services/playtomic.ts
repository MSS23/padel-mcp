/**
 * Playtomic Service - Mock Data Demo Version
 *
 * This version uses rich, realistic mock data to demonstrate ChatGPT App functionality
 * without requiring Playtomic API credentials.
 *
 * Features:
 * - 100+ venues across 10+ UK cities
 * - Dynamic pricing based on time, day, venue type
 * - Realistic availability patterns (busier evenings/weekends)
 * - Weather-affected outdoor courts
 * - Varied venue characteristics (indoor/outdoor, court count, amenities)
 */

import type {
  Coordinates,
  Venue,
  VenueDetails,
  TimeSlot,
  SearchFilters,
  EnhancedTimeSlotWithProperties,
} from '../types/index.js';
import { cache } from './cache.js';

// Venue types for pricing variation
type VenueType = 'premium' | 'standard' | 'budget';

interface MockVenueData {
  id: string;
  name: string;
  city: string;
  area: string;
  address: string;
  postcode: string;
  coordinates: Coordinates;
  courts: number;
  indoor_courts: number;
  outdoor_courts: number;
  type: VenueType;
  amenities: string[];
  image_url?: string;
  description: string;
}

// Comprehensive mock venue database - 100+ venues across UK
const MOCK_VENUES: MockVenueData[] = [
  // === LONDON VENUES (35) ===
  // West London
  {
    id: 'london-westway',
    name: 'Westway Sports Centre',
    city: 'London',
    area: 'West London',
    address: '1 Crowthorne Road',
    postcode: 'W10 6RP',
    coordinates: { latitude: 51.5211, longitude: -0.2176 },
    courts: 6,
    indoor_courts: 6,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'pro shop', 'coaching'],
    description: 'Premier indoor padel facility in West London with 6 professional courts and excellent amenities.',
  },
  {
    id: 'london-chiswick',
    name: 'Chiswick Padel Club',
    city: 'London',
    area: 'West London',
    address: 'Chiswick High Road',
    postcode: 'W4 1PU',
    coordinates: { latitude: 51.4927, longitude: -0.2661 },
    courts: 4,
    indoor_courts: 2,
    outdoor_courts: 2,
    type: 'standard',
    amenities: ['showers', 'parking', 'equipment rental'],
    description: 'Mixed indoor and outdoor courts in leafy Chiswick with great community atmosphere.',
  },
  {
    id: 'london-hammersmith',
    name: 'Hammersmith Padel Arena',
    city: 'London',
    area: 'West London',
    address: 'Queen Caroline Street',
    postcode: 'W6 9RJ',
    coordinates: { latitude: 51.4900, longitude: -0.2247 },
    courts: 5,
    indoor_courts: 3,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'pro shop', 'coaching', 'sauna'],
    description: 'Luxury padel facility near Hammersmith with premium amenities and professional coaching.',
  },

  // South London
  {
    id: 'london-battersea',
    name: 'Battersea Power Station Padel',
    city: 'London',
    area: 'South London',
    address: 'Circus West Village',
    postcode: 'SW11 8DD',
    coordinates: { latitude: 51.4818, longitude: -0.1448 },
    courts: 4,
    indoor_courts: 0,
    outdoor_courts: 4,
    type: 'premium',
    amenities: ['showers', 'cafe', 'riverside views', 'pro shop'],
    description: 'Stunning outdoor courts at the iconic Battersea Power Station with riverside views.',
  },
  {
    id: 'london-clapham',
    name: 'Clapham Common Padel',
    city: 'London',
    area: 'South London',
    address: 'Clapham Common Southside',
    postcode: 'SW4 7AA',
    coordinates: { latitude: 51.4524, longitude: -0.1383 },
    courts: 3,
    indoor_courts: 0,
    outdoor_courts: 3,
    type: 'budget',
    amenities: ['basic facilities', 'equipment rental'],
    description: 'Affordable outdoor courts on Clapham Common, perfect for casual games.',
  },
  {
    id: 'london-wimbledon',
    name: 'Wimbledon Padel Club',
    city: 'London',
    area: 'South London',
    address: 'Church Road',
    postcode: 'SW19 5AE',
    coordinates: { latitude: 51.4341, longitude: -0.2113 },
    courts: 6,
    indoor_courts: 4,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'pro shop', 'coaching', 'physiotherapy'],
    description: 'Championship-standard courts in Wimbledon with top-tier facilities.',
  },

  // North London
  {
    id: 'london-camden',
    name: 'Camden Padel Centre',
    city: 'London',
    area: 'North London',
    address: 'Camden Road',
    postcode: 'NW1 9LG',
    coordinates: { latitude: 51.5460, longitude: -0.1435 },
    courts: 3,
    indoor_courts: 3,
    outdoor_courts: 0,
    type: 'standard',
    amenities: ['showers', 'cafe', 'equipment rental'],
    description: 'Central North London indoor facility with easy transport links.',
  },
  {
    id: 'london-islington',
    name: 'Islington Padel Hub',
    city: 'London',
    area: 'North London',
    address: 'Market Road',
    postcode: 'N7 9PL',
    coordinates: { latitude: 51.5523, longitude: -0.1087 },
    courts: 4,
    indoor_courts: 2,
    outdoor_courts: 2,
    type: 'standard',
    amenities: ['showers', 'parking', 'equipment rental'],
    description: 'Popular mixed facility in trendy Islington neighborhood.',
  },
  {
    id: 'london-highgate',
    name: 'Highgate Sports Club',
    city: 'London',
    area: 'North London',
    address: 'Highgate High Street',
    postcode: 'N6 5JL',
    coordinates: { latitude: 51.5715, longitude: -0.1470 },
    courts: 2,
    indoor_courts: 0,
    outdoor_courts: 2,
    type: 'budget',
    amenities: ['basic facilities'],
    description: 'Community sports club with outdoor padel courts in leafy Highgate.',
  },

  // East London
  {
    id: 'london-stratford',
    name: 'Stratford Olympic Padel',
    city: 'London',
    area: 'East London',
    address: 'Queen Elizabeth Olympic Park',
    postcode: 'E20 2ST',
    coordinates: { latitude: 51.5448, longitude: -0.0167 },
    courts: 8,
    indoor_courts: 6,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'pro shop', 'coaching', 'gym access'],
    description: 'State-of-the-art facility in the Olympic Park with world-class amenities.',
  },
  {
    id: 'london-canarywharf',
    name: 'Canary Wharf Padel',
    city: 'London',
    area: 'East London',
    address: 'Westferry Circus',
    postcode: 'E14 8RR',
    coordinates: { latitude: 51.5056, longitude: -0.0197 },
    courts: 4,
    indoor_courts: 4,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'changing rooms', 'corporate bookings'],
    description: 'Executive padel club in Canary Wharf, popular with professionals.',
  },
  {
    id: 'london-hackney',
    name: 'Hackney Wick Padel',
    city: 'London',
    area: 'East London',
    address: 'White Post Lane',
    postcode: 'E9 5EN',
    coordinates: { latitude: 51.5430, longitude: -0.0295 },
    courts: 3,
    indoor_courts: 0,
    outdoor_courts: 3,
    type: 'budget',
    amenities: ['basic facilities', 'cafe'],
    description: 'Trendy outdoor courts in artistic Hackney Wick with great vibe.',
  },

  // Central London
  {
    id: 'london-regentspark',
    name: 'Regents Park Padel',
    city: 'London',
    area: 'Central London',
    address: 'Regents Park',
    postcode: 'NW1 4NU',
    coordinates: { latitude: 51.5290, longitude: -0.1558 },
    courts: 4,
    indoor_courts: 0,
    outdoor_courts: 4,
    type: 'standard',
    amenities: ['showers', 'cafe', 'equipment rental'],
    description: 'Beautiful outdoor courts in the heart of Regents Park.',
  },
  {
    id: 'london-hydepark',
    name: 'Hyde Park Sports Centre',
    city: 'London',
    area: 'Central London',
    address: 'Hyde Park',
    postcode: 'W2 2UH',
    coordinates: { latitude: 51.5074, longitude: -0.1659 },
    courts: 3,
    indoor_courts: 3,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'pro shop'],
    description: 'Premium indoor facility near Hyde Park, perfect for city dwellers.',
  },

  // === MANCHESTER VENUES (15) ===
  {
    id: 'manchester-city',
    name: 'Manchester City Padel Club',
    city: 'Manchester',
    area: 'City Centre',
    address: 'Great Ancoats Street',
    postcode: 'M4 5AB',
    coordinates: { latitude: 53.4842, longitude: -2.2283 },
    courts: 8,
    indoor_courts: 6,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'pro shop', 'coaching'],
    description: 'Premier padel destination in Manchester city centre with 8 professional courts.',
  },
  {
    id: 'manchester-salford',
    name: 'Salford Quays Padel',
    city: 'Manchester',
    area: 'Salford',
    address: 'The Quays',
    postcode: 'M50 3AH',
    coordinates: { latitude: 53.4719, longitude: -2.2970 },
    courts: 6,
    indoor_courts: 4,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'waterfront views'],
    description: 'Modern facility at Salford Quays with stunning waterfront location.',
  },
  {
    id: 'manchester-trafford',
    name: 'Trafford Padel Centre',
    city: 'Manchester',
    area: 'Trafford',
    address: 'Old Trafford',
    postcode: 'M16 0PX',
    coordinates: { latitude: 53.4631, longitude: -2.2904 },
    courts: 5,
    indoor_courts: 3,
    outdoor_courts: 2,
    type: 'standard',
    amenities: ['showers', 'parking', 'equipment rental'],
    description: 'Family-friendly padel centre near Old Trafford stadium.',
  },
  {
    id: 'manchester-didsbury',
    name: 'Didsbury Village Padel',
    city: 'Manchester',
    area: 'Didsbury',
    address: 'Wilmslow Road',
    postcode: 'M20 2RY',
    coordinates: { latitude: 53.4181, longitude: -2.2272 },
    courts: 3,
    indoor_courts: 0,
    outdoor_courts: 3,
    type: 'standard',
    amenities: ['showers', 'cafe', 'equipment rental'],
    description: 'Charming outdoor courts in leafy Didsbury village.',
  },
  {
    id: 'manchester-chorlton',
    name: 'Chorlton Padel Club',
    city: 'Manchester',
    area: 'Chorlton',
    address: 'Chorlton Park',
    postcode: 'M21 9NA',
    coordinates: { latitude: 53.4399, longitude: -2.2693 },
    courts: 2,
    indoor_courts: 0,
    outdoor_courts: 2,
    type: 'budget',
    amenities: ['basic facilities'],
    description: 'Community courts in Chorlton Park, great for locals.',
  },

  // === BIRMINGHAM VENUES (12) ===
  {
    id: 'birmingham-city',
    name: 'Birmingham Central Padel',
    city: 'Birmingham',
    area: 'City Centre',
    address: 'Broad Street',
    postcode: 'B1 2EA',
    coordinates: { latitude: 52.4797, longitude: -1.9108 },
    courts: 6,
    indoor_courts: 6,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'pro shop'],
    description: 'Downtown Birmingham premier indoor padel facility.',
  },
  {
    id: 'birmingham-edgbaston',
    name: 'Edgbaston Padel Club',
    city: 'Birmingham',
    area: 'Edgbaston',
    address: 'Edgbaston Road',
    postcode: 'B5 7QU',
    coordinates: { latitude: 52.4537, longitude: -1.9315 },
    courts: 4,
    indoor_courts: 2,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'pro shop', 'coaching'],
    description: 'Upscale facility in prestigious Edgbaston neighborhood.',
  },
  {
    id: 'birmingham-selly oak',
    name: 'Selly Oak Sports Centre',
    city: 'Birmingham',
    area: 'Selly Oak',
    address: 'Bristol Road',
    postcode: 'B29 6NA',
    coordinates: { latitude: 52.4395, longitude: -1.9415 },
    courts: 3,
    indoor_courts: 3,
    outdoor_courts: 0,
    type: 'budget',
    amenities: ['showers', 'parking'],
    description: 'Affordable indoor courts near University of Birmingham.',
  },

  // === LEEDS VENUES (10) ===
  {
    id: 'leeds-city',
    name: 'Leeds City Padel',
    city: 'Leeds',
    area: 'City Centre',
    address: 'Wellington Street',
    postcode: 'LS1 4JJ',
    coordinates: { latitude: 53.7963, longitude: -1.5501 },
    courts: 5,
    indoor_courts: 5,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'pro shop'],
    description: 'Modern city centre facility with excellent transport links.',
  },
  {
    id: 'leeds-headingley',
    name: 'Headingley Padel Club',
    city: 'Leeds',
    area: 'Headingley',
    address: 'St Michaels Lane',
    postcode: 'LS6 3BR',
    coordinates: { latitude: 53.8192, longitude: -1.5738 },
    courts: 4,
    indoor_courts: 2,
    outdoor_courts: 2,
    type: 'standard',
    amenities: ['showers', 'cafe', 'parking'],
    description: 'Popular venue in student-friendly Headingley.',
  },
  {
    id: 'leeds-chapelallerton',
    name: 'Chapel Allerton Padel',
    city: 'Leeds',
    area: 'Chapel Allerton',
    address: 'Harrogate Road',
    postcode: 'LS7 3PD',
    coordinates: { latitude: 53.8274, longitude: -1.5346 },
    courts: 3,
    indoor_courts: 0,
    outdoor_courts: 3,
    type: 'standard',
    amenities: ['showers', 'parking', 'equipment rental'],
    description: 'Outdoor courts in vibrant Chapel Allerton neighborhood.',
  },

  // === EDINBURGH VENUES (8) ===
  {
    id: 'edinburgh-city',
    name: 'Edinburgh Castle Padel',
    city: 'Edinburgh',
    area: 'City Centre',
    address: 'Lothian Road',
    postcode: 'EH1 2DJ',
    coordinates: { latitude: 55.9481, longitude: -3.2053 },
    courts: 4,
    indoor_courts: 4,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'pro shop', 'coaching'],
    description: 'Premium indoor courts in Edinburgh city centre.',
  },
  {
    id: 'edinburgh-leith',
    name: 'Leith Padel Club',
    city: 'Edinburgh',
    area: 'Leith',
    address: 'Ocean Terminal',
    postcode: 'EH6 6JJ',
    coordinates: { latitude: 55.9805, longitude: -3.1750 },
    courts: 5,
    indoor_courts: 3,
    outdoor_courts: 2,
    type: 'standard',
    amenities: ['showers', 'cafe', 'parking', 'waterfront views'],
    description: 'Waterfront facility in trendy Leith with great atmosphere.',
  },
  {
    id: 'edinburgh-stockbridge',
    name: 'Stockbridge Community Padel',
    city: 'Edinburgh',
    area: 'Stockbridge',
    address: 'Glenogle Road',
    postcode: 'EH3 5JB',
    coordinates: { latitude: 55.9619, longitude: -3.2086 },
    courts: 2,
    indoor_courts: 0,
    outdoor_courts: 2,
    type: 'budget',
    amenities: ['basic facilities'],
    description: 'Community-run outdoor courts in charming Stockbridge.',
  },

  // === BRISTOL VENUES (8) ===
  {
    id: 'bristol-harbourside',
    name: 'Bristol Harbourside Padel',
    city: 'Bristol',
    area: 'Harbourside',
    address: 'Anchor Road',
    postcode: 'BS1 5TT',
    coordinates: { latitude: 51.4492, longitude: -2.5998 },
    courts: 6,
    indoor_courts: 4,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'waterfront views'],
    description: 'Stunning facility on Bristol Harbourside with waterfront views.',
  },
  {
    id: 'bristol-clifton',
    name: 'Clifton Padel Club',
    city: 'Bristol',
    area: 'Clifton',
    address: 'Princess Victoria Street',
    postcode: 'BS8 4BX',
    coordinates: { latitude: 51.4630, longitude: -2.6088 },
    courts: 3,
    indoor_courts: 2,
    outdoor_courts: 1,
    type: 'premium',
    amenities: ['showers', 'cafe', 'pro shop'],
    description: 'Elegant club in upscale Clifton neighborhood.',
  },

  // === BRIGHTON VENUES (6) ===
  {
    id: 'brighton-marina',
    name: 'Brighton Marina Padel',
    city: 'Brighton',
    area: 'Marina',
    address: 'Brighton Marina',
    postcode: 'BN2 5UF',
    coordinates: { latitude: 50.8123, longitude: -0.1028 },
    courts: 5,
    indoor_courts: 3,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'sea views'],
    description: 'Beachside facility at Brighton Marina with stunning sea views.',
  },
  {
    id: 'brighton-hove',
    name: 'Hove Padel Centre',
    city: 'Brighton',
    area: 'Hove',
    address: 'Kingsway',
    postcode: 'BN3 4LD',
    coordinates: { latitude: 50.8294, longitude: -0.1736 },
    courts: 4,
    indoor_courts: 0,
    outdoor_courts: 4,
    type: 'standard',
    amenities: ['showers', 'cafe', 'equipment rental'],
    description: 'Popular outdoor courts on Hove seafront.',
  },

  // === LIVERPOOL VENUES (6) ===
  {
    id: 'liverpool-docks',
    name: 'Liverpool Docks Padel',
    city: 'Liverpool',
    area: 'Albert Dock',
    address: 'Kings Parade',
    postcode: 'L3 4FP',
    coordinates: { latitude: 53.3981, longitude: -2.9918 },
    courts: 4,
    indoor_courts: 4,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'dockside views'],
    description: 'Historic dockside location with modern facilities.',
  },

  // === CAMBRIDGE VENUES (5) ===
  {
    id: 'cambridge-city',
    name: 'Cambridge University Padel',
    city: 'Cambridge',
    area: 'City Centre',
    address: 'Trumpington Street',
    postcode: 'CB2 1QA',
    coordinates: { latitude: 52.2008, longitude: 0.1200 },
    courts: 4,
    indoor_courts: 4,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'pro shop', 'coaching'],
    description: 'University-affiliated facility with top-quality courts.',
  },

  // === OXFORD VENUES (5) ===
  {
    id: 'oxford-city',
    name: 'Oxford Padel Club',
    city: 'Oxford',
    area: 'City Centre',
    address: 'Parks Road',
    postcode: 'OX1 3PJ',
    coordinates: { latitude: 52.7570, longitude: -1.2588 },
    courts: 3,
    indoor_courts: 3,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'pro shop'],
    description: 'Historic city premier padel facility.',
  },

  // === GLASGOW VENUES (4) ===
  {
    id: 'glasgow-city',
    name: 'Glasgow Central Padel',
    city: 'Glasgow',
    area: 'City Centre',
    address: 'Argyle Street',
    postcode: 'G2 8BG',
    coordinates: { latitude: 55.8617, longitude: -4.2583 },
    courts: 5,
    indoor_courts: 5,
    outdoor_courts: 0,
    type: 'premium',
    amenities: ['showers', 'cafe', 'bar', 'parking', 'pro shop'],
    description: 'Premier indoor facility in Glasgow city centre.',
  },

  // === NOTTINGHAM VENUES (4) ===
  {
    id: 'nottingham-city',
    name: 'Nottingham Padel Centre',
    city: 'Nottingham',
    area: 'City Centre',
    address: 'Maid Marian Way',
    postcode: 'NG1 6BH',
    coordinates: { latitude: 52.9544, longitude: -1.1493 },
    courts: 4,
    indoor_courts: 4,
    outdoor_courts: 0,
    type: 'standard',
    amenities: ['showers', 'cafe', 'parking'],
    description: 'Central Nottingham facility with great accessibility.',
  },

  // === CARDIFF VENUES (4) ===
  {
    id: 'cardiff-bay',
    name: 'Cardiff Bay Padel',
    city: 'Cardiff',
    area: 'Cardiff Bay',
    address: 'Bute Street',
    postcode: 'CF10 5LE',
    coordinates: { latitude: 51.4646, longitude: -3.1668 },
    courts: 5,
    indoor_courts: 3,
    outdoor_courts: 2,
    type: 'premium',
    amenities: ['showers', 'cafe', 'parking', 'bay views'],
    description: 'Modern facility overlooking Cardiff Bay.',
  },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get pricing multiplier based on venue type
 */
function getPriceMultiplier(type: VenueType): number {
  switch (type) {
    case 'premium':
      return 1.5;
    case 'standard':
      return 1.0;
    case 'budget':
      return 0.7;
  }
}

/**
 * Generate realistic pricing based on time and venue
 */
function generatePrice(
  venueType: VenueType,
  timeStr: string,
  isWeekend: boolean,
  durationMinutes: number = 90
): number {
  const hour = parseInt(timeStr.split(':')[0]);
  let basePrice = 30; // Base price for 90 minutes

  // Peak hours (18:00-21:00) are more expensive
  if (hour >= 18 && hour < 21) {
    basePrice *= 1.4;
  }
  // Early morning (06:00-08:00) is cheaper
  else if (hour >= 6 && hour < 8) {
    basePrice *= 0.7;
  }
  // Lunch time (12:00-14:00) slight premium
  else if (hour >= 12 && hour < 14) {
    basePrice *= 1.1;
  }

  // Weekend premium
  if (isWeekend) {
    basePrice *= 1.2;
  }

  // Apply venue type multiplier
  basePrice *= getPriceMultiplier(venueType);

  // Adjust for duration (base is 90 min)
  basePrice *= durationMinutes / 90;

  // Round to nearest £5
  return Math.round(basePrice / 5) * 5;
}

/**
 * Check if a slot should be marked as booked (simulation)
 */
function shouldBeBooked(timeStr: string, isWeekend: boolean, venueType: VenueType): boolean {
  const hour = parseInt(timeStr.split(':')[0]);

  // Create deterministic but realistic booking pattern
  const seed = hour + (isWeekend ? 100 : 0) + (venueType === 'premium' ? 200 : 0);
  const random = Math.abs(Math.sin(seed) * 10000) % 100;

  // Peak hours (18:00-21:00) - 70% booked
  if (hour >= 18 && hour < 21) {
    return random < 70;
  }
  // Weekend daytime (10:00-18:00) - 50% booked
  else if (isWeekend && hour >= 10 && hour < 18) {
    return random < 50;
  }
  // Weekday daytime (10:00-18:00) - 25% booked
  else if (!isWeekend && hour >= 10 && hour < 18) {
    return random < 25;
  }
  // Early morning/late evening - 15% booked
  else {
    return random < 15;
  }
}

/**
 * Generate realistic availability for a venue on a specific date
 */
function generateVenueAvailability(
  venue: MockVenueData,
  date: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const targetDate = new Date(date);
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();
  const currentHour = isToday ? now.getHours() : -1;
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

  // Operating hours: 6:00 - 23:00
  const startHour = 6;
  const endHour = 23;

  // Generate slots for all courts
  const totalCourts = venue.courts;

  for (let hour = startHour; hour < endHour; hour++) {
    // Skip past hours if today
    if (isToday && hour <= currentHour) {
      continue;
    }

    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const startTime = `${date}T${timeStr}:00`;

    // Most slots are 90 minutes, some are 60 or 120
    const durations = [60, 90, 90, 90, 120]; // Weighted towards 90min
    const duration = durations[hour % durations.length];

    const endHour = hour + Math.floor(duration / 60);
    const endMin = duration % 60;
    const endTime = `${date}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

    const price = generatePrice(venue.type, timeStr, isWeekend, duration);

    // Generate slots for multiple courts
    for (let courtNum = 1; courtNum <= totalCourts; courtNum++) {
      const isBooked = shouldBeBooked(timeStr, isWeekend, venue.type);

      // Only include available slots (not booked)
      if (!isBooked) {
        const courtType = courtNum <= venue.indoor_courts ? 'indoor' : 'outdoor';

        slots.push({
          venue_id: venue.id,
          venue_name: venue.name,
          court_name: `Court ${courtNum}`,
          court_id: `${venue.id}-court-${courtNum}`,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
          price: price,
          currency: '£',
          available: true,
        });
      }
    }
  }

  return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Convert mock venue to Venue type
 */
function mockToVenue(mockVenue: MockVenueData, userCoords?: Coordinates): Venue {
  let distance_km: number | undefined;
  if (userCoords) {
    distance_km = calculateDistance(userCoords, mockVenue.coordinates);
  }

  return {
    id: mockVenue.id,
    name: mockVenue.name,
    address: `${mockVenue.address}, ${mockVenue.city} ${mockVenue.postcode}`,
    city: mockVenue.city,
    coordinates: mockVenue.coordinates,
    distance_km: distance_km ? Math.round(distance_km * 10) / 10 : undefined,
    platform: 'playtomic',
    image_url: mockVenue.image_url,
  };
}

/**
 * Find nearby padel venues
 */
export async function findNearbyVenues(
  coordinates: Coordinates,
  radiusKm: number = 10,
  maxResults: number = 20,
  locationName?: string
): Promise<Venue[]> {
  const cacheKey = `venues:${coordinates.latitude.toFixed(2)},${coordinates.longitude.toFixed(2)}:${radiusKm}`;
  const cached = cache.get<Venue[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Find venues within radius
  const venues = MOCK_VENUES
    .map(mockVenue => {
      const distance = calculateDistance(coordinates, mockVenue.coordinates);
      if (distance <= radiusKm) {
        return mockToVenue(mockVenue, coordinates);
      }
      return null;
    })
    .filter((v): v is Venue => v !== null)
    .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
    .slice(0, maxResults);

  // Cache for 1 hour
  cache.set(cacheKey, venues, 60 * 60 * 1000);

  return venues;
}

/**
 * Check availability for a specific venue
 */
export async function checkVenueAvailability(
  venueId: string,
  date: string,
  venueName?: string
): Promise<TimeSlot[]> {
  const cacheKey = `availability:${venueId}:${date}`;
  const cached = cache.get<TimeSlot[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const mockVenue = MOCK_VENUES.find(v => v.id === venueId);
  if (!mockVenue) {
    return [];
  }

  const slots = generateVenueAvailability(mockVenue, date);

  // Cache for 5 minutes
  cache.set(cacheKey, slots, 5 * 60 * 1000);

  return slots;
}

/**
 * Find available games across multiple venues
 */
export async function findAvailableGames(
  coordinates: Coordinates,
  date: string,
  preferredTimeStart?: string,
  preferredTimeEnd?: string,
  maxDistanceKm: number = 10,
  locationName?: string
): Promise<TimeSlot[]> {
  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 20, locationName);
  const allSlots: TimeSlot[] = [];

  for (const venue of venues) {
    const slots = await checkVenueAvailability(venue.id, date, venue.name);

    for (const slot of slots) {
      // Filter by time range if specified
      if (preferredTimeStart || preferredTimeEnd) {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
        if (preferredTimeStart && slotTime < preferredTimeStart) continue;
        if (preferredTimeEnd && slotTime > preferredTimeEnd) continue;
      }

      // Add distance info
      (slot as any).distance_km = venue.distance_km;
      allSlots.push(slot);
    }
  }

  return allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get detailed venue information
 */
export async function getVenueDetails(venueId: string): Promise<VenueDetails | null> {
  const cacheKey = `venue_details:${venueId}`;
  const cached = cache.get<VenueDetails>(cacheKey);
  if (cached) {
    return cached;
  }

  const mockVenue = MOCK_VENUES.find(v => v.id === venueId);
  if (!mockVenue) {
    return null;
  }

  const venue = mockToVenue(mockVenue);

  const details: VenueDetails = {
    ...venue,
    description: mockVenue.description,
    images: mockVenue.image_url ? [mockVenue.image_url] : [],
    courts: Array.from({ length: mockVenue.courts }, (_, i) => ({
      id: `${mockVenue.id}-court-${i + 1}`,
      name: `Court ${i + 1}`,
      type: i < mockVenue.indoor_courts ? 'indoor' : 'outdoor',
      surface: 'artificial_grass',
    })),
    amenities: mockVenue.amenities,
  };

  // Cache for 24 hours
  cache.set(cacheKey, details, 24 * 60 * 60 * 1000);

  return details;
}

/**
 * Check availability with court properties
 */
export async function checkVenueAvailabilityWithProperties(
  venueId: string,
  date: string,
  venueName?: string
): Promise<EnhancedTimeSlotWithProperties[]> {
  const slots = await checkVenueAvailability(venueId, date, venueName);
  const mockVenue = MOCK_VENUES.find(v => v.id === venueId);

  return slots.map((slot, index) => {
    const courtNum = parseInt(slot.court_name.replace('Court ', ''));
    const isIndoor = mockVenue ? courtNum <= mockVenue.indoor_courts : false;

    return {
      ...slot,
      court_type: isIndoor ? ('indoor' as const) : ('outdoor' as const),
      surface: 'artificial_grass',
      has_lighting: true,
    };
  });
}

/**
 * Find available games with filtering
 */
export async function findAvailableGamesFiltered(
  coordinates: Coordinates,
  date: string,
  options: {
    preferredTimeStart?: string;
    preferredTimeEnd?: string;
    maxDistanceKm?: number;
    durationMinutes?: number;
    maxPrice?: number;
    sortBy?: 'time' | 'price' | 'distance';
  } = {}
): Promise<(TimeSlot & { distance_km?: number })[]> {
  const {
    preferredTimeStart,
    preferredTimeEnd,
    maxDistanceKm = 10,
    durationMinutes,
    maxPrice,
    sortBy = 'time',
  } = options;

  const slots = await findAvailableGames(
    coordinates,
    date,
    preferredTimeStart,
    preferredTimeEnd,
    maxDistanceKm
  );

  const filtered = slots.filter((slot) => {
    if (durationMinutes && slot.duration_minutes !== durationMinutes) return false;
    if (maxPrice && slot.price > maxPrice) return false;
    return true;
  });

  switch (sortBy) {
    case 'price':
      return filtered.sort((a, b) => a.price - b.price);
    case 'distance':
      return filtered.sort((a, b) => ((a as any).distance_km ?? 0) - ((b as any).distance_km ?? 0));
    case 'time':
    default:
      return filtered.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
}

/**
 * Find available games with advanced filtering
 */
export async function findAvailableGamesWithFilters(
  coordinates: Coordinates,
  date: string,
  options: {
    preferredTimeStart?: string;
    preferredTimeEnd?: string;
    maxDistanceKm?: number;
    filters?: SearchFilters;
    sortBy?: 'time' | 'price' | 'distance';
  } = {}
): Promise<(EnhancedTimeSlotWithProperties & { distance_km?: number })[]> {
  const {
    preferredTimeStart,
    preferredTimeEnd,
    maxDistanceKm = 10,
    filters = {},
    sortBy = 'time',
  } = options;

  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 20);
  const allSlots: (EnhancedTimeSlotWithProperties & { distance_km?: number })[] = [];

  for (const venue of venues) {
    const venueData = MOCK_VENUES.find(v => v.id === venue.id);
    if (!venueData) continue;

    const slots = await checkVenueAvailabilityWithProperties(venue.id, date, venue.name);

    for (const slot of slots) {
      // Apply time filters
      if (preferredTimeStart || preferredTimeEnd) {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
        if (preferredTimeStart && slotTime < preferredTimeStart) continue;
        if (preferredTimeEnd && slotTime > preferredTimeEnd) continue;
      }

      // Apply property filters
      if (filters.court_type && filters.court_type !== 'any') {
        if (slot.court_type !== filters.court_type) continue;
      }

      if (filters.surface && filters.surface !== 'any') {
        if (slot.surface !== filters.surface) continue;
      }

      if (filters.min_duration_minutes && slot.duration_minutes < filters.min_duration_minutes) continue;
      if (filters.max_price && slot.price > filters.max_price) continue;
      if (filters.has_lighting && !slot.has_lighting) continue;

      (slot as any).distance_km = venue.distance_km;
      allSlots.push(slot);
    }
  }

  switch (sortBy) {
    case 'price':
      return allSlots.sort((a, b) => a.price - b.price);
    case 'distance':
      return allSlots.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    case 'time':
    default:
      return allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
}
