#!/usr/bin/env node
/**
 * Padel Finder MCP Server
 *
 * An MCP server for finding available padel courts via Playtomic.
 *
 * Core Tools:
 * - find_nearby_courts: Find padel venues near a location
 * - check_availability: Check available time slots at a venue
 * - find_available_games: Find the nearest available game (main tool)
 * - compare_prices: Compare prices across venues
 *
 * Alert Tools:
 * - set_availability_alert: Set up alerts for preferred slots
 * - list_availability_alerts: List all active alerts
 * - cancel_availability_alert: Cancel an alert
 *
 * Advanced Tools:
 * - get_venue_details: Get detailed venue information
 * - search_by_duration: Find slots with specific duration
 * - get_weekly_availability: View availability across multiple days
 * - find_cheapest_time: Find cheapest available slots
 * - get_peak_hours: Analyze busy/quiet times at venues
 *
 * Favorites:
 * - save_favorite_venue: Save a venue to favorites
 * - remove_favorite_venue: Remove a venue from favorites
 * - list_favorite_venues: List all favorites
 * - quick_book_check: Check availability at all favorites
 *
 * Communication is via stdio (standard input/output).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

async function main(): Promise<void> {
  // Create MCP server instance
  const server = new McpServer({
    name: 'padel-finder',
    version: '2.0.0',
  });

  // Register all tools
  registerTools(server);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log startup to stderr (stdout is reserved for MCP messages)
  console.error('Padel Finder MCP Server v2.0 started');
  console.error('');
  console.error('Core Tools:');
  console.error('  - find_nearby_courts: Find padel venues near a location');
  console.error('  - check_availability: Check available time slots');
  console.error('  - find_available_games: Find nearest available game');
  console.error('  - compare_prices: Compare prices across venues');
  console.error('');
  console.error('Advanced Tools:');
  console.error('  - get_venue_details: Get detailed venue info');
  console.error('  - search_by_duration: Find slots by duration');
  console.error('  - get_weekly_availability: Week calendar view');
  console.error('  - find_cheapest_time: Find cheapest slots');
  console.error('  - get_peak_hours: Analyze peak/off-peak times');
  console.error('');
  console.error('Favorites:');
  console.error('  - save/remove/list_favorite_venue(s)');
  console.error('  - quick_book_check: Check all favorites at once');
  console.error('');
  console.error('Alerts:');
  console.error('  - set/list/cancel_availability_alert');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
