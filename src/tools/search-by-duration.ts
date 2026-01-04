/**
 * search_by_duration MCP Tool
 *
 * Find courts available for a specific play duration.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGamesFiltered } from '../services/playtomic.js';

export const searchByDurationSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates)'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to search (YYYY-MM-DD format)'),
  duration_minutes: z
    .number()
    .int()
    .describe('Required slot duration in minutes (typically 60, 90, or 120)'),
  time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Start of time range (HH:mm format)'),
  time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('End of time range (HH:mm format)'),
  max_distance_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum search distance (default: 10km)'),
  max_price: z
    .number()
    .optional()
    .describe('Maximum price per slot'),
};

export function registerSearchByDuration(server: McpServer): void {
  server.tool(
    'search_by_duration',
    'Find padel courts available for a specific duration (e.g., exactly 90 minutes). Filters out slots that don\'t match your duration requirement.',
    searchByDurationSchema,
    async ({ location, date, duration_minutes, time_start, time_end, max_distance_km, max_price }) => {
      const coords = await parseLocation(location);

      if (!coords) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Could not find location: "${location}".`,
            },
          ],
        };
      }

      const slots = await findAvailableGamesFiltered(coords, date, {
        preferredTimeStart: time_start,
        preferredTimeEnd: time_end,
        maxDistanceKm: max_distance_km ?? 10,
        durationMinutes: duration_minutes,
        maxPrice: max_price,
        sortBy: 'time',
      });

      if (slots.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No ${duration_minutes}-minute slots available near "${location}" on ${date}.\n\nTry:\n- A different duration (60, 90, or 120 minutes)\n- A different date\n- Expanding the search area`,
            },
          ],
        };
      }

      // Group by venue
      const slotsByVenue = new Map<string, typeof slots>();
      for (const slot of slots) {
        const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
        venueSlots.push(slot);
        slotsByVenue.set(slot.venue_name, venueSlots);
      }

      let summary = `Found ${slots.length} ${duration_minutes}-minute slot(s) near "${location}" on ${date}:\n`;

      for (const [venueName, venueSlots] of slotsByVenue) {
        const distance = venueSlots[0]?.distance_km;
        summary += `\n**${venueName}**${distance ? ` (${distance}km)` : ''}:\n`;

        for (const slot of venueSlots.slice(0, 5)) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';
          summary += `  - ${startTime}-${endTime} | ${slot.court_name} | ${slot.currency} ${slot.price.toFixed(2)}\n`;
        }

        if (venueSlots.length > 5) {
          summary += `  ... and ${venueSlots.length - 5} more\n`;
        }
      }

      const response = {
        search: {
          location,
          date,
          duration_minutes,
          time_range: { start: time_start ?? null, end: time_end ?? null },
          max_price: max_price ?? null,
        },
        results: slots.slice(0, 30).map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          court: s.court_name,
          start: s.start_time,
          end: s.end_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          currency: s.currency,
          distance_km: s.distance_km,
        })),
        total_found: slots.length,
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
