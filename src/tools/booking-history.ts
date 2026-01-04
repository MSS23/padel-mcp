/**
 * booking_history MCP Tool
 *
 * View past and upcoming bookings with statistics.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFilteredBookings, getBookingStats, bookings } from '../services/bookings.js';
import { formatCalendarLinkMarkdown } from '../utils/calendar.js';
import { formatBookingLinkMarkdown } from '../utils/booking.js';
import type { BookingRecord } from '../types/index.js';

export const bookingHistorySchema = {
  filter: z
    .enum(['upcoming', 'past', 'all'])
    .optional()
    .default('all')
    .describe('Filter by time: upcoming, past, or all (default: all)'),
  venue_id: z
    .string()
    .optional()
    .describe('Filter by specific venue'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of results (default: 20)'),
  include_stats: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include booking statistics (default: true)'),
};

export const bookingStatsSchema = {};

export function registerBookingHistory(server: McpServer): void {
  // View booking history
  server.tool(
    'booking_history',
    'View your padel booking history with optional filters. Shows upcoming and past bookings with links.',
    bookingHistorySchema,
    async ({ filter, venue_id, limit, include_stats }) => {
      const filterType = filter ?? 'all';
      const maxResults = limit ?? 20;
      const showStats = include_stats ?? true;

      // Auto-complete past bookings
      await bookings.autoCompletePastBookings();

      const bookingList = await getFilteredBookings({
        filter: filterType,
        venue_id,
        limit: maxResults,
      });

      if (bookingList.length === 0) {
        const filterText = filterType !== 'all' ? ` (${filterType})` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `📭 No bookings found${filterText}. Use \`track_booking\` to record your bookings.`,
            },
          ],
        };
      }

      let summary = `## 📅 Booking History\n\n`;

      // Group by status
      const upcoming = bookingList.filter((b) => {
        const now = new Date();
        const bookingDateTime = `${b.date}T${b.start_time}`;
        return bookingDateTime >= now.toISOString().substring(0, 16) && b.status === 'confirmed';
      });
      const completed = bookingList.filter((b) => b.status === 'completed');
      const cancelled = bookingList.filter((b) => b.status === 'cancelled');

      if (upcoming.length > 0) {
        summary += `### 🗓️ Upcoming (${upcoming.length})\n\n`;
        for (const booking of upcoming) {
          summary += formatBookingCard(booking);
        }
      }

      if (completed.length > 0 && (filterType === 'past' || filterType === 'all')) {
        summary += `### ✅ Completed (${completed.length})\n\n`;
        for (const booking of completed) {
          summary += formatBookingCard(booking);
        }
      }

      if (cancelled.length > 0 && filterType === 'all') {
        summary += `### ❌ Cancelled (${cancelled.length})\n\n`;
        for (const booking of cancelled) {
          summary += formatBookingCard(booking, true);
        }
      }

      // Add stats
      if (showStats) {
        const stats = await getBookingStats();
        summary += `---\n\n### 📊 Statistics\n\n`;
        summary += `- 🎾 Total bookings: ${stats.total_bookings}\n`;
        summary += `- 🏢 Venues played: ${stats.venues_played}\n`;
        summary += `- 🗓️ Upcoming: ${stats.upcoming_count}\n`;

        for (const [currency, amount] of Object.entries(stats.total_spent)) {
          summary += `- 💰 Total spent: ${currency}${amount.toFixed(2)}\n`;
        }
      }

      // Build JSON response
      const response = {
        filter: filterType,
        total: bookingList.length,
        bookings: bookingList,
        stats: showStats ? await getBookingStats() : undefined,
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

  // Get booking statistics only
  server.tool(
    'booking_stats',
    'Get statistics about your padel bookings (total count, spending, venues played).',
    bookingStatsSchema,
    async () => {
      const stats = await getBookingStats();

      let summary = `## 📊 Booking Statistics\n\n`;
      summary += `- 🎾 **Total bookings:** ${stats.total_bookings}\n`;
      summary += `- 🏢 **Venues played:** ${stats.venues_played}\n`;
      summary += `- 🗓️ **Upcoming bookings:** ${stats.upcoming_count}\n\n`;

      if (Object.keys(stats.total_spent).length > 0) {
        summary += `### 💰 Total Spent\n\n`;
        for (const [currency, amount] of Object.entries(stats.total_spent)) {
          summary += `- ${currency}${amount.toFixed(2)}\n`;
        }
      } else {
        summary += `No spending recorded yet.\n`;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n```json\n' + JSON.stringify(stats, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}

function formatBookingCard(booking: BookingRecord, cancelled = false): string {
  const statusEmoji = cancelled ? '~~' : '';
  const statusEnd = cancelled ? '~~' : '';

  let card = `${statusEmoji}**${booking.venue_name}**${statusEnd}\n`;
  card += `- 🎾 ${booking.court_name}\n`;
  card += `- 📅 ${booking.date} | ${booking.start_time} - ${booking.end_time}\n`;
  card += `- 💰 ${booking.currency}${booking.price.toFixed(2)}\n`;

  if (booking.players.length > 0) {
    card += `- 👥 ${booking.players.join(', ')}\n`;
  }

  if (booking.notes) {
    card += `- 📝 ${booking.notes}\n`;
  }

  const links: string[] = [];
  if (booking.calendar_link && !cancelled) {
    links.push(formatCalendarLinkMarkdown(booking.calendar_link));
  }
  if (booking.booking_url && !cancelled) {
    links.push(formatBookingLinkMarkdown(booking.booking_url));
  }

  if (links.length > 0) {
    card += links.join(' | ') + '\n';
  }

  card += `\`ID: ${booking.id.substring(0, 8)}...\`\n\n`;

  return card;
}
