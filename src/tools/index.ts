/**
 * Tool Registration
 *
 * Registers all MCP tools with the server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFindCourts } from './find-courts.js';
import { registerCheckAvailability } from './check-availability.js';
import { registerFindAvailableGames } from './find-available-games.js';
import { registerComparePrices } from './compare-prices.js';
import { registerSetNotification } from './set-notification.js';
import { registerGetVenueDetails } from './get-venue-details.js';
import { registerSearchByDuration } from './search-by-duration.js';
import { registerFavorites } from './favorites.js';
import { registerWeeklyAvailability } from './weekly-availability.js';
import { registerFindCheapest } from './find-cheapest.js';
import { registerPeakHours } from './peak-hours.js';
import { registerBookCourt } from './book-court.js';

/**
 * Register all MCP tools with the server
 */
export function registerTools(server: McpServer): void {
  // Core tools
  registerFindCourts(server);
  registerCheckAvailability(server);
  registerFindAvailableGames(server);
  registerComparePrices(server);
  registerSetNotification(server);

  // Enhanced tools
  registerGetVenueDetails(server);
  registerSearchByDuration(server);
  registerFavorites(server);
  registerWeeklyAvailability(server);
  registerFindCheapest(server);
  registerPeakHours(server);
  
  // Booking tools
  registerBookCourt(server);
}

// Re-export schemas for documentation
export { findCourtsSchema } from './find-courts.js';
export { checkAvailabilitySchema } from './check-availability.js';
export { findAvailableGamesSchema } from './find-available-games.js';
export { comparePricesSchema } from './compare-prices.js';
export { setNotificationSchema, listNotificationsSchema, cancelNotificationSchema } from './set-notification.js';
export { getVenueDetailsSchema } from './get-venue-details.js';
export { searchByDurationSchema } from './search-by-duration.js';
export { saveFavoriteSchema, removeFavoriteSchema, listFavoritesSchema, quickCheckSchema } from './favorites.js';
export { weeklyAvailabilitySchema } from './weekly-availability.js';
export { findCheapestSchema } from './find-cheapest.js';
export { peakHoursSchema } from './peak-hours.js';
export { bookCourtSchema } from './book-court.js';
