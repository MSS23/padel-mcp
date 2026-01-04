/**
 * calendar_feed MCP Tool
 *
 * Generate an iCal (.ics) file from booking history.
 * Users can import this file into their calendar apps.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { getFilteredBookings } from '../services/bookings.js';
import { generateICalCalendar, generateDownloadableICalFile } from '../utils/ical.js';

export const calendarFeedSchema = {
  filter: z
    .enum(['upcoming', 'all'])
    .optional()
    .default('upcoming')
    .describe('Which bookings to include: upcoming or all (default: upcoming)'),
  save_to_file: z
    .boolean()
    .optional()
    .default(true)
    .describe('Save to file in ~/.padel-finder/ (default: true)'),
};

export function registerCalendarFeed(server: McpServer): void {
  server.tool(
    'generate_calendar_feed',
    'Generate an iCal (.ics) file from your booking history. Import this file into Google Calendar, Apple Calendar, Outlook, or any calendar app.',
    calendarFeedSchema,
    async ({ filter, save_to_file }) => {
      const filterType = filter ?? 'upcoming';
      const saveToFile = save_to_file ?? true;

      const bookings = await getFilteredBookings({
        filter: filterType === 'upcoming' ? 'upcoming' : 'all',
      });

      if (bookings.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `📭 No ${filterType} bookings to export. Use \`track_booking\` to record bookings first.`,
            },
          ],
        };
      }

      const { content, filename, mimeType } = generateDownloadableICalFile(bookings);

      let summary = `## 📅 Calendar Feed Generated\n\n`;
      summary += `**Bookings included:** ${bookings.length}\n`;
      summary += `**Filter:** ${filterType}\n\n`;

      if (saveToFile) {
        // Save to ~/.padel-finder/calendar.ics
        const baseDir = join(homedir(), '.padel-finder');
        const filePath = join(baseDir, 'calendar.ics');

        try {
          await mkdir(baseDir, { recursive: true });
          await writeFile(filePath, content, 'utf-8');

          summary += `### ✅ File Saved\n\n`;
          summary += `**Location:** \`${filePath}\`\n\n`;
          summary += `### How to Import\n\n`;
          summary += `**Google Calendar:**\n`;
          summary += `1. Open Google Calendar\n`;
          summary += `2. Click ⚙️ Settings → Import & export\n`;
          summary += `3. Select "Import" and upload the .ics file\n\n`;
          summary += `**Apple Calendar:**\n`;
          summary += `1. Open Finder and navigate to the file\n`;
          summary += `2. Double-click the .ics file\n`;
          summary += `3. Choose which calendar to add events to\n\n`;
          summary += `**Outlook:**\n`;
          summary += `1. Open Outlook and go to Calendar\n`;
          summary += `2. File → Open & Export → Import/Export\n`;
          summary += `3. Choose "Import an iCalendar (.ics) file"\n`;
        } catch (error) {
          summary += `### ⚠️ Could not save file\n\n`;
          summary += `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
          summary += `**iCal content below:**\n`;
        }
      }

      // Include preview of events
      summary += `\n### 📋 Events Preview\n\n`;
      for (const booking of bookings.slice(0, 5)) {
        summary += `- **${booking.venue_name}** - ${booking.date} at ${booking.start_time}\n`;
      }
      if (bookings.length > 5) {
        summary += `... and ${bookings.length - 5} more\n`;
      }

      // Include the iCal content for reference
      summary += `\n### 📄 iCal Content\n\n`;
      summary += `\`\`\`\n${content.substring(0, 1000)}${content.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`\n`;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary,
          },
        ],
      };
    }
  );
}
