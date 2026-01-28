/**
 * Cache Service
 *
 * TTL-based in-memory cache with optimized TTLs for different data types.
 * Reduces API calls and respects rate limits.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  
  // Default TTLs (in milliseconds)
  private readonly TTL_AUTH_TOKEN = 55 * 60 * 1000; // Until expiry - 5 minutes
  private readonly TTL_VENUE_METADATA = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TTL_AVAILABILITY = 5 * 60 * 1000; // 5 minutes
  private readonly TTL_GEOCODING = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly TTL_GEOGRAPHIC_SEARCH = 60 * 60 * 1000; // 1 hour
  
  private defaultTTL = this.TTL_AVAILABILITY; // 5 minutes default

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a cached value with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set - returns cached value if exists, otherwise calls factory and caches result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Generate a cache key for venue availability
   */
  static venueAvailabilityKey(venueId: string, date: string): string {
    return `availability:${venueId}:${date}`;
  }

  /**
   * Generate a cache key for nearby venues search
   */
  static nearbyVenuesKey(lat: number, lon: number, radiusKm: number): string {
    // Round coordinates to reduce cache fragmentation
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `venues:${roundedLat},${roundedLon}:${radiusKm}`;
  }

  /**
   * Generate a cache key for venue details
   */
  static venueDetailsKey(venueId: string): string {
    return `venue:${venueId}`;
  }

  /**
   * Generate a cache key for geocoding
   */
  static geocodingKey(address: string): string {
    return `geocoding:address:${address.toLowerCase().trim()}`;
  }

  /**
   * Generate a cache key for reverse geocoding
   */
  static reverseGeocodingKey(coords: Coordinates): string {
    return `geocoding:reverse:${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  }
}

// Import Coordinates type for convenience
import type { Coordinates } from '../types/index.js';

// Export singleton instance
export const cache = new CacheService();
