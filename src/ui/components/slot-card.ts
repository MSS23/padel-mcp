/**
 * Slot Card Component
 *
 * Generates interactive HTML cards for padel court time slots.
 * Each card shows venue, time, price, weather, and action buttons.
 * Now includes interactive search panel for modifying searches.
 */

import type { EnhancedTimeSlot } from '../../types/index.js';
import { wrapWithStyles } from '../styles.js';
import { generateInteractiveSearchHTML } from './interactive-search.js';

/**
 * Format time from ISO string to HH:mm
 */
function formatTime(isoTime: string): string {
  return isoTime.split('T')[1]?.substring(0, 5) ?? '';
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
 * Generate HTML for a single slot card
 */
export function generateSlotCardHTML(slot: EnhancedTimeSlot, options?: {
  showVenueName?: boolean;
  compact?: boolean;
}): string {
  const { showVenueName = true, compact = false } = options ?? {};

  const startTime = formatTime(slot.start_time);
  const endTime = formatTime(slot.end_time);
  const venueName = escapeHtml(slot.venue_name);
  const courtName = escapeHtml(slot.court_name);
  const venueAddress = slot.venue_address ? escapeHtml(slot.venue_address) : '';

  // Weather section
  let weatherHtml = '';
  if (slot.weather) {
    const playabilityClass = slot.weather.is_playable ? 'good' : 'warning';
    weatherHtml = `
      <div class="weather-info">
        <span>${slot.weather.condition_emoji} ${slot.weather.temperature_c}°C</span>
        <span>Feels ${slot.weather.feels_like_c}°C</span>
        <span>💨 ${slot.weather.wind_speed_kmh} km/h</span>
        <span>🌧️ ${slot.weather.precipitation_chance}%</span>
        ${slot.weather.playability_note ? `<p class="playability ${playabilityClass}">${escapeHtml(slot.weather.playability_note)}</p>` : ''}
      </div>
    `;
  }

  // Booking URL (escaped for JavaScript)
  const bookingUrl = slot.booking_url ? escapeHtml(slot.booking_url) : '';
  const calendarLink = slot.calendar_link ? escapeHtml(slot.calendar_link) : '';

  // Price formatting - remove trailing zeros
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  const cardHtml = `
    <div class="slot-card" data-venue-id="${escapeHtml(slot.venue_id)}" data-slot-time="${escapeHtml(slot.start_time)}">
      ${showVenueName ? `
        <div class="slot-header">
          <h3>${venueName}</h3>
          <span class="price">${slot.currency}${priceDisplay}</span>
        </div>
      ` : `
        <div class="slot-header">
          <h3>${startTime} - ${endTime}</h3>
          <span class="price">${slot.currency}${priceDisplay}</span>
        </div>
      `}

      <div class="slot-details">
        ${showVenueName ? `<p><span class="time">${startTime} - ${endTime}</span> · ${slot.duration_minutes}min</p>` : ''}
        <p>${courtName}</p>
        ${venueAddress && showVenueName ? `<p>${venueAddress}</p>` : ''}
      </div>

      ${weatherHtml}

      <div class="slot-actions">
        ${bookingUrl ? `
          <button class="btn btn-primary" onclick="bookSlot('${bookingUrl}')">
            Book Now
          </button>
        ` : ''}
        ${calendarLink ? `
          <button class="btn btn-secondary" onclick="addToCalendar('${calendarLink}')">
            Add to Calendar
          </button>
        ` : ''}
      </div>
    </div>
  `;

  return cardHtml;
}

/**
 * Generate HTML for multiple slot cards grouped by venue
 */
export function generateSlotCardsHTML(slots: EnhancedTimeSlot[], options?: {
  groupByVenue?: boolean;
  maxSlotsPerVenue?: number;
  title?: string;
  searchParams?: {
    location?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
    maxDistanceKm?: number;
  };
}): string {
  const { groupByVenue = true, maxSlotsPerVenue = 5, title, searchParams } = options ?? {};

  if (slots.length === 0) {
    return wrapWithStyles(`
      <div class="empty-state">
        <p>No available slots found</p>
        <p class="text-muted">Try adjusting your search criteria</p>
      </div>
    `);
  }

  let content = '';

  // Add interactive search panel at the top (collapsed by default for results)
  if (searchParams) {
    const searchHtml = generateInteractiveSearchHTML({
      location: searchParams.location,
      date: searchParams.date,
      timeStart: searchParams.timeStart,
      timeEnd: searchParams.timeEnd,
      maxDistanceKm: searchParams.maxDistanceKm,
      collapsed: true, // Collapsed when showing results
    });
    // Extract content between <body> tags
    const bodyMatch = searchHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content += bodyMatch[1];
    }
  }

  if (title) {
    content += `<h2 style="margin-bottom: 16px;">${escapeHtml(title)}</h2>`;
  }

  if (groupByVenue) {
    // Group slots by venue
    const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
    for (const slot of slots) {
      const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
      venueSlots.push(slot);
      slotsByVenue.set(slot.venue_name, venueSlots);
    }

    for (const [venueName, venueSlots] of slotsByVenue) {
      const firstSlot = venueSlots[0];
      const distanceInfo = (firstSlot as any).distance_km
        ? ` · ${(firstSlot as any).distance_km}km`
        : '';

      content += `
        <div class="venue-group">
          <div class="venue-header">
            <h3>${escapeHtml(venueName)}</h3>
            ${firstSlot.venue_address || distanceInfo ? `<p>${firstSlot.venue_address ? escapeHtml(firstSlot.venue_address) : ''}${distanceInfo}</p>` : ''}
          </div>
      `;

      const slotsToShow = venueSlots.slice(0, maxSlotsPerVenue);
      for (const slot of slotsToShow) {
        content += generateSlotCardHTML(slot, { showVenueName: false });
      }

      if (venueSlots.length > maxSlotsPerVenue) {
        content += `
          <p class="text-muted text-center mt-2">
            +${venueSlots.length - maxSlotsPerVenue} more slots available
          </p>
        `;
      }

      content += '</div>';
    }
  } else {
    // Show all slots without grouping
    for (const slot of slots) {
      content += generateSlotCardHTML(slot, { showVenueName: true });
    }
  }

  return wrapWithStyles(content);
}

/**
 * Escape HTML for use in JavaScript strings
 */
function escapeForJS(text: string): string {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
