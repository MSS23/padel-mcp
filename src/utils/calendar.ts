/**
 * Google Calendar Link Generator
 *
 * Generates shareable links to add padel bookings to Google Calendar.
 */

export interface CalendarEventParams {
  title: string;
  location: string;
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  description?: string;
}

/**
 * Convert ISO datetime to Google Calendar format (YYYYMMDDTHHmmssZ)
 */
function toGoogleCalendarFormat(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate a Google Calendar link for a padel booking
 */
export function generateGoogleCalendarLink(params: CalendarEventParams): string {
  const { title, location, start, end, description } = params;

  const startFormatted = toGoogleCalendarFormat(start);
  const endFormatted = toGoogleCalendarFormat(end);

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${startFormatted}/${endFormatted}`);
  url.searchParams.set('location', location);

  if (description) {
    url.searchParams.set('details', description);
  }

  return url.toString();
}

/**
 * Generate calendar link for a padel slot
 */
export function generateSlotCalendarLink(params: {
  venueName: string;
  venueAddress: string;
  courtName: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  bookingUrl?: string;
}): string {
  const { venueName, venueAddress, courtName, startTime, endTime, price, currency, bookingUrl } = params;

  const description = [
    `Court: ${courtName}`,
    `Price: ${currency}${price}`,
    '',
    bookingUrl ? `Book here: ${bookingUrl}` : '',
    '',
    'Created with Padel Finder MCP',
  ]
    .filter(Boolean)
    .join('\n');

  return generateGoogleCalendarLink({
    title: `🎾 Padel at ${venueName}`,
    location: venueAddress,
    start: startTime,
    end: endTime,
    description,
  });
}

/**
 * Format a calendar link for markdown display
 */
export function formatCalendarLinkMarkdown(calendarUrl: string, text: string = 'Add to Calendar'): string {
  return `[📅 ${text}](${calendarUrl})`;
}
