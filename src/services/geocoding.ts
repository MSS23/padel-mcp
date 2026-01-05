/**
 * Geocoding Service
 *
 * Uses OpenStreetMap Nominatim API to convert addresses to coordinates.
 * Free to use with proper attribution and rate limiting.
 */

import type { Coordinates, GeocodingResult } from '../types/index.js';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'PadelFinderMCP/1.0 (padel court finder)';
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout

// Simple in-memory cache to minimize API calls
const geocodeCache = new Map<string, Coordinates>();

// Default coordinates for major cities (fallback when API times out)
const DEFAULT_CITY_COORDS: Record<string, Coordinates> = {
  'london': { latitude: 51.5074, longitude: -0.1278 },
  'madrid': { latitude: 40.4168, longitude: -3.7038 },
  'barcelona': { latitude: 41.3851, longitude: 2.1734 },
  'paris': { latitude: 48.8566, longitude: 2.3522 },
  'new york': { latitude: 40.7128, longitude: -74.0060 },
  'dubai': { latitude: 25.2048, longitude: 55.2708 },
};

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get fallback coordinates for a city name
 */
function getFallbackCoords(address: string): Coordinates | null {
  const lowerAddr = address.toLowerCase();
  for (const [city, coords] of Object.entries(DEFAULT_CITY_COORDS)) {
    if (lowerAddr.includes(city)) {
      console.log(`Using fallback coordinates for ${city}`);
      return coords;
    }
  }
  // Default to London if no match
  console.log('Using default London coordinates as fallback');
  return DEFAULT_CITY_COORDS['london'];
}

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
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Geocoding API error: ${response.status}, using fallback`);
      return getFallbackCoords(address);
    }

    const results = (await response.json()) as GeocodingResult[];

    if (results.length === 0) {
      return getFallbackCoords(address);
    }

    const coords: Coordinates = {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };

    // Cache the result
    geocodeCache.set(cacheKey, coords);

    return coords;
  } catch (error) {
    // On timeout or network error, use fallback coordinates
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Geocoding failed (${errorMsg}), using fallback coordinates`);
    return getFallbackCoords(address);
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
    const response = await fetchWithTimeout(url, {
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
