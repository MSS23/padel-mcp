/**
 * Core types for Padel Finder MCP Server
 */

// Coordinates for location-based queries
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Venue/Tenant from Playtomic
export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: Coordinates;
  distance_km?: number;
  platform: 'playtomic' | 'matchi';
  playtomic_status?: string;
  image_url?: string;
}

// Available time slot
export interface TimeSlot {
  venue_id: string;
  venue_name: string;
  court_name: string;
  court_id: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  duration_minutes: number;
  price: number;
  currency: string;
  available: boolean;
}

// Availability result for a venue
export interface VenueAvailability {
  venue: Venue;
  slots: TimeSlot[];
  date: string;
}

// Price comparison entry
export interface PriceComparison {
  venue_name: string;
  venue_id: string;
  time: string;
  duration_minutes: number;
  price: number;
  currency: string;
  price_per_hour: number;
}

// Notification alert configuration
export interface AvailabilityAlert {
  id: string;
  venue_id: string;
  venue_name: string;
  date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  created_at: string;
  active: boolean;
}

// Playtomic API response types
export interface PlaytomicTenant {
  tenant_id: string;
  tenant_name: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    country_code: string;
    coordinate: {
      lat: number;
      lon: number;
    };
  };
  playtomic_status: string;
  images?: Array<{ url: string }>;
}

export interface PlaytomicResource {
  resource_id: string;
  name: string;
  properties?: {
    court_type?: string;
    surface?: string;
  };
}

export interface PlaytomicSlot {
  resource_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  currency: string;
}

export interface PlaytomicAvailabilityResponse {
  resources: PlaytomicResource[];
  slots: PlaytomicSlot[];
}

// Geocoding response
export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

// Extended venue details
export interface VenueDetails extends Venue {
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  images: string[];
  amenities?: string[];
  opening_hours?: {
    [day: string]: { open: string; close: string } | 'closed';
  };
  courts?: {
    id: string;
    name: string;
    type?: string;
    surface?: string;
    indoor?: boolean;
  }[];
}

// Weekly availability view
export interface DayAvailability {
  date: string;
  day_name: string;
  total_slots: number;
  earliest_slot?: string;
  latest_slot?: string;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Peak hours analysis
export interface HourlyStats {
  hour: string; // "09:00", "10:00", etc.
  avg_available_courts: number;
  avg_price: number;
  popularity: 'low' | 'medium' | 'high';
}

// Extended Playtomic tenant details
export interface PlaytomicTenantDetails extends PlaytomicTenant {
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  opening_hours?: Record<string, { opening: string; closing: string }>;
  facilities?: string[];
  resources?: PlaytomicResource[];
}
