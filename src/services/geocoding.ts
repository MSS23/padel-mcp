/**
 * Geocoding Service
 *
 * Hardcoded coordinates for Chiswick and Maidenhead only.
 * No external API calls.
 */

import type { Coordinates } from '../types/index.js';

// Hardcoded locations - only Chiswick and Maidenhead supported
const LOCATIONS: Record<string, Coordinates> = {
  'chiswick': { latitude: 51.4927, longitude: -0.2674 },
  'maidenhead': { latitude: 51.5217, longitude: -0.7177 },
};

/**
 * Convert an address to coordinates (hardcoded lookup)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const lower = address.toLowerCase();

  if (lower.includes('chiswick')) {
    return LOCATIONS['chiswick'];
  }
  if (lower.includes('maidenhead')) {
    return LOCATIONS['maidenhead'];
  }

  // Default to Chiswick if no match
  console.log(`Unknown location "${address}", defaulting to Chiswick`);
  return LOCATIONS['chiswick'];
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
 * Get a human-readable location name from coordinates
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  // Check if near Chiswick
  if (Math.abs(coords.latitude - LOCATIONS['chiswick'].latitude) < 0.1 &&
      Math.abs(coords.longitude - LOCATIONS['chiswick'].longitude) < 0.1) {
    return 'Chiswick, London';
  }

  // Check if near Maidenhead
  if (Math.abs(coords.latitude - LOCATIONS['maidenhead'].latitude) < 0.1 &&
      Math.abs(coords.longitude - LOCATIONS['maidenhead'].longitude) < 0.1) {
    return 'Maidenhead, Berkshire';
  }

  return null;
}
