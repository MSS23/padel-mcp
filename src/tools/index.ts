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
import { registerSearchWithFilters } from './search-with-filters.js';
import { registerQuickSearch } from './quick-search.js';
import { registerCheckAlerts } from './check-alerts.js';
import { registerTrackBooking } from './track-booking.js';
import { registerBookingHistory } from './booking-history.js';
import { registerCalendarFeed } from './calendar-feed.js';
import { registerFriendsTools } from './friends.js';
import { registerGroupGames } from './group-games.js';
import { registerInvite } from './invite.js';

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

  // New tools
  registerGetVenueDetails(server);
  registerSearchByDuration(server);
  registerFavorites(server);
  registerWeeklyAvailability(server);
  registerFindCheapest(server);
  registerPeakHours(server);

  // Phase 5 tools - Enhanced Search
  registerSearchWithFilters(server);
  registerQuickSearch(server);

  // Phase 5 tools - Alerts & Notifications
  registerCheckAlerts(server);

  // Phase 5 tools - Booking & Calendar
  registerTrackBooking(server);
  registerBookingHistory(server);
  registerCalendarFeed(server);

  // Phase 5 tools - Social & Multi-Player
  registerFriendsTools(server);
  registerGroupGames(server);
  registerInvite(server);
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
export { searchWithFiltersSchema } from './search-with-filters.js';
export { quickSearchSchema } from './quick-search.js';
export { checkAlertsSchema } from './check-alerts.js';
export { trackBookingSchema, cancelBookingSchema, updateBookingSchema } from './track-booking.js';
export { bookingHistorySchema, bookingStatsSchema } from './booking-history.js';
export { calendarFeedSchema } from './calendar-feed.js';
export { addFriendSchema, listFriendsSchema, removeFriendSchema, findPlayersSchema, updateFriendSchema } from './friends.js';
export { createGroupGameSchema, listGamesSchema, gameStatusSchema, confirmPlayerSchema, cancelGameSchema, addPlayersSchema } from './group-games.js';
export { generateInviteSchema } from './invite.js';
