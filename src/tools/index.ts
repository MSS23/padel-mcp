/**
 * Tool Registration
 *
 * Registers all MCP tools with the server.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFindCourts } from './find-courts.js';
import { registerCheckAvailability } from './check-availability.js';
import { registerFindAvailableGames } from './find-available-games.js';
import { registerComparePrices } from './compare-prices.js';
import { registerSetNotification } from './set-notification.js';
import { registerCheckAlerts } from './check-alerts.js';
import { registerGetVenueDetails } from './get-venue-details.js';
import { registerSearchByDuration } from './search-by-duration.js';
import { registerFavorites } from './favorites.js';
import { registerWeeklyAvailability } from './weekly-availability.js';
import { registerFindCheapest } from './find-cheapest.js';
import { registerPeakHours } from './peak-hours.js';
import { registerQuickSearch } from './quick-search.js';
import { registerBookCourt } from './book-court.js';

export const SERVER_INSTRUCTIONS = `Padel Finder: find, compare and watch padel court slots in the UK.

IMPORTANT: venue and slot data is SIMULATED demo data (about 35 fictional UK venues with generated prices and availability). It is not live Playtomic data. Say so when presenting results, and do not present booking links as confirmed availability. book_court opens a demo checkout: no real booking or payment is ever made.

Which tool to use:
- "Where can I play tonight / tomorrow / this weekend near X?" -> quick_search (preset) or find_available_games (specific date and time window).
- Venues near a place -> find_nearby_courts. One venue's slots -> check_availability (needs a venue_id from a search).
- Cheapest options -> find_cheapest_time or compare_prices. Busy vs quiet times -> get_peak_hours.
- Favourites (stored in ~/.padel-finder/preferences.json) -> save_favorite_venue, list_favorite_venues, quick_book_check.
- Alerts (stored in ~/.padel-finder/alerts.json) -> set_availability_alert, then check_alerts to poll; nothing polls automatically.
Locations accept a place name, postcode or "lat,lon".`;

/**
 * Create a fully configured MCP server. One instance per transport/connection.
 */
export function createPadelServer(): McpServer {
  const server = new McpServer(
    { name: 'padel-finder', version: '2.1.0' },
    { instructions: SERVER_INSTRUCTIONS }
  );
  registerTools(server);
  return server;
}

/**
 * Register all MCP tools with the server
 */
export function registerTools(server: McpServer): void {
  // Search
  registerQuickSearch(server);
  registerFindAvailableGames(server);
  registerFindCourts(server);
  registerCheckAvailability(server);
  registerComparePrices(server);
  registerGetVenueDetails(server);
  registerSearchByDuration(server);
  registerWeeklyAvailability(server);
  registerFindCheapest(server);
  registerPeakHours(server);

  // Favorites + alerts
  registerFavorites(server);
  registerSetNotification(server);
  registerCheckAlerts(server);

  // Demo checkout (no real booking)
  registerBookCourt(server);
}
