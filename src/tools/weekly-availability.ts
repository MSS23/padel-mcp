/**
 * weekly_availability MCP Tool
 *
 * View availability across multiple days at once.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkVenueAvailability, findNearbyVenues } from '../services/playtomic.js';
import { parseLocation } from '../services/geocoding.js';
import type { DayAvailability } from '../types/index.js';

export const weeklyAvailabilitySchema = {
  venue_id: z.string().optional().describe('Specific venue ID to check'),
  location: z.string().optional().describe('Or search by location'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date (YYYY-MM-DD format)'),
  num_days: z
    .number()
    .int()
    .min(1)
    .max(7)
    .optional()
    .default(7)
    .describe('Number of days to check (1-7, default: 7)'),
  time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Filter by time start (HH:mm)'),
  time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Filter by time end (HH:mm)'),
};

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function registerWeeklyAvailability(server: McpServer): void {
  server.tool(
    'get_weekly_availability',
    'View padel court availability across multiple days (up to a week). Great for planning ahead.',
    weeklyAvailabilitySchema,
    async ({ venue_id, location, start_date, num_days, time_start, time_end }) => {
      const days = num_days ?? 7;

      // Need either venue_id or location
      if (!venue_id && !location) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Please provide either a venue_id or location.',
            },
          ],
        };
      }

      let venueId = venue_id;
      let venueName = venue_id ?? 'Unknown';

      // If location provided, find the nearest venue
      if (!venue_id && location) {
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

        const venues = await findNearbyVenues(coords, 10, 1);
        if (venues.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No venues found near "${location}".`,
              },
            ],
          };
        }

        venueId = venues[0].id;
        venueName = venues[0].name;
      }

      const weekData: DayAvailability[] = [];

      for (let i = 0; i < days; i++) {
        const date = addDays(start_date, i);

        try {
          let slots = await checkVenueAvailability(venueId!, date, venueName);

          // Filter by time if specified
          if (time_start || time_end) {
            slots = slots.filter((slot) => {
              const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
              if (time_start && slotTime < time_start) return false;
              if (time_end && slotTime > time_end) return false;
              return true;
            });
          }

          const dayAvail: DayAvailability = {
            date,
            day_name: getDayName(date),
            total_slots: slots.length,
          };

          if (slots.length > 0) {
            dayAvail.earliest_slot = slots[0].start_time.split('T')[1]?.substring(0, 5);
            dayAvail.latest_slot = slots[slots.length - 1].start_time.split('T')[1]?.substring(0, 5);

            const prices = slots.map((s) => s.price);
            dayAvail.price_range = {
              min: Math.min(...prices),
              max: Math.max(...prices),
              currency: slots[0].currency,
            };
          }

          weekData.push(dayAvail);

          // Small delay between days
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          weekData.push({
            date,
            day_name: getDayName(date),
            total_slots: 0,
          });
        }
      }

      // Build calendar view
      let summary = `## Weekly Availability: ${venueName}\n\n`;
      summary += `| Day | Date | Slots | Earliest | Latest | Price Range |\n`;
      summary += `|-----|------|-------|----------|--------|-------------|\n`;

      for (const day of weekData) {
        const slotsInfo = day.total_slots > 0 ? `${day.total_slots}` : '-';
        const earliest = day.earliest_slot ?? '-';
        const latest = day.latest_slot ?? '-';
        const priceRange = day.price_range
          ? `${day.price_range.currency} ${day.price_range.min.toFixed(0)}-${day.price_range.max.toFixed(0)}`
          : '-';

        summary += `| ${day.day_name} | ${day.date} | ${slotsInfo} | ${earliest} | ${latest} | ${priceRange} |\n`;
      }

      const totalSlots = weekData.reduce((sum, d) => sum + d.total_slots, 0);
      const daysWithAvailability = weekData.filter((d) => d.total_slots > 0).length;

      summary += `\n**Summary:** ${totalSlots} total slots across ${daysWithAvailability}/${days} days`;

      const response = {
        venue_id: venueId,
        venue_name: venueName,
        period: {
          start: start_date,
          end: addDays(start_date, days - 1),
          days,
        },
        time_filter: time_start || time_end ? { start: time_start, end: time_end } : null,
        daily_availability: weekData,
        summary: {
          total_slots: totalSlots,
          days_with_availability: daysWithAvailability,
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}
