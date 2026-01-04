/**
 * Preferences Service
 *
 * Stores user preferences and favorite venues.
 * Persists to a JSON file for simplicity.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface FavoriteVenue {
  venue_id: string;
  venue_name: string;
  nickname?: string;
  added_at: string;
}

export interface UserPreferences {
  default_location?: string;
  default_radius_km?: number;
  preferred_duration_minutes?: number;
  preferred_time_start?: string;
  preferred_time_end?: string;
  max_price?: number;
  favorites: FavoriteVenue[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
};

class PreferencesService {
  private prefsPath: string;
  private preferences: UserPreferences | null = null;

  constructor() {
    // Store preferences in user's home directory
    this.prefsPath = join(homedir(), '.padel-finder', 'preferences.json');
  }

  /**
   * Load preferences from disk
   */
  async load(): Promise<UserPreferences> {
    if (this.preferences) {
      return this.preferences;
    }

    try {
      const data = await readFile(this.prefsPath, 'utf-8');
      this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
    } catch {
      // File doesn't exist or is invalid, use defaults
      this.preferences = { ...DEFAULT_PREFERENCES };
    }

    return this.preferences!;
  }

  /**
   * Save preferences to disk
   */
  async save(): Promise<void> {
    if (!this.preferences) {
      return;
    }

    try {
      // Ensure directory exists
      await mkdir(dirname(this.prefsPath), { recursive: true });
      await writeFile(this.prefsPath, JSON.stringify(this.preferences, null, 2));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Get all preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    return this.load();
  }

  /**
   * Set a specific preference
   */
  async setPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    const prefs = await this.load();
    prefs[key] = value;
    await this.save();
  }

  /**
   * Get favorite venues
   */
  async getFavorites(): Promise<FavoriteVenue[]> {
    const prefs = await this.load();
    return prefs.favorites;
  }

  /**
   * Add a venue to favorites
   */
  async addFavorite(venue: Omit<FavoriteVenue, 'added_at'>): Promise<FavoriteVenue> {
    const prefs = await this.load();

    // Check if already exists
    const existing = prefs.favorites.find((f) => f.venue_id === venue.venue_id);
    if (existing) {
      // Update nickname if provided
      if (venue.nickname) {
        existing.nickname = venue.nickname;
        await this.save();
      }
      return existing;
    }

    const favorite: FavoriteVenue = {
      ...venue,
      added_at: new Date().toISOString(),
    };

    prefs.favorites.push(favorite);
    await this.save();
    return favorite;
  }

  /**
   * Remove a venue from favorites
   */
  async removeFavorite(venueId: string): Promise<boolean> {
    const prefs = await this.load();
    const initialLength = prefs.favorites.length;
    prefs.favorites = prefs.favorites.filter((f) => f.venue_id !== venueId);

    if (prefs.favorites.length < initialLength) {
      await this.save();
      return true;
    }
    return false;
  }

  /**
   * Check if a venue is a favorite
   */
  async isFavorite(venueId: string): Promise<boolean> {
    const prefs = await this.load();
    return prefs.favorites.some((f) => f.venue_id === venueId);
  }

  /**
   * Get default location if set
   */
  async getDefaultLocation(): Promise<string | undefined> {
    const prefs = await this.load();
    return prefs.default_location;
  }

  /**
   * Set default location
   */
  async setDefaultLocation(location: string): Promise<void> {
    await this.setPreference('default_location', location);
  }
}

// Export singleton instance
export const preferences = new PreferencesService();
