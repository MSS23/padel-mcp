/**
 * Slot Card Component
 *
 * Generates interactive HTML cards for padel court time slots.
 * Each card shows venue, time, price, weather, and action buttons.
 */

import type { EnhancedTimeSlot } from '../../types/index.js';
import { wrapWithStyles } from '../styles.js';

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

  const cardHtml = `
    <div class="slot-card" data-venue-id="${escapeHtml(slot.venue_id)}" data-slot-time="${escapeHtml(slot.start_time)}">
      ${showVenueName ? `
        <div class="slot-header">
          <h3>${venueName}</h3>
          <span class="price">${slot.currency}${slot.price.toFixed(2)}</span>
        </div>
      ` : `
        <div class="slot-header">
          <h3>${startTime} - ${endTime}</h3>
          <span class="price">${slot.currency}${slot.price.toFixed(2)}</span>
        </div>
      `}

      <div class="slot-details">
        ${showVenueName ? `<p class="time">🕐 ${startTime} - ${endTime} (${slot.duration_minutes}min)</p>` : ''}
        <p class="court">🎾 ${courtName}</p>
        ${venueAddress && showVenueName ? `<p class="address">📍 ${venueAddress}</p>` : ''}
        ${slot.venue_phone ? `<p class="phone">📞 ${escapeHtml(slot.venue_phone)}</p>` : ''}
      </div>

      ${weatherHtml}

      <div class="slot-actions">
        ${bookingUrl ? `
          <button class="btn btn-primary" onclick="bookSlot('${bookingUrl}')">
            🎾 Book Now
          </button>
        ` : ''}
        ${calendarLink ? `
          <button class="btn btn-secondary" onclick="addToCalendar('${calendarLink}')">
            📅 Calendar
          </button>
        ` : ''}
        <button class="btn btn-icon" onclick="saveVenue('${escapeHtml(slot.venue_id)}', '${venueName}')" title="Save to favorites">
          ⭐
        </button>
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
}): string {
  const { groupByVenue = true, maxSlotsPerVenue = 5, title } = options ?? {};

  if (slots.length === 0) {
    return wrapWithStyles(`
      <div class="text-center text-muted" style="padding: 40px;">
        <p style="font-size: 18px;">😔 No available slots found</p>
        <p class="mt-2">Try adjusting your search criteria</p>
      </div>
    `);
  }

  let content = '';

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
        ? ` (${(firstSlot as any).distance_km}km away)`
        : '';

      content += `
        <div class="venue-group" style="margin-bottom: 24px;">
          <div class="venue-header" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">
            <h3 style="margin: 0; font-size: 18px;">${escapeHtml(venueName)}${distanceInfo}</h3>
            ${firstSlot.venue_address ? `<p class="text-muted" style="margin: 4px 0 0 0; font-size: 13px;">📍 ${escapeHtml(firstSlot.venue_address)}</p>` : ''}
            ${firstSlot.venue_phone ? `<p class="text-muted" style="margin: 2px 0 0 0; font-size: 13px;">📞 ${escapeHtml(firstSlot.venue_phone)}</p>` : ''}
          </div>
      `;

      const slotsToShow = venueSlots.slice(0, maxSlotsPerVenue);
      for (const slot of slotsToShow) {
        content += generateSlotCardHTML(slot, { showVenueName: false });
      }

      if (venueSlots.length > maxSlotsPerVenue) {
        content += `
          <p class="text-muted text-center" style="margin-top: 8px;">
            ... and ${venueSlots.length - maxSlotsPerVenue} more slots at this venue
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
