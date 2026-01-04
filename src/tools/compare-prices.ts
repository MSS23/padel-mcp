/**
 * compare_prices MCP Tool
 *
 * Compare prices across venues and time slots.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGames } from '../services/playtomic.js';
import { createPriceComparisonResource, createEmptyStateResource, createUIToolResponse } from '../utils/ui-resources.js';

export const comparePricesSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates)'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to compare prices (YYYY-MM-DD format)'),
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
};

export function registerComparePrices(server: McpServer): void {
  server.tool(
    'compare_prices',
    'Compare padel court prices across multiple venues. Shows cheapest options first.',
    comparePricesSchema,
    async ({ location, date, time_start, time_end, max_distance_km }) => {
      const maxDistanceKm = max_distance_km ?? 10;

      // Parse location
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

      // Get all available slots
      const slots = await findAvailableGames(
        coords,
        date,
        time_start,
        time_end,
        maxDistanceKm
      );

      if (slots.length === 0) {
        const message = `No available courts found near "${location}" on ${date}.`;
        const emptyResource = createEmptyStateResource({
          title: 'No Courts Found',
          message,
          suggestions: [
            'Try a different date',
            'Expand the search radius',
            'Try a different location',
          ],
          searchLocation: location,
          searchDate: date,
        });

        return createUIToolResponse({
          textContent: message,
          uiResource: emptyResource,
          uiName: 'No Results',
        });
      }

      // Calculate price per hour for comparison
      const priceData = slots.map((slot) => ({
        venue: slot.venue_name,
        venue_id: slot.venue_id,
        court: slot.court_name,
        time: slot.start_time.split('T')[1]?.substring(0, 5) ?? '',
        duration_minutes: slot.duration_minutes,
        price: slot.price,
        currency: slot.currency,
        price_per_hour: (slot.price / slot.duration_minutes) * 60,
      }));

      // Sort by price per hour (cheapest first)
      priceData.sort((a, b) => a.price_per_hour - b.price_per_hour);

      // Get unique venues with their cheapest price
      const venueMinPrices = new Map<string, number>();
      for (const item of priceData) {
        if (!venueMinPrices.has(item.venue)) {
          venueMinPrices.set(item.venue, item.price_per_hour);
        }
      }

      // Format summary
      const timeRange =
        time_start || time_end
          ? ` (${time_start ?? '00:00'} - ${time_end ?? '23:59'})`
          : '';

      let summary = `Price comparison near "${location}" on ${date}${timeRange}:\n\n`;
      summary += `**Cheapest by venue (per hour):**\n`;

      const sortedVenues = [...venueMinPrices.entries()].sort((a, b) => a[1] - b[1]);
      for (const [venue, pricePerHour] of sortedVenues.slice(0, 10)) {
        const currency = priceData.find((p) => p.venue === venue)?.currency ?? 'EUR';
        summary += `- ${venue}: ${currency} ${pricePerHour.toFixed(2)}/hour\n`;
      }

      summary += `\n**Top 10 cheapest slots:**\n`;
      for (const slot of priceData.slice(0, 10)) {
        summary += `- ${slot.time} @ ${slot.venue} (${slot.court}): ${slot.currency} ${slot.price.toFixed(2)} (${slot.duration_minutes}min)\n`;
      }

      const venuesByPrice = sortedVenues.map(([venue, pricePerHour]) => ({
        venue,
        min_price_per_hour: Math.round(pricePerHour * 100) / 100,
        currency: priceData.find((p) => p.venue === venue)?.currency ?? 'EUR',
      }));

      const cheapestSlots = priceData.slice(0, 20).map((p) => ({
        venue: p.venue,
        venue_id: p.venue_id,
        court: p.court,
        time: p.time,
        duration_minutes: p.duration_minutes,
        price: p.price,
        price_per_hour: Math.round(p.price_per_hour * 100) / 100,
        currency: p.currency,
      }));

      const response = {
        search: {
          location,
          date,
          time_range: { start: time_start ?? null, end: time_end ?? null },
        },
        venues_by_price: venuesByPrice,
        cheapest_slots: cheapestSlots,
        total_slots_compared: priceData.length,
      };

      // Create price comparison UI
      const uiResource = createPriceComparisonResource({
        venuesByPrice,
        cheapestSlots,
        location,
        date,
        totalCompared: priceData.length,
      });

      return createUIToolResponse({
        textContent: summary + '\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
        uiResource,
        uiName: 'Price Comparison',
      });
    }
  );
}
