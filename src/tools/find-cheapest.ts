/**
 * find_cheapest_time MCP Tool
 *
 * Find the cheapest available slot for a given venue/area.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGamesFiltered } from '../services/playtomic.js';

export const findCheapestSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates)'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to search (YYYY-MM-DD format)'),
  min_duration_minutes: z
    .number()
    .int()
    .optional()
    .describe('Minimum slot duration in minutes'),
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
    .default(15)
    .describe('Maximum search distance (default: 15km)'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Maximum number of results (default: 10)'),
};

export function registerFindCheapest(server: McpServer): void {
  server.tool(
    'find_cheapest_time',
    'Find the cheapest available padel court slots in your area. Results are sorted by price (lowest first).',
    findCheapestSchema,
    async ({ location, date, min_duration_minutes, time_start, time_end, max_distance_km, max_results }) => {
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

      // Get all slots sorted by price
      let slots = await findAvailableGamesFiltered(coords, date, {
        preferredTimeStart: time_start,
        preferredTimeEnd: time_end,
        maxDistanceKm: max_distance_km ?? 15,
        sortBy: 'price',
      });

      // Filter by minimum duration if specified
      if (min_duration_minutes) {
        slots = slots.filter((s) => s.duration_minutes >= min_duration_minutes);
      }

      const topSlots = slots.slice(0, max_results ?? 10);

      if (topSlots.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No available courts found near "${location}" on ${date}.\n\nTry:\n- A different date\n- Expanding the search radius\n- Removing the duration filter`,
            },
          ],
        };
      }

      // Calculate price stats
      const prices = slots.map((s) => s.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const cheapest = topSlots[0];

      let summary = `## Cheapest Courts near "${location}" on ${date}\n\n`;

      // Highlight the best deal
      const cheapestTime = cheapest.start_time.split('T')[1]?.substring(0, 5) ?? '';
      summary += `🏆 **Best Deal:** ${cheapest.venue_name} at ${cheapestTime}\n`;
      summary += `   ${cheapest.currency} ${cheapest.price.toFixed(2)} for ${cheapest.duration_minutes}min`;
      if (cheapest.distance_km) {
        summary += ` (${cheapest.distance_km}km away)`;
      }
      summary += `\n\n`;

      summary += `**Top ${topSlots.length} cheapest options:**\n\n`;

      for (let i = 0; i < topSlots.length; i++) {
        const slot = topSlots[i];
        const time = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
        const pricePerHour = (slot.price / slot.duration_minutes) * 60;

        summary += `${i + 1}. **${slot.currency} ${slot.price.toFixed(2)}** - ${slot.venue_name}\n`;
        summary += `   ${time} | ${slot.duration_minutes}min | ${slot.court_name}`;
        if (slot.distance_km) {
          summary += ` | ${slot.distance_km}km`;
        }
        summary += `\n   (${slot.currency} ${pricePerHour.toFixed(2)}/hour)\n\n`;
      }

      const response = {
        search: {
          location,
          date,
          time_range: { start: time_start ?? null, end: time_end ?? null },
          min_duration_minutes: min_duration_minutes ?? null,
          max_distance_km: max_distance_km ?? 15,
        },
        stats: {
          total_slots_found: slots.length,
          average_price: Math.round(avgPrice * 100) / 100,
          cheapest_price: cheapest.price,
          currency: cheapest.currency,
        },
        cheapest_slots: topSlots.map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          court: s.court_name,
          start: s.start_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          price_per_hour: Math.round(((s.price / s.duration_minutes) * 60) * 100) / 100,
          currency: s.currency,
          distance_km: s.distance_km,
        })),
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}
