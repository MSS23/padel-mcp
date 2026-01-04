/**
 * Favorites MCP Tools
 *
 * Save, list, and quick-check favorite venues.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { preferences } from '../services/preferences.js';
import { checkVenueAvailability, getVenueDetails } from '../services/playtomic.js';

export const saveFavoriteSchema = {
  venue_id: z.string().describe('The venue ID to save'),
  venue_name: z.string().describe('The venue name'),
  nickname: z.string().optional().describe('Optional nickname for quick reference'),
};

export const removeFavoriteSchema = {
  venue_id: z.string().describe('The venue ID to remove'),
};

export const listFavoritesSchema = {};

export const quickCheckSchema = {
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Date to check (defaults to today)'),
  time_preference: z
    .string()
    .optional()
    .describe('Time preference: "morning" (06-12), "afternoon" (12-18), "evening" (18-23), or "HH:mm-HH:mm"'),
};

function parseTimePreference(pref?: string): { start?: string; end?: string } {
  if (!pref) return {};

  const presets: Record<string, { start: string; end: string }> = {
    morning: { start: '06:00', end: '12:00' },
    afternoon: { start: '12:00', end: '18:00' },
    evening: { start: '18:00', end: '23:00' },
  };

  if (presets[pref.toLowerCase()]) {
    return presets[pref.toLowerCase()];
  }

  // Try to parse "HH:mm-HH:mm" format
  const match = pref.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (match) {
    return { start: match[1], end: match[2] };
  }

  return {};
}

export function registerFavorites(server: McpServer): void {
  // Save favorite
  server.tool(
    'save_favorite_venue',
    'Save a venue to your favorites for quick access. You can optionally give it a nickname.',
    saveFavoriteSchema,
    async ({ venue_id, venue_name, nickname }) => {
      const favorite = await preferences.addFavorite({
        venue_id,
        venue_name,
        nickname,
      });

      const favorites = await preferences.getFavorites();

      return {
        content: [
          {
            type: 'text' as const,
            text: `⭐ Saved **${venue_name}**${nickname ? ` as "${nickname}"` : ''} to favorites!\n\nYou now have ${favorites.length} favorite venue(s).`,
          },
        ],
      };
    }
  );

  // Remove favorite
  server.tool(
    'remove_favorite_venue',
    'Remove a venue from your favorites.',
    removeFavoriteSchema,
    async ({ venue_id }) => {
      const removed = await preferences.removeFavorite(venue_id);

      if (!removed) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Venue ${venue_id} was not in your favorites.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Removed venue from favorites.`,
          },
        ],
      };
    }
  );

  // List favorites
  server.tool(
    'list_favorite_venues',
    'List all your saved favorite venues.',
    listFavoritesSchema,
    async () => {
      const favorites = await preferences.getFavorites();

      if (favorites.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'You have no favorite venues saved yet.\n\nUse `save_favorite_venue` to add venues to your favorites!',
            },
          ],
        };
      }

      let summary = `**Your Favorite Venues (${favorites.length}):**\n\n`;

      for (const fav of favorites) {
        const displayName = fav.nickname ? `${fav.nickname} (${fav.venue_name})` : fav.venue_name;
        summary += `⭐ **${displayName}**\n   ID: ${fav.venue_id}\n   Added: ${new Date(fav.added_at).toLocaleDateString()}\n\n`;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '```json\n' + JSON.stringify(favorites, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // Quick check
  server.tool(
    'quick_book_check',
    'Quick check: See availability at all your favorite venues for a specific time. Perfect for "Can I play tonight?"',
    quickCheckSchema,
    async ({ date, time_preference }) => {
      const favorites = await preferences.getFavorites();

      if (favorites.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'You have no favorite venues. Add some with `save_favorite_venue` first!',
            },
          ],
        };
      }

      // Default to today
      const checkDate = date ?? new Date().toISOString().split('T')[0];
      const timeRange = parseTimePreference(time_preference);

      let summary = `**Quick Check for ${checkDate}**`;
      if (time_preference) {
        summary += ` (${time_preference})`;
      }
      summary += `:\n\n`;

      const results: Array<{
        venue_name: string;
        venue_id: string;
        available_slots: number;
        earliest?: string;
        cheapest?: { time: string; price: number; currency: string };
      }> = [];

      for (const fav of favorites) {
        try {
          let slots = await checkVenueAvailability(fav.venue_id, checkDate, fav.venue_name);

          // Filter by time preference
          if (timeRange.start || timeRange.end) {
            slots = slots.filter((slot) => {
              const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
              if (timeRange.start && slotTime < timeRange.start) return false;
              if (timeRange.end && slotTime > timeRange.end) return false;
              return true;
            });
          }

          const displayName = fav.nickname ?? fav.venue_name;

          if (slots.length === 0) {
            summary += `❌ **${displayName}**: No availability\n`;
            results.push({
              venue_name: displayName,
              venue_id: fav.venue_id,
              available_slots: 0,
            });
          } else {
            const earliest = slots[0].start_time.split('T')[1]?.substring(0, 5) ?? '';
            const cheapest = slots.reduce((min, s) => (s.price < min.price ? s : min), slots[0]);
            const cheapestTime = cheapest.start_time.split('T')[1]?.substring(0, 5) ?? '';

            summary += `✅ **${displayName}**: ${slots.length} slot(s) available\n`;
            summary += `   First: ${earliest} | Cheapest: ${cheapestTime} (${cheapest.currency} ${cheapest.price.toFixed(2)})\n`;

            results.push({
              venue_name: displayName,
              venue_id: fav.venue_id,
              available_slots: slots.length,
              earliest,
              cheapest: {
                time: cheapestTime,
                price: cheapest.price,
                currency: cheapest.currency,
              },
            });
          }

          // Small delay between venues
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          const displayName = fav.nickname ?? fav.venue_name;
          summary += `⚠️ **${displayName}**: Error checking availability\n`;
        }
      }

      const response = {
        date: checkDate,
        time_preference: time_preference ?? 'all day',
        venues_checked: favorites.length,
        results,
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
