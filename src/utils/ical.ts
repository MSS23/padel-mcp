/**
 * iCal Utilities
 *
 * Generate iCal (.ics) format for calendar integration.
 */

import type { BookingRecord } from '../types/index.js';

/**
 * Format a date to iCal format (YYYYMMDDTHHMMSS)
 */
function formatICalDate(date: string, time: string): string {
  // Remove any non-digit characters
  const dateClean = date.replace(/-/g, '');
  const timeClean = time.replace(/:/g, '');
  return `${dateClean}T${timeClean}00`;
}

/**
 * Escape special characters for iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a unique ID for an event
 */
function generateEventId(booking: BookingRecord): string {
  return `${booking.id}@padel-finder`;
}

/**
 * Generate an iCal event from a booking
 */
export function generateICalEvent(booking: BookingRecord): string {
  const startDate = formatICalDate(booking.date, booking.start_time);
  const endDate = formatICalDate(booking.date, booking.end_time);
  const uid = generateEventId(booking);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let description = `Court: ${booking.court_name}\\n`;
  description += `Price: ${booking.currency}${booking.price.toFixed(2)}\\n`;

  if (booking.players.length > 0) {
    description += `Players: ${booking.players.join(', ')}\\n`;
  }

  if (booking.notes) {
    description += `Notes: ${booking.notes}\\n`;
  }

  if (booking.booking_url) {
    description += `\\nBooking: ${booking.booking_url}`;
  }

  const summary = escapeICalText(`Padel at ${booking.venue_name}`);
  const location = escapeICalText(booking.venue_name);
  const descriptionEscaped = escapeICalText(description);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${descriptionEscaped}`,
    `STATUS:${booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
  ];

  return lines.join('\r\n');
}

/**
 * Generate a complete iCal calendar with multiple events
 */
export function generateICalCalendar(
  bookings: BookingRecord[],
  calendarName = 'Padel Finder Bookings'
): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Padel Finder//MCP Server//EN',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const events = bookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => generateICalEvent(b));

  const footer = ['END:VCALENDAR'];

  return [...header, ...events, ...footer].join('\r\n');
}

/**
 * Generate a downloadable iCal file content
 */
export function generateDownloadableICalFile(bookings: BookingRecord[]): {
  content: string;
  filename: string;
  mimeType: string;
} {
  const content = generateICalCalendar(bookings);
  const filename = `padel-bookings-${new Date().toISOString().split('T')[0]}.ics`;

  return {
    content,
    filename,
    mimeType: 'text/calendar',
  };
}
