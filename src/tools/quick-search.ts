/**
 * quick_search MCP Tool
 *
 * One-word shortcuts for common searches: tonight, tomorrow, weekend, etc.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGamesWithFilters, getVenueDetails } from '../services/playtomic.js';
import { getWeatherForSlot, formatWeatherLine, formatPlayabilityStatus } from '../services/weather.js';
import { generateSlotCalendarLink, formatCalendarLinkMarkdown } from '../utils/calendar.js';
import { generateSlotBookingUrl, formatBookingLinkMarkdown } from '../utils/booking.js';
import { createSlotCardsResource } from '../utils/ui-resources.js';
import { getPreferences } from '../services/preferences.js';
import type { EnhancedTimeSlot, Coordinates, QuickSearchPreset } from '../types/index.js';

/**
 * Get date string for today
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string for tomorrow
 */
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get next Saturday and Sunday dates
 */
function getWeekendDates(): { saturday: string; sunday: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;

  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    saturday: saturday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0],
  };
}

/**
 * Get next week dates (Monday to Sunday)
 */
function getNextWeekDates(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;

  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilNextMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

/**
 * Get preset configuration
 */
function getPresetConfig(preset: QuickSearchPreset): {
  dates: string[];
  timeStart?: string;
  timeEnd?: string;
  sortBy: 'time' | 'price' | 'distance';
  description: string;
} {
  switch (preset) {
    case 'tonight':
      return {
        dates: [getTodayDate()],
        timeStart: '17:00',
        timeEnd: '23:59',
        sortBy: 'time',
        description: 'tonight (17:00-23:59)',
      };
    case 'tomorrow':
      return {
        dates: [getTomorrowDate()],
        timeStart: '09:00',
        timeEnd: '22:00',
        sortBy: 'time',
        description: `tomorrow (${getTomorrowDate()})`,
      };
    case 'weekend': {
      const { saturday, sunday } = getWeekendDates();
      return {
        dates: [saturday, sunday],
        sortBy: 'time',
        description: `this weekend (${saturday} & ${sunday})`,
      };
    }
    case 'next_week': {
      const { start, end } = getNextWeekDates();
      // Generate all dates in the week
      const dates: string[] = [];
      const current = new Date(start);
      const endDate = new Date(end);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return {
        dates,
        sortBy: 'time',
        description: `next week (${start} to ${end})`,
      };
    }
    case 'cheapest_today':
      return {
        dates: [getTodayDate()],
        sortBy: 'price',
        description: 'cheapest slots today',
      };
    default:
      return {
        dates: [getTodayDate()],
        sortBy: 'time',
        description: 'today',
      };
  }
}

export const quickSearchSchema = {
  preset: z
    .enum(['tonight', 'tomorrow', 'weekend', 'next_week', 'cheapest_today'])
    .describe('Quick search preset: tonight, tomorrow, weekend, next_week, or cheapest_today'),
  location: z
    .string()
    .optional()
    .describe('Location (uses default from preferences if not provided)'),
  max_distance_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum distance (default: 10km)'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(30)
    .optional()
    .default(15)
    .describe('Maximum results per date (default: 15)'),
};

export function registerQuickSearch(server: McpServer): void {
  server.tool(
    'quick_search',
    'Quick padel court search with presets: tonight (17:00+), tomorrow, weekend, next_week, or cheapest_today.',
    quickSearchSchema,
    async ({ preset, location, max_distance_km, max_results }) => {
      const maxDistanceKm = max_distance_km ?? 10;
      const maxResultCount = max_results ?? 15;

      // Get location from parameter or preferences
      let searchLocation = location;
      if (!searchLocation) {
        const prefs = await getPreferences();
        searchLocation = prefs.default_location;
      }

      if (!searchLocation) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Please provide a location or set a default location in your preferences.',
            },
          ],
        };
      }

      // Parse location
      const coords = await parseLocation(searchLocation);
      if (!coords) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Could not find location: "${searchLocation}". Please try a different address.`,
            },
          ],
        };
      }

      // Get preset configuration
      const config = getPresetConfig(preset);

      // Search across all dates in the preset
      const allSlots: EnhancedTimeSlot[] = [];

      for (const date of config.dates) {
        try {
          const slots = await findAvailableGamesWithFilters(coords, date, {
            preferredTimeStart: config.timeStart,
            preferredTimeEnd: config.timeEnd,
            maxDistanceKm,
            sortBy: config.sortBy,
          });

          // Enhance slots
          for (const slot of slots.slice(0, maxResultCount)) {
            let venueCoords: Coordinates | undefined;
            let venueAddress = '';

            try {
              const details = await getVenueDetails(slot.venue_id);
              if (details) {
                venueCoords = details.coordinates;
                venueAddress = `${details.address}, ${details.city}`;
              }
            } catch {
              // Continue without details
            }

            const bookingUrl = generateSlotBookingUrl({
              venueId: slot.venue_id,
              startTime: slot.start_time,
              platform: 'playtomic',
            });

            const calendarLink = generateSlotCalendarLink({
              venueName: slot.venue_name,
              venueAddress,
              courtName: slot.court_name,
              startTime: slot.start_time,
              endTime: slot.end_time,
              price: slot.price,
              currency: slot.currency,
              bookingUrl: bookingUrl ?? undefined,
            });

            const enhanced: EnhancedTimeSlot = {
              ...slot,
              booking_url: bookingUrl ?? undefined,
              calendar_link: calendarLink,
              venue_address: venueAddress,
              venue_coordinates: venueCoords,
            };

            // Get weather
            if (venueCoords) {
              try {
                const weather = await getWeatherForSlot(venueCoords, slot.start_time);
                if (weather) {
                  enhanced.weather = weather;
                }
              } catch {
                // Weather fetch failed
              }
            }

            allSlots.push(enhanced);
          }

          // Small delay between dates
          if (config.dates.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Error searching ${date}: ${error}`);
        }
      }

      if (allSlots.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No available courts found for ${config.description} near "${searchLocation}".\n\nTry:\n- A different preset\n- Expanding the search radius\n- A different location`,
            },
          ],
        };
      }

      // Sort final results
      if (config.sortBy === 'price') {
        allSlots.sort((a, b) => a.price - b.price);
      } else {
        allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
      }

      // Build summary
      let summary = `## 🎾 Quick Search: ${preset.toUpperCase()}\n\n`;
      summary += `📍 Near "${searchLocation}"\n`;
      summary += `🔍 ${config.description}\n`;
      summary += `📊 Found ${allSlots.length} slots\n\n`;

      // Group by date then venue
      const slotsByDate = new Map<string, EnhancedTimeSlot[]>();
      for (const slot of allSlots) {
        const date = slot.start_time.split('T')[0];
        const dateSlots = slotsByDate.get(date) ?? [];
        dateSlots.push(slot);
        slotsByDate.set(date, dateSlots);
      }

      for (const [date, dateSlots] of slotsByDate) {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        summary += `### 📅 ${dayName}, ${date}\n\n`;

        // Group by venue within date
        const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
        for (const slot of dateSlots) {
          const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
          venueSlots.push(slot);
          slotsByVenue.set(slot.venue_name, venueSlots);
        }

        for (const [venueName, venueSlots] of slotsByVenue) {
          summary += `**${venueName}**\n`;

          for (const slot of venueSlots.slice(0, 3)) {
            const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
            const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';

            summary += `- ${startTime}-${endTime} | ${slot.court_name} | ${slot.currency}${slot.price.toFixed(2)}`;
            if (slot.weather) {
              summary += ` | ${slot.weather.condition_emoji} ${slot.weather.temperature_c}°C`;
            }
            summary += '\n';
          }

          if (venueSlots.length > 3) {
            summary += `  ... and ${venueSlots.length - 3} more\n`;
          }
          summary += '\n';
        }
      }

      // Response
      const response = {
        preset,
        description: config.description,
        location: searchLocation,
        dates: config.dates,
        total_found: allSlots.length,
        slots: allSlots.slice(0, 20).map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          date: s.start_time.split('T')[0],
          time: s.start_time.split('T')[1]?.substring(0, 5),
          court: s.court_name,
          price: s.price,
          currency: s.currency,
          booking_url: s.booking_url,
        })),
      };

      // Create UI resource
      const uiResource = createSlotCardsResource(allSlots.slice(0, 20), {
        groupByVenue: true,
        maxSlotsPerVenue: 3,
        title: `🎾 Quick Search: ${preset}`,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
          uiResource,
        ],
      };
    }
  );
}
