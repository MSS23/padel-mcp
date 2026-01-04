/**
 * Tool Registration - MVP
 *
 * Minimal viable product with core tools only.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFindCourts } from './find-courts.js';
import { registerCheckAvailability } from './check-availability.js';
import { registerFindAvailableGames } from './find-available-games.js';

/**
 * Register all MCP tools with the server
 */
export function registerTools(server: McpServer): void {
  // MVP Core tools only
  registerFindCourts(server);
  registerCheckAvailability(server);
  registerFindAvailableGames(server);
}

// Re-export schemas for documentation
export { findCourtsSchema } from './find-courts.js';
export { checkAvailabilitySchema } from './check-availability.js';
export { findAvailableGamesSchema } from './find-available-games.js';
