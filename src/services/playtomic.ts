/**
 * Playtomic API Service
 *
 * Interacts with Playtomic's public API to:
 * - Find nearby padel venues
 * - Check court availability
 */

import type {
  Coordinates,
  Venue,
  VenueDetails,
  TimeSlot,
  PlaytomicTenant,
  PlaytomicTenantDetails,
  PlaytomicAvailabilityResponse,
} from '../types/index.js';
import { cache } from './cache.js';

const PLAYTOMIC_BASE_URL = 'https://api.playtomic.io/v1';
const USER_AGENT = 'PadelFinderMCP/1.0';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
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
 * Find nearby padel venues using Playtomic API
 */
export async function findNearbyVenues(
  coordinates: Coordinates,
  radiusKm: number = 10,
  maxResults: number = 20
): Promise<Venue[]> {
  const radiusMeters = radiusKm * 1000;

  const params = new URLSearchParams({
    sport_id: 'PADEL',
    coordinate: `${coordinates.latitude},${coordinates.longitude}`,
    radius: radiusMeters.toString(),
    playtomic_status: 'ACTIVE',
    size: maxResults.toString(),
  });

  const url = `${PLAYTOMIC_BASE_URL}/tenants?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Playtomic API error: ${response.status} ${response.statusText}`);
    }

    const tenants = (await response.json()) as PlaytomicTenant[];

    return tenants.map((tenant) => {
      const venueCoords: Coordinates = {
        latitude: tenant.address.coordinate.lat,
        longitude: tenant.address.coordinate.lon,
      };

      return {
        id: tenant.tenant_id,
        name: tenant.tenant_name,
        address: tenant.address.street,
        city: tenant.address.city,
        coordinates: venueCoords,
        distance_km: Math.round(calculateDistance(coordinates, venueCoords) * 10) / 10,
        platform: 'playtomic' as const,
        playtomic_status: tenant.playtomic_status,
        image_url: tenant.images?.[0]?.url,
      };
    }).sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check availability for a specific venue
 */
export async function checkVenueAvailability(
  venueId: string,
  date: string, // YYYY-MM-DD format
  venueName?: string
): Promise<TimeSlot[]> {
  // Playtomic requires datetime range
  const startMin = `${date}T00:00:00`;
  const startMax = `${date}T23:59:59`;

  const params = new URLSearchParams({
    sport_id: 'PADEL',
    tenant_id: venueId,
    start_min: startMin,
    start_max: startMax,
  });

  const url = `${PLAYTOMIC_BASE_URL}/availability?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Playtomic API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PlaytomicAvailabilityResponse;

    // Create a map of resource IDs to names
    const resourceMap = new Map<string, string>();
    for (const resource of data.resources || []) {
      resourceMap.set(resource.resource_id, resource.name);
    }

    // Convert slots to our format
    return (data.slots || []).map((slot) => ({
      venue_id: venueId,
      venue_name: venueName ?? venueId,
      court_name: resourceMap.get(slot.resource_id) ?? 'Court',
      court_id: slot.resource_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration,
      price: slot.price,
      currency: slot.currency || 'EUR',
      available: true,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Find available games across multiple venues
 */
export async function findAvailableGames(
  coordinates: Coordinates,
  date: string,
  preferredTimeStart?: string, // HH:mm format
  preferredTimeEnd?: string, // HH:mm format
  maxDistanceKm: number = 10
): Promise<TimeSlot[]> {
  // First, find nearby venues
  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 10);

  if (venues.length === 0) {
    return [];
  }

  // Check availability at each venue (with some delay to respect rate limits)
  const allSlots: TimeSlot[] = [];

  for (const venue of venues) {
    try {
      const slots = await checkVenueAvailability(venue.id, date, venue.name);

      // Filter by preferred time if specified
      const filteredSlots = slots.filter((slot) => {
        if (!preferredTimeStart && !preferredTimeEnd) {
          return true;
        }

        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';

        if (preferredTimeStart && slotTime < preferredTimeStart) {
          return false;
        }
        if (preferredTimeEnd && slotTime > preferredTimeEnd) {
          return false;
        }
        return true;
      });

      // Add distance info to slots
      const slotsWithDistance = filteredSlots.map((slot) => ({
        ...slot,
        distance_km: venue.distance_km,
      }));

      allSlots.push(...slotsWithDistance);

      // Small delay between requests to be respectful
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      // Log error but continue with other venues
      console.error(`Error checking venue ${venue.name}: ${error}`);
    }
  }

  // Sort by start time
  return allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get detailed information about a specific venue
 */
export async function getVenueDetails(venueId: string): Promise<VenueDetails | null> {
  const cacheKey = `venue:${venueId}`;

  return cache.getOrSet(
    cacheKey,
    async () => {
      const url = `${PLAYTOMIC_BASE_URL}/tenants/${venueId}`;

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Playtomic API error: ${response.status} ${response.statusText}`);
        }

        const tenant = (await response.json()) as PlaytomicTenantDetails;

        const details: VenueDetails = {
          id: tenant.tenant_id,
          name: tenant.tenant_name,
          address: tenant.address.street,
          city: tenant.address.city,
          coordinates: {
            latitude: tenant.address.coordinate.lat,
            longitude: tenant.address.coordinate.lon,
          },
          platform: 'playtomic',
          playtomic_status: tenant.playtomic_status,
          description: tenant.description,
          phone: tenant.phone,
          email: tenant.email,
          website: tenant.website,
          images: tenant.images?.map((img) => img.url) ?? [],
          amenities: tenant.facilities,
          courts: tenant.resources?.map((r) => ({
            id: r.resource_id,
            name: r.name,
            type: r.properties?.court_type,
            surface: r.properties?.surface,
          })),
        };

        return details;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to get venue details: ${error.message}`);
        }
        throw error;
      }
    },
    30 * 60 * 1000 // Cache for 30 minutes
  );
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

  // First, find nearby venues
  const venues = await findNearbyVenues(coordinates, maxDistanceKm, 10);

  if (venues.length === 0) {
    return [];
  }

  const allSlots: (TimeSlot & { distance_km?: number })[] = [];

  for (const venue of venues) {
    try {
      const slots = await checkVenueAvailability(venue.id, date, venue.name);

      const filteredSlots = slots.filter((slot) => {
        // Time filter
        if (preferredTimeStart || preferredTimeEnd) {
          const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
          if (preferredTimeStart && slotTime < preferredTimeStart) return false;
          if (preferredTimeEnd && slotTime > preferredTimeEnd) return false;
        }

        // Duration filter
        if (durationMinutes && slot.duration_minutes !== durationMinutes) {
          return false;
        }

        // Price filter
        if (maxPrice && slot.price > maxPrice) {
          return false;
        }

        return true;
      });

      const slotsWithDistance = filteredSlots.map((slot) => ({
        ...slot,
        distance_km: venue.distance_km,
      }));

      allSlots.push(...slotsWithDistance);

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error checking venue ${venue.name}: ${error}`);
    }
  }

  // Sort based on preference
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
