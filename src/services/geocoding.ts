/**
 * Geocoding Service
 *
 * Real geocoding using Nominatim OSM (free) with caching.
 * Supports address to coordinates and reverse geocoding.
 */

import type { Coordinates, GeocodingResult } from '../types/index.js';
import { cache } from './cache.js';

const GEOCODING_PROVIDER = process.env.GEOCODING_PROVIDER || 'nominatim';
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY || '';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocode an address to coordinates using Nominatim OSM
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  // Check cache first (7 days TTL)
  const cacheKey = `geocoding:address:${address.toLowerCase().trim()}`;
  const cached = cache.get<Coordinates>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`);
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');
    
    // Add User-Agent header (required by Nominatim)
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PadelFinderMCP/2.0 (https://github.com/your-repo)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const results = await response.json() as GeocodingResult[];

    if (results.length === 0) {
      console.warn(`No geocoding results for: "${address}"`);
      return null;
    }

    const result = results[0];
    const coords: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    // Cache for 7 days
    cache.set(cacheKey, coords, 7 * 24 * 60 * 60 * 1000);

    return coords;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    
    // Fallback to cached data if available
    const fallback = cache.get<Coordinates>(cacheKey);
    if (fallback) {
      return fallback;
    }

    // Fallback to hardcoded popular UK cities if geocoding fails
    return fallbackToHardcodedLocation(address);
  }
}

/**
 * Fallback to hardcoded locations for popular UK cities
 */
function fallbackToHardcodedLocation(address: string): Coordinates | null {
  const lower = address.toLowerCase();
  
  const locations: Record<string, Coordinates> = {
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'manchester': { latitude: 53.4808, longitude: -2.2426 },
    'birmingham': { latitude: 52.4862, longitude: -1.8904 },
    'leeds': { latitude: 53.8008, longitude: -1.5491 },
    'glasgow': { latitude: 55.8642, longitude: -4.2518 },
    'edinburgh': { latitude: 55.9533, longitude: -3.1883 },
    'liverpool': { latitude: 53.4084, longitude: -2.9916 },
    'bristol': { latitude: 51.4545, longitude: -2.5879 },
    'sheffield': { latitude: 53.3811, longitude: -1.4701 },
    'newcastle': { latitude: 54.9783, longitude: -1.6178 },
    'chiswick': { latitude: 51.4927, longitude: -0.2674 },
    'maidenhead': { latitude: 51.5217, longitude: -0.7177 },
    'brighton': { latitude: 50.8225, longitude: -0.1372 },
    'cambridge': { latitude: 52.2053, longitude: 0.1218 },
    'oxford': { latitude: 51.7520, longitude: -1.2577 },
    'nottingham': { latitude: 52.9548, longitude: -1.1581 },
    'cardiff': { latitude: 51.4816, longitude: -3.1791 },
  };

  for (const [city, coords] of Object.entries(locations)) {
    if (lower.includes(city)) {
      console.log(`Using hardcoded location for: ${city}`);
      return coords;
    }
  }

  return null;
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
 * Reverse geocode coordinates to human-readable address
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  // Check cache first (7 days TTL)
  const cacheKey = `geocoding:reverse:${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
    url.searchParams.set('lat', coords.latitude.toString());
    url.searchParams.set('lon', coords.longitude.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PadelFinderMCP/2.0 (https://github.com/your-repo)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const result = await response.json() as GeocodingResult;
    const displayName = result.display_name || null;

    if (displayName) {
      // Cache for 7 days
      cache.set(cacheKey, displayName, 7 * 24 * 60 * 60 * 1000);
    }

    return displayName;
  } catch (error) {
    console.error(`Reverse geocoding error:`, error);
    
    // Fallback to cached data if available
    const fallback = cache.get<string>(cacheKey);
    if (fallback) {
      return fallback;
    }

    return null;
  }
}
