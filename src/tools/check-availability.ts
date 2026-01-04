/**
 * check_availability MCP Tool
 *
 * Check available time slots at a specific venue.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkVenueAvailability } from '../services/playtomic.js';

export const checkAvailabilitySchema = {
  venue_id: z
    .string()
    .describe('The venue ID (obtained from find_nearby_courts)'),
  venue_name: z
    .string()
    .optional()
    .describe('Optional venue name for display purposes'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to check availability (YYYY-MM-DD format)'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Optional start time filter (HH:mm format, e.g., "09:00")'),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Optional end time filter (HH:mm format, e.g., "18:00")'),
};

export function registerCheckAvailability(server: McpServer): void {
  server.tool(
    'check_availability',
    'Check available padel court time slots at a specific venue for a given date.',
    checkAvailabilitySchema,
    async ({ venue_id, venue_name, date, start_time, end_time }) => {
      // Get availability from Playtomic
      const slots = await checkVenueAvailability(venue_id, date, venue_name);

      // Filter by time if specified
      const filteredSlots = slots.filter((slot) => {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';

        if (start_time && slotTime < start_time) {
          return false;
        }
        if (end_time && slotTime > end_time) {
          return false;
        }
        return true;
      });

      if (filteredSlots.length === 0) {
        const timeFilter =
          start_time || end_time
            ? ` between ${start_time ?? '00:00'} and ${end_time ?? '23:59'}`
            : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `No available slots at ${venue_name ?? venue_id} on ${date}${timeFilter}.`,
            },
          ],
        };
      }

      // Group slots by court
      const slotsByCourt = new Map<string, typeof filteredSlots>();
      for (const slot of filteredSlots) {
        const courtSlots = slotsByCourt.get(slot.court_name) ?? [];
        courtSlots.push(slot);
        slotsByCourt.set(slot.court_name, courtSlots);
      }

      // Format response
      let summary = `Available slots at **${venue_name ?? venue_id}** on ${date}:\n`;

      for (const [courtName, courtSlots] of slotsByCourt) {
        summary += `\n**${courtName}:**\n`;
        for (const slot of courtSlots) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';
          summary += `  - ${startTime} - ${endTime} (${slot.duration_minutes}min) - ${slot.currency} ${slot.price.toFixed(2)}\n`;
        }
      }

      const response = {
        venue_id,
        venue_name: venue_name ?? venue_id,
        date,
        slots: filteredSlots.map((s) => ({
          court: s.court_name,
          start: s.start_time,
          end: s.end_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          currency: s.currency,
        })),
        total_slots: filteredSlots.length,
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
