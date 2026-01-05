/**
 * Padel Venue Service
 *
 * Hardcoded venues for Chiswick and Maidenhead only.
 * No external API calls.
 */

import type {
  Coordinates,
  Venue,
  VenueDetails,
  TimeSlot,
  SearchFilters,
  EnhancedTimeSlotWithProperties,
} from '../types/index.js';

// Chiswick coordinates
const CHISWICK_COORDS: Coordinates = { latitude: 51.4927, longitude: -0.2674 };
// Maidenhead coordinates
const MAIDENHEAD_COORDS: Coordinates = { latitude: 51.5217, longitude: -0.7177 };

// Hardcoded venues for Chiswick
const CHISWICK_VENUES: Venue[] = [
  {
    id: 'chiswick-1',
    name: 'Will To Win Chiswick',
    address: 'Dukes Meadows, Dan Mason Drive, Chiswick',
    city: 'London',
    coordinates: { latitude: 51.4785, longitude: -0.2534 },
    distance_km: 1.8,
    platform: 'playtomic',
    playtomic_status: 'ACTIVE',
  },
  {
    id: 'chiswick-2',
    name: 'Chiswick Padel Club',
    address: 'Riverside Drive, Chiswick',
    city: 'London',
    coordinates: { latitude: 51.4850, longitude: -0.2600 },
    distance_km: 1.2,
    platform: 'playtomic',
    playtomic_status: 'ACTIVE',
  },
];

// Hardcoded venues for Maidenhead
const MAIDENHEAD_VENUES: Venue[] = [
  {
    id: 'maidenhead-1',
    name: 'Maidenhead Padel Club',
    address: 'Braywick Sports Ground, Braywick Road, Maidenhead',
    city: 'Maidenhead',
    coordinates: { latitude: 51.5180, longitude: -0.7250 },
    distance_km: 0.8,
    platform: 'playtomic',
    playtomic_status: 'ACTIVE',
  },
  {
    id: 'maidenhead-2',
    name: 'Thames Valley Padel',
    address: 'Stafferton Way, Maidenhead',
    city: 'Maidenhead',
    coordinates: { latitude: 51.5150, longitude: -0.7100 },
    distance_km: 1.5,
    platform: 'playtomic',
    playtomic_status: 'ACTIVE',
  },
];

// Store the last searched location
let lastSearchedLocation: string = 'Chiswick';

/**
 * Generate time slots for a venue on a given date
 */
function generateSlots(venueId: string, venueName: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const hours = [9, 10, 11, 14, 15, 17, 18, 19, 20, 21];
  const courts = ['Court 1 Indoor', 'Court 2 Indoor', 'Court 3 Outdoor'];

  for (const hour of hours) {
    const courtIndex = hour % courts.length;
    // Peak hours (18-21) are more expensive
    const price = hour >= 18 ? 36 : 28;

    slots.push({
      venue_id: venueId,
      venue_name: venueName,
      court_name: courts[courtIndex],
      court_id: `${venueId}-court-${courtIndex + 1}`,
      start_time: `${date}T${hour.toString().padStart(2, '0')}:00:00`,
      end_time: `${date}T${(hour + 1).toString().padStart(2, '0')}:30:00`,
      duration_minutes: 90,
      price: price,
      currency: '£',
      available: true,
    });
  }
  return slots;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
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
 * Determine which location is closer to the given coordinates
 */
function getClosestLocation(coordinates: Coordinates): 'chiswick' | 'maidenhead' {
  const distToChiswick = calculateDistance(coordinates, CHISWICK_COORDS);
  const distToMaidenhead = calculateDistance(coordinates, MAIDENHEAD_COORDS);
  return distToChiswick <= distToMaidenhead ? 'chiswick' : 'maidenhead';
}

/**
 * Find nearby padel venues (hardcoded for Chiswick/Maidenhead)
 */
export async function findNearbyVenues(
  coordinates: Coordinates,
  _radiusKm: number = 10,
  _maxResults: number = 20,
  locationName?: string
): Promise<Venue[]> {
  // Store location for later use
  if (locationName) {
    lastSearchedLocation = locationName;
  }

  // Check which location to return based on coordinates or location name
  const lower = (locationName || '').toLowerCase();

  if (lower.includes('maidenhead')) {
    return MAIDENHEAD_VENUES.map(v => ({
      ...v,
      distance_km: Math.round(calculateDistance(coordinates, v.coordinates) * 10) / 10,
    }));
  }

  if (lower.includes('chiswick')) {
    return CHISWICK_VENUES.map(v => ({
      ...v,
      distance_km: Math.round(calculateDistance(coordinates, v.coordinates) * 10) / 10,
    }));
  }

  // Default: return venues for closest location
  const closest = getClosestLocation(coordinates);
  const venues = closest === 'chiswick' ? CHISWICK_VENUES : MAIDENHEAD_VENUES;

  return venues.map(v => ({
    ...v,
    distance_km: Math.round(calculateDistance(coordinates, v.coordinates) * 10) / 10,
  }));
}

/**
 * Check availability for a specific venue
 */
export async function checkVenueAvailability(
  venueId: string,
  date: string,
  venueName?: string
): Promise<TimeSlot[]> {
  // Find venue name if not provided
  const allVenues = [...CHISWICK_VENUES, ...MAIDENHEAD_VENUES];
  const venue = allVenues.find(v => v.id === venueId);
  const name = venueName || venue?.name || 'Padel Venue';

  return generateSlots(venueId, name, date);
}

/**
 * Find available games across venues
 */
export async function findAvailableGames(
  coordinates: Coordinates,
  date: string,
  preferredTimeStart?: string,
  preferredTimeEnd?: string,
  maxDistanceKm: number = 10,
  locationName?: string
): Promise<TimeSlot[]> {
  if (locationName) {
    lastSearchedLocation = locationName;
  }

  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 10, locationName);
  const allSlots: TimeSlot[] = [];

  for (const venue of venues) {
    const slots = await checkVenueAvailability(venue.id, date, venue.name);

    const filteredSlots = slots.filter((slot) => {
      if (!preferredTimeStart && !preferredTimeEnd) return true;

      const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';

      if (preferredTimeStart && slotTime < preferredTimeStart) return false;
      if (preferredTimeEnd && slotTime > preferredTimeEnd) return false;
      return true;
    });

    const slotsWithDistance = filteredSlots.map((slot) => ({
      ...slot,
      distance_km: venue.distance_km,
    }));

    allSlots.push(...slotsWithDistance);
  }

  return allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get detailed information about a specific venue
 */
export async function getVenueDetails(venueId: string): Promise<VenueDetails | null> {
  const allVenues = [...CHISWICK_VENUES, ...MAIDENHEAD_VENUES];
  const venue = allVenues.find(v => v.id === venueId);

  if (!venue) return null;

  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    coordinates: venue.coordinates,
    platform: 'playtomic',
    playtomic_status: 'ACTIVE',
    description: `Welcome to ${venue.name}! A modern padel facility with excellent courts and amenities.`,
    images: [],
    courts: [
      { id: `${venue.id}-court-1`, name: 'Court 1 Indoor', type: 'indoor' },
      { id: `${venue.id}-court-2`, name: 'Court 2 Indoor', type: 'indoor' },
      { id: `${venue.id}-court-3`, name: 'Court 3 Outdoor', type: 'outdoor' },
    ],
  };
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

  return slots.map(slot => ({
    ...slot,
    court_type: slot.court_name.toLowerCase().includes('indoor') ? 'indoor' as const : 'outdoor' as const,
    surface: 'artificial_grass',
    has_lighting: true,
  }));
}

/**
 * Find available games with extended filtering options
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

  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 10);
  const allSlots: (TimeSlot & { distance_km?: number })[] = [];

  for (const venue of venues) {
    const slots = await checkVenueAvailability(venue.id, date, venue.name);

    const filteredSlots = slots.filter((slot) => {
      if (preferredTimeStart || preferredTimeEnd) {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
        if (preferredTimeStart && slotTime < preferredTimeStart) return false;
        if (preferredTimeEnd && slotTime > preferredTimeEnd) return false;
      }

      if (durationMinutes && slot.duration_minutes !== durationMinutes) return false;
      if (maxPrice && slot.price > maxPrice) return false;

      return true;
    });

    const slotsWithDistance = filteredSlots.map((slot) => ({
      ...slot,
      distance_km: venue.distance_km,
    }));

    allSlots.push(...slotsWithDistance);
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

/**
 * Find available games with advanced filtering including court properties
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

  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 10);
  const allSlots: (EnhancedTimeSlotWithProperties & { distance_km?: number })[] = [];

  for (const venue of venues) {
    const slots = await checkVenueAvailabilityWithProperties(venue.id, date, venue.name);

    const filteredSlots = slots.filter((slot) => {
      if (preferredTimeStart || preferredTimeEnd) {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
        if (preferredTimeStart && slotTime < preferredTimeStart) return false;
        if (preferredTimeEnd && slotTime > preferredTimeEnd) return false;
      }

      if (filters.court_type && filters.court_type !== 'any') {
        if (slot.court_type && slot.court_type !== filters.court_type) return false;
      }

      if (filters.surface && filters.surface !== 'any') {
        if (slot.surface && slot.surface !== filters.surface) return false;
      }

      if (filters.min_duration_minutes && slot.duration_minutes < filters.min_duration_minutes) return false;
      if (filters.max_price && slot.price > filters.max_price) return false;
      if (filters.has_lighting && !slot.has_lighting) return false;

      return true;
    });

    const slotsWithDistance = filteredSlots.map((slot) => ({
      ...slot,
      distance_km: venue.distance_km,
    }));

    allSlots.push(...slotsWithDistance);
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
