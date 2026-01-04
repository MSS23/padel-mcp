/**
 * Geocoding Service
 *
 * Uses OpenStreetMap Nominatim API to convert addresses to coordinates.
 * Free to use with proper attribution and rate limiting.
 */

import type { Coordinates, GeocodingResult } from '../types/index.js';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'PadelFinderMCP/1.0 (padel court finder)';

// Simple in-memory cache to minimize API calls
const geocodeCache = new Map<string, Coordinates>();

/**
 * Convert an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
  });

  const url = `${NOMINATIM_BASE_URL}/search?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const results = (await response.json()) as GeocodingResult[];

    if (results.length === 0) {
      return null;
    }

    const coords: Coordinates = {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };

    // Cache the result
    geocodeCache.set(cacheKey, coords);

    return coords;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse location input - could be coordinates or an address
 */
export async function parseLocation(location: string): Promise<Coordinates | null> {
  // Check if it looks like coordinates (lat,lon or lat, lon)
  const coordsMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);

  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lon = parseFloat(coordsMatch[2]);

    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }

  // Otherwise, treat it as an address
  return geocodeAddress(location);
}

/**
 * Get a human-readable location name from coordinates (reverse geocoding)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  const params = new URLSearchParams({
    lat: coords.latitude.toString(),
    lon: coords.longitude.toString(),
    format: 'json',
  });

  const url = `${NOMINATIM_BASE_URL}/reverse?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as GeocodingResult;
    return result.display_name || null;
  } catch {
    return null;
  }
}
