/**
 * Calendar View Component
 *
 * Generates interactive HTML calendar widgets for viewing weekly availability.
 * Shows day-by-day slots with weather forecasts and price ranges.
 */

import type { EnhancedDayAvailability } from '../../types/index.js';
import { wrapWithStyles } from '../styles.js';

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
 * Format date for display (e.g., "Jan 5")
 */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Generate HTML for the weekly calendar view
 */
export function generateWeeklyCalendarHTML(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
  startDate: string;
}): string {
  const { venueName, venueId, days, startDate } = params;

  const daysHtml = days
    .map((day) => {
      const hasSlots = day.total_slots > 0;
      const dateFormatted = formatDisplayDate(day.date);

      const weatherHtml = day.weather
        ? `<div class="day-weather">${day.weather.emoji} ${day.weather.temp_high}°C</div>`
        : '';

      const slotsHtml = hasSlots
        ? `
          <div class="day-slots">
            <span class="slot-count">${day.total_slots} slot${day.total_slots > 1 ? 's' : ''}</span>
            ${
              day.price_range
                ? `<span class="price-range">${day.price_range.currency}${day.price_range.min}-${day.price_range.max}</span>`
                : ''
            }
          </div>
        `
        : '<span class="no-availability">No slots</span>';

      return `
        <div
          class="calendar-day ${hasSlots ? 'has-slots' : 'no-slots'}"
          onclick="${hasSlots ? `showDaySlots('${escapeHtml(day.date)}')` : ''}"
          ${!hasSlots ? 'style="cursor: default;"' : ''}
        >
          <div class="day-header">
            <span class="day-name">${escapeHtml(day.day_name)}</span>
            <span class="day-date">${dateFormatted}</span>
          </div>
          ${weatherHtml}
          ${slotsHtml}
        </div>
      `;
    })
    .join('');

  const calendarHtml = `
    <div class="weekly-calendar">
      <h2>📅 ${escapeHtml(venueName)} - Weekly Availability</h2>
      <p class="text-muted" style="margin-bottom: 16px;">
        Starting ${formatDisplayDate(startDate)} • Click a day to see available slots
      </p>
      <div class="calendar-grid">
        ${daysHtml}
      </div>
      <div style="margin-top: 16px; text-align: center;">
        <button
          class="btn btn-secondary"
          onclick="checkVenueAvailability('${escapeHtml(venueId)}', '${escapeHtml(venueName)}')"
        >
          🔄 Refresh Availability
        </button>
      </div>
    </div>
  `;

  return wrapWithStyles(calendarHtml);
}

/**
 * Generate a compact summary row for a single day
 */
export function generateDaySummaryHTML(day: EnhancedDayAvailability): string {
  const hasSlots = day.total_slots > 0;
  const dateFormatted = formatDisplayDate(day.date);

  const weatherInfo = day.weather
    ? `${day.weather.emoji} ${day.weather.temp_high}°C`
    : '';

  const priceInfo =
    hasSlots && day.price_range
      ? `${day.price_range.currency}${day.price_range.min}-${day.price_range.max}`
      : '';

  return `
    <div class="day-row ${hasSlots ? 'has-slots' : 'no-slots'}" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 4px 0;
      ${hasSlots ? 'cursor: pointer;' : 'opacity: 0.6;'}
    " ${hasSlots ? `onclick="showDaySlots('${escapeHtml(day.date)}')"` : ''}>
      <div style="display: flex; gap: 12px; align-items: center;">
        <span style="font-weight: 600; min-width: 80px;">${escapeHtml(day.day_name)}</span>
        <span class="text-muted">${dateFormatted}</span>
        ${weatherInfo ? `<span>${weatherInfo}</span>` : ''}
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        ${
          hasSlots
            ? `<span class="text-success">${day.total_slots} available</span>`
            : '<span class="text-muted">No slots</span>'
        }
        ${priceInfo ? `<span class="text-muted">${priceInfo}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate a list-style weekly view (more compact)
 */
export function generateWeeklyListHTML(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
}): string {
  const { venueName, venueId, days } = params;

  const daysHtml = days.map((day) => generateDaySummaryHTML(day)).join('');

  const listHtml = `
    <div class="weekly-list" style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e0e0e0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px;">📅 ${escapeHtml(venueName)}</h3>
        <button
          class="btn btn-icon"
          onclick="checkVenueAvailability('${escapeHtml(venueId)}', '${escapeHtml(venueName)}')"
          title="Refresh"
        >
          🔄
        </button>
      </div>
      <div class="days-list">
        ${daysHtml}
      </div>
    </div>
  `;

  return wrapWithStyles(listHtml);
}

/**
 * Generate a mini calendar for venue cards
 */
export function generateMiniCalendarHTML(params: {
  venueId: string;
  venueName: string;
  days: { date: string; hasSlots: boolean; slotCount?: number }[];
}): string {
  const { venueId, venueName, days } = params;

  const daysHtml = days
    .map((day) => {
      const dayNum = new Date(day.date).getDate();
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

      return `
        <div
          class="mini-day ${day.hasSlots ? 'has-slots' : ''}"
          style="
            text-align: center;
            padding: 6px 4px;
            border-radius: 6px;
            cursor: ${day.hasSlots ? 'pointer' : 'default'};
            ${day.hasSlots ? 'background: rgba(76, 175, 80, 0.1); border: 1px solid #4caf50;' : 'opacity: 0.5;'}
          "
          ${day.hasSlots ? `onclick="showDaySlots('${escapeHtml(day.date)}')"` : ''}
          title="${day.hasSlots ? `${day.slotCount} slots available` : 'No availability'}"
        >
          <div style="font-size: 10px; color: #666;">${dayName}</div>
          <div style="font-weight: 600; font-size: 14px;">${dayNum}</div>
          ${day.hasSlots && day.slotCount ? `<div style="font-size: 10px; color: #2e7d32;">${day.slotCount}</div>` : ''}
        </div>
      `;
    })
    .join('');

  return `
    <div class="mini-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 8px 0;">
      ${daysHtml}
    </div>
  `;
}
