/**
 * Playtomic Booking URL Generator
 *
 * Generates direct booking links for Playtomic venues.
 */

/**
 * Generate a Playtomic booking URL for a specific venue and time
 *
 * The URL format is: https://playtomic.io/tenant/[tenant_id]?q=[datetime]
 * This opens the booking page for that venue at the specified time.
 */
export function generatePlaytomicBookingUrl(params: {
  tenantId: string;
  datetime: string; // ISO 8601 format
}): string {
  const { tenantId, datetime } = params;

  // Playtomic uses the datetime as a query param
  const url = new URL(`https://playtomic.io/tenant/${tenantId}`);
  url.searchParams.set('q', datetime);

  return url.toString();
}

/**
 * Generate a booking URL for a time slot
 */
export function generateSlotBookingUrl(params: {
  venueId: string;
  startTime: string;
  platform: 'playtomic' | 'matchi';
}): string | null {
  const { venueId, startTime, platform } = params;

  if (platform === 'playtomic') {
    return generatePlaytomicBookingUrl({
      tenantId: venueId,
      datetime: startTime,
    });
  }

  // Matchi doesn't have a direct booking URL format we can generate
  // Return null - could be extended later if Matchi provides this
  return null;
}

/**
 * Format a booking link for markdown display
 */
export function formatBookingLinkMarkdown(bookingUrl: string | null, text: string = 'Book Now'): string {
  if (!bookingUrl) {
    return '';
  }
  return `[🎾 ${text}](${bookingUrl})`;
}

/**
 * Generate a venue page URL (not time-specific)
 */
export function generateVenuePageUrl(params: { venueId: string; platform: 'playtomic' | 'matchi' }): string | null {
  const { venueId, platform } = params;

  if (platform === 'playtomic') {
    return `https://playtomic.io/tenant/${venueId}`;
  }

  return null;
}
