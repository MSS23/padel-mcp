/**
 * Search Form Component
 *
 * Generates interactive HTML search forms for finding padel courts.
 * Users can input location, date, time preferences, and distance.
 */

import { wrapWithStyles } from '../styles.js';

export interface SearchFormDefaults {
  location?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  maxDistance?: number;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML for the search form
 */
export function generateSearchFormHTML(defaults?: SearchFormDefaults): string {
  const {
    location = '',
    date = getTodayDate(),
    timeStart = '09:00',
    timeEnd = '22:00',
    maxDistance = 10,
  } = defaults ?? {};

  const formHtml = `
    <div class="search-form">
      <h2 style="margin-bottom: 16px; font-size: 18px;">🎾 Find Available Padel Courts</h2>

      <form onsubmit="submitSearch(event)">
        <div class="form-group">
          <label for="location">📍 Location</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="City, address, or coordinates..."
            value="${escapeHtml(location)}"
            required
          >
        </div>

        <div class="form-group">
          <label for="date">📅 Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value="${escapeHtml(date)}"
            min="${getTodayDate()}"
            required
          >
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="time_start">🕐 From</label>
            <input
              type="time"
              id="time_start"
              name="time_start"
              value="${escapeHtml(timeStart)}"
            >
          </div>
          <div class="form-group">
            <label for="time_end">🕐 To</label>
            <input
              type="time"
              id="time_end"
              name="time_end"
              value="${escapeHtml(timeEnd)}"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="max_distance">
            📏 Max Distance: <span id="distance-value">${maxDistance}</span> km
          </label>
          <input
            type="range"
            id="max_distance"
            name="max_distance"
            min="1"
            max="50"
            value="${maxDistance}"
            oninput="document.getElementById('distance-value').textContent = this.value"
          >
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
          🔍 Search Available Courts
        </button>
      </form>
    </div>
  `;

  return wrapWithStyles(formHtml);
}

/**
 * Generate a compact inline search prompt
 */
export function generateQuickSearchHTML(defaults?: SearchFormDefaults): string {
  const { location = '', date = getTodayDate() } = defaults ?? {};

  const formHtml = `
    <div class="search-form" style="padding: 12px;">
      <form onsubmit="submitSearch(event)" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 2; min-width: 150px; margin-bottom: 0;">
          <label for="location" style="font-size: 12px;">📍 Location</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="City or address..."
            value="${escapeHtml(location)}"
            required
            style="padding: 8px;"
          >
        </div>
        <div class="form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
          <label for="date" style="font-size: 12px;">📅 Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value="${escapeHtml(date)}"
            min="${getTodayDate()}"
            required
            style="padding: 8px;"
          >
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 8px 16px;">
          🔍 Search
        </button>
      </form>
    </div>
  `;

  return wrapWithStyles(formHtml);
}

/**
 * Generate venue-specific availability check form
 */
export function generateVenueSearchFormHTML(params: {
  venueId: string;
  venueName: string;
  defaultDate?: string;
}): string {
  const { venueId, venueName, defaultDate = getTodayDate() } = params;

  const formHtml = `
    <div class="search-form" style="padding: 16px;">
      <h3 style="margin-bottom: 12px; font-size: 16px;">
        🎾 Check Availability at ${escapeHtml(venueName)}
      </h3>

      <form onsubmit="checkVenueAvailability('${escapeHtml(venueId)}', '${escapeHtml(venueName)}', this.date.value); return false;">
        <div class="form-row" style="align-items: flex-end;">
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label for="date">📅 Select Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value="${escapeHtml(defaultDate)}"
              min="${getTodayDate()}"
              required
            >
          </div>
          <button type="submit" class="btn btn-primary">
            Check Availability
          </button>
        </div>
      </form>
    </div>
  `;

  return wrapWithStyles(formHtml);
}
