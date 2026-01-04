/**
 * invite_to_game MCP Tool
 *
 * Generate shareable invite links and messages for a padel game.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateSlotBookingUrl } from '../utils/booking.js';
import { generateSlotCalendarLink } from '../utils/calendar.js';
import { friends } from '../services/friends.js';
import type { GameInvitation } from '../types/index.js';

export const generateInviteSchema = {
  venue_id: z
    .string()
    .describe('The venue ID'),
  venue_name: z
    .string()
    .describe('Name of the venue'),
  venue_address: z
    .string()
    .optional()
    .describe('Venue address (optional, for calendar event)'),
  court_name: z
    .string()
    .optional()
    .describe('Name of the court'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date (YYYY-MM-DD)'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('Start time (HH:mm)'),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('End time (HH:mm)'),
  price: z
    .number()
    .optional()
    .describe('Price per person or total'),
  currency: z
    .string()
    .optional()
    .default('EUR')
    .describe('Currency code'),
  friend_names: z
    .array(z.string())
    .optional()
    .describe('Names of friends to include in the message'),
  custom_message: z
    .string()
    .optional()
    .describe('Custom message to include'),
};

export function registerInvite(server: McpServer): void {
  server.tool(
    'generate_invite',
    'Generate a shareable invitation message with booking and calendar links for a padel game.',
    generateInviteSchema,
    async ({
      venue_id,
      venue_name,
      venue_address,
      court_name,
      date,
      start_time,
      end_time,
      price,
      currency,
      friend_names,
      custom_message,
    }) => {
      const currencyCode = currency ?? 'EUR';
      const endTimeStr = end_time ?? calculateEndTime(start_time, 90); // Default 90 min

      // Resolve friend names
      const invitees: string[] = [];
      if (friend_names && friend_names.length > 0) {
        for (const nameOrId of friend_names) {
          const friend = await friends.getFriend(nameOrId) ?? await friends.findFriendByName(nameOrId);
          if (friend) {
            invitees.push(friend.name);
          } else {
            invitees.push(nameOrId);
          }
        }
      }

      // Generate booking URL
      const bookingUrl = generateSlotBookingUrl({
        venueId: venue_id,
        startTime: `${date}T${start_time}:00`,
        platform: 'playtomic',
      }) ?? `https://playtomic.io`;

      // Generate calendar link
      const calendarLink = generateSlotCalendarLink({
        venueName: venue_name,
        venueAddress: venue_address,
        courtName: court_name,
        startTime: `${date}T${start_time}:00`,
        endTime: `${date}T${endTimeStr}:00`,
        price,
        currency: currencyCode,
        bookingUrl,
      });

      // Format date nicely
      const dateObj = new Date(date);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const formattedDate = `${dayNames[dateObj.getDay()]}, ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

      // Build share message
      let shareMessage = `🎾 Padel Game Invitation!\n\n`;
      shareMessage += `📍 ${venue_name}`;
      if (court_name) shareMessage += ` - ${court_name}`;
      shareMessage += `\n`;
      if (venue_address) shareMessage += `📌 ${venue_address}\n`;
      shareMessage += `📅 ${formattedDate}\n`;
      shareMessage += `🕐 ${start_time} - ${endTimeStr}\n`;

      if (price) {
        shareMessage += `💰 ${currencyCode}${price.toFixed(2)}\n`;
      }

      if (custom_message) {
        shareMessage += `\n💬 ${custom_message}\n`;
      }

      shareMessage += `\n🔗 Book your spot: ${bookingUrl}\n`;
      shareMessage += `📅 Add to calendar: ${calendarLink}\n`;

      if (invitees.length > 0) {
        shareMessage += `\n👥 Invited: ${invitees.join(', ')}\n`;
      }

      shareMessage += `\nSee you on the court! 🏆`;

      // Build WhatsApp-friendly message (shorter)
      let whatsappMessage = `🎾 *Padel at ${venue_name}*\n`;
      whatsappMessage += `📅 ${formattedDate} at ${start_time}\n`;
      if (price) whatsappMessage += `💰 ${currencyCode}${price.toFixed(2)}\n`;
      whatsappMessage += `\n${bookingUrl}`;

      // Build invitation object
      const invitation: GameInvitation = {
        invite_link: bookingUrl,
        share_message: shareMessage,
        calendar_link: calendarLink,
        invitees,
      };

      let summary = `## 📨 Invitation Generated!\n\n`;
      summary += `### Share Message\n\n`;
      summary += `\`\`\`\n${shareMessage}\n\`\`\`\n\n`;
      summary += `### WhatsApp Version\n\n`;
      summary += `\`\`\`\n${whatsappMessage}\n\`\`\`\n\n`;
      summary += `### Quick Links\n\n`;
      summary += `- [🎾 Book on Playtomic](${bookingUrl})\n`;
      summary += `- [📅 Add to Calendar](${calendarLink})\n\n`;

      if (invitees.length > 0) {
        summary += `### Invitees\n\n`;
        for (const invitee of invitees) {
          summary += `- ${invitee}\n`;
        }
        summary += '\n';
      }

      summary += `**Tip:** Copy the share message above and send it via WhatsApp, Telegram, or any messaging app!`;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(invitation, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}

/**
 * Calculate end time from start time and duration
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}
