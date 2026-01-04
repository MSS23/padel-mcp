/**
 * find_available_games MCP Tool
 *
 * Main tool - finds the nearest available padel game based on location and time.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGames } from '../services/playtomic.js';

export const findAvailableGamesSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates like "51.5074,-0.1278")'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to find games (YYYY-MM-DD format)'),
  preferred_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Preferred earliest start time (HH:mm format, e.g., "18:00")'),
  preferred_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Preferred latest start time (HH:mm format, e.g., "21:00")'),
  max_distance_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum distance to search (1-50km, default: 10)'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Maximum number of results (default: 20)'),
};

export function registerFindAvailableGames(server: McpServer): void {
  server.tool(
    'find_available_games',
    'Find the nearest available padel games based on your location and preferred time. This is the main tool for finding a court to play.',
    findAvailableGamesSchema,
    async ({
      location,
      date,
      preferred_time_start,
      preferred_time_end,
      max_distance_km,
      max_results,
    }) => {
      const maxDistanceKm = max_distance_km ?? 10;
      const maxResultCount = max_results ?? 20;

      // Parse the location
      const coords = await parseLocation(location);

      if (!coords) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Could not find location: "${location}". Please try a different address or use coordinates.`,
            },
          ],
        };
      }

      // Find available games
      const slots = await findAvailableGames(
        coords,
        date,
        preferred_time_start,
        preferred_time_end,
        maxDistanceKm
      );

      const limitedSlots = slots.slice(0, maxResultCount);

      if (limitedSlots.length === 0) {
        const timeFilter =
          preferred_time_start || preferred_time_end
            ? ` between ${preferred_time_start ?? '00:00'} and ${preferred_time_end ?? '23:59'}`
            : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `No available padel courts found near "${location}" on ${date}${timeFilter}.\n\nTry:\n- Expanding the search radius\n- Looking at a different date\n- Adjusting the time range`,
            },
          ],
        };
      }

      // Group by venue for better readability
      const slotsByVenue = new Map<string, typeof limitedSlots>();
      for (const slot of limitedSlots) {
        const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
        venueSlots.push(slot);
        slotsByVenue.set(slot.venue_name, venueSlots);
      }

      // Format summary
      const timeRange =
        preferred_time_start || preferred_time_end
          ? ` (${preferred_time_start ?? '00:00'} - ${preferred_time_end ?? '23:59'})`
          : '';

      let summary = `Found ${limitedSlots.length} available slot(s) near "${location}" on ${date}${timeRange}:\n`;

      for (const [venueName, venueSlots] of slotsByVenue) {
        const distanceInfo = (venueSlots[0] as any).distance_km
          ? ` (${(venueSlots[0] as any).distance_km}km away)`
          : '';
        summary += `\n**${venueName}**${distanceInfo}:\n`;

        for (const slot of venueSlots.slice(0, 5)) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';
          summary += `  - ${startTime}-${endTime} | ${slot.court_name} | ${slot.currency} ${slot.price.toFixed(2)}\n`;
        }

        if (venueSlots.length > 5) {
          summary += `  ... and ${venueSlots.length - 5} more slots\n`;
        }
      }

      const response = {
        search: {
          location,
          date,
          time_range: {
            start: preferred_time_start ?? null,
            end: preferred_time_end ?? null,
          },
          max_distance_km: maxDistanceKm,
        },
        results: limitedSlots.map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          court: s.court_name,
          start: s.start_time,
          end: s.end_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          currency: s.currency,
        })),
        total_found: limitedSlots.length,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}
