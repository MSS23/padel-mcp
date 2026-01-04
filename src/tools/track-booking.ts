/**
 * track_booking MCP Tool
 *
 * Record a booking after completing it on Playtomic.
 * Stores booking history for future reference.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createBooking, cancelBooking, bookings } from '../services/bookings.js';
import { generateSlotCalendarLink } from '../utils/calendar.js';
import { generateSlotBookingUrl } from '../utils/booking.js';
import type { BookingRecord } from '../types/index.js';

export const trackBookingSchema = {
  venue_id: z
    .string()
    .describe('The venue ID where the booking was made'),
  venue_name: z
    .string()
    .describe('Name of the venue'),
  court_name: z
    .string()
    .describe('Name of the court booked'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date of the booking (YYYY-MM-DD format)'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('Start time (HH:mm format)'),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('End time (HH:mm format)'),
  price: z
    .number()
    .min(0)
    .describe('Total price paid'),
  currency: z
    .string()
    .optional()
    .default('EUR')
    .describe('Currency code (default: EUR)'),
  players: z
    .array(z.string())
    .optional()
    .describe('Names or emails of players joining'),
  notes: z
    .string()
    .optional()
    .describe('Additional notes about the booking'),
};

export const cancelBookingSchema = {
  booking_id: z
    .string()
    .describe('The booking ID to cancel'),
};

export const updateBookingSchema = {
  booking_id: z
    .string()
    .describe('The booking ID to update'),
  players: z
    .array(z.string())
    .optional()
    .describe('Updated list of players'),
  notes: z
    .string()
    .optional()
    .describe('Updated notes'),
  status: z
    .enum(['confirmed', 'cancelled', 'completed'])
    .optional()
    .describe('Updated status'),
};

export function registerTrackBooking(server: McpServer): void {
  // Track a new booking
  server.tool(
    'track_booking',
    'Record a padel court booking after completing it on Playtomic. Saves to booking history for tracking and statistics.',
    trackBookingSchema,
    async ({ venue_id, venue_name, court_name, date, start_time, end_time, price, currency, players, notes }) => {
      const currencyCode = currency ?? 'EUR';

      // Generate booking URL
      const bookingUrl = generateSlotBookingUrl({
        venueId: venue_id,
        startTime: `${date}T${start_time}:00`,
        platform: 'playtomic',
      });

      // Generate calendar link
      const calendarLink = generateSlotCalendarLink({
        venueName: venue_name,
        courtName: court_name,
        startTime: `${date}T${start_time}:00`,
        endTime: `${date}T${end_time}:00`,
        price,
        currency: currencyCode,
        bookingUrl: bookingUrl ?? undefined,
      });

      const booking = await createBooking({
        venue_id,
        venue_name,
        court_name,
        date,
        start_time,
        end_time,
        price,
        currency: currencyCode,
        booking_url: bookingUrl ?? undefined,
        calendar_link: calendarLink,
        players,
        notes,
      });

      const playersList = booking.players.length > 0
        ? `\n- 👥 Players: ${booking.players.join(', ')}`
        : '';

      const notesLine = booking.notes
        ? `\n- 📝 Notes: ${booking.notes}`
        : '';

      const summary = `## ✅ Booking Recorded!

**Booking Details:**
- 🆔 ID: \`${booking.id}\`
- 🏢 Venue: ${booking.venue_name}
- 🎾 Court: ${booking.court_name}
- 📅 Date: ${booking.date}
- 🕐 Time: ${booking.start_time} - ${booking.end_time}
- 💰 Price: ${booking.currency}${booking.price.toFixed(2)}${playersList}${notesLine}

**Links:**
${booking.calendar_link ? `- [📅 Add to Calendar](${booking.calendar_link})` : ''}
${booking.booking_url ? `- [🎾 View on Playtomic](${booking.booking_url})` : ''}

**Tip:** Use \`booking_history\` to view all your bookings.`;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(booking, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // Cancel a booking
  server.tool(
    'cancel_booking',
    'Mark a booking as cancelled in your history.',
    cancelBookingSchema,
    async ({ booking_id }) => {
      const booking = await bookings.getBooking(booking_id);

      if (!booking) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Booking not found: \`${booking_id}\``,
            },
          ],
        };
      }

      if (booking.status === 'cancelled') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ Booking \`${booking_id}\` is already cancelled.`,
            },
          ],
        };
      }

      await cancelBooking(booking_id);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Booking cancelled: **${booking.venue_name}** on ${booking.date} at ${booking.start_time}

⚠️ **Note:** This only updates your local records. If you need to cancel on Playtomic, please do so on their website.`,
          },
        ],
      };
    }
  );

  // Update a booking
  server.tool(
    'update_booking',
    'Update details of an existing booking (players, notes, or status).',
    updateBookingSchema,
    async ({ booking_id, players, notes, status }) => {
      const booking = await bookings.getBooking(booking_id);

      if (!booking) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Booking not found: \`${booking_id}\``,
            },
          ],
        };
      }

      const updated = await bookings.updateBooking(booking_id, {
        players,
        notes,
        status,
      });

      if (!updated) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Failed to update booking: \`${booking_id}\``,
            },
          ],
        };
      }

      const changes: string[] = [];
      if (players !== undefined) changes.push(`Players: ${players.join(', ') || '(none)'}`);
      if (notes !== undefined) changes.push(`Notes: ${notes || '(none)'}`);
      if (status !== undefined) changes.push(`Status: ${status}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Booking updated: \`${booking_id}\`

**Changes:**
${changes.map((c) => `- ${c}`).join('\n')}

\`\`\`json
${JSON.stringify(updated, null, 2)}
\`\`\``,
          },
        ],
      };
    }
  );
}
