/**
 * find_available_games MCP Tool
 *
 * Main tool - finds the nearest available padel game based on location and time.
 * Enhanced with weather info and booking/calendar links for chat UI.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGames, findNearbyVenues, getVenueDetails } from '../services/playtomic.js';
import { getWeatherForSlot, formatWeatherLine, formatPlayabilityStatus } from '../services/weather.js';
import { generateSlotCalendarLink, formatCalendarLinkMarkdown } from '../utils/calendar.js';
import { generateSlotBookingUrl, formatBookingLinkMarkdown } from '../utils/booking.js';
import { createSlotCardsResource, createUIToolResponse } from '../utils/ui-resources.js';
import type { EnhancedTimeSlot, Coordinates } from '../types/index.js';

export const findAvailableGamesSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates like "51.5074,-0.1278")'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to find games (YYYY-MM-DD format)'),
  preferred_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Preferred earliest start time (HH:mm format, e.g., "18:00")'),
  preferred_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Preferred latest start time (HH:mm format, e.g., "21:00")'),
  max_distance_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum distance to search (1-50km, default: 10)'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Maximum number of results (default: 20)'),
  include_weather: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include weather information for each slot (default: true)'),
};

export function registerFindAvailableGames(server: McpServer): void {
  server.tool(
    'find_available_games',
    'Find the nearest available padel games based on your location and preferred time. Returns slots with weather info, booking links, and calendar links.',
    findAvailableGamesSchema,
    async ({
      location,
      date,
      preferred_time_start,
      preferred_time_end,
      max_distance_km,
      max_results,
      include_weather,
    }) => {
      const maxDistanceKm = max_distance_km ?? 10;
      const maxResultCount = max_results ?? 20;
      const showWeather = include_weather ?? true;

      // Parse the location
      const coords = await parseLocation(location);

      if (!coords) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Could not find location: "${location}". Please try a different address or use coordinates.`,
            },
          ],
        };
      }

      // Find available games
      const slots = await findAvailableGames(
        coords,
        date,
        preferred_time_start,
        preferred_time_end,
        maxDistanceKm
      );

      const limitedSlots = slots.slice(0, maxResultCount);

      if (limitedSlots.length === 0) {
        const timeFilter =
          preferred_time_start || preferred_time_end
            ? ` between ${preferred_time_start ?? '00:00'} and ${preferred_time_end ?? '23:59'}`
            : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `No available padel courts found near "${location}" on ${date}${timeFilter}.\n\nTry:\n- Expanding the search radius\n- Looking at a different date\n- Adjusting the time range`,
            },
          ],
        };
      }

      // Get venue details for phone/website and coordinates for weather
      const venueIds = [...new Set(limitedSlots.map((s) => s.venue_id))];
      const venueDetailsMap = new Map<string, { coords: Coordinates; address: string; phone?: string; website?: string }>();

      // Get nearby venues for coordinates
      const nearbyVenues = await findNearbyVenues(coords, maxDistanceKm, 20);
      for (const venue of nearbyVenues) {
        venueDetailsMap.set(venue.id, {
          coords: venue.coordinates,
          address: `${venue.address}, ${venue.city}`,
          phone: undefined,
          website: undefined,
        });
      }

      // Try to get detailed info for each venue (cached)
      for (const venueId of venueIds) {
        try {
          const details = await getVenueDetails(venueId);
          if (details) {
            venueDetailsMap.set(venueId, {
              coords: details.coordinates,
              address: `${details.address}, ${details.city}`,
              phone: details.phone,
              website: details.website,
            });
          }
        } catch {
          // Use basic info if detailed fetch fails
        }
      }

      // Enhance slots with weather and links
      const enhancedSlots: EnhancedTimeSlot[] = [];

      for (const slot of limitedSlots) {
        const venueInfo = venueDetailsMap.get(slot.venue_id);
        const venueAddress = venueInfo?.address ?? '';

        // Generate booking URL
        const bookingUrl = generateSlotBookingUrl({
          venueId: slot.venue_id,
          startTime: slot.start_time,
          platform: 'playtomic',
        });

        // Generate calendar link
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
          venue_coordinates: venueInfo?.coords,
          venue_phone: venueInfo?.phone,
          venue_website: venueInfo?.website,
        };

        // Get weather if requested and we have coordinates
        if (showWeather && venueInfo?.coords) {
          try {
            const weather = await getWeatherForSlot(venueInfo.coords, slot.start_time);
            if (weather) {
              enhanced.weather = weather;
            }
          } catch {
            // Weather fetch failed, continue without it
          }
        }

        enhancedSlots.push(enhanced);
      }

      // Group by venue for better readability
      const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
      for (const slot of enhancedSlots) {
        const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
        venueSlots.push(slot);
        slotsByVenue.set(slot.venue_name, venueSlots);
      }

      // Format enhanced summary with weather and links
      const timeRange =
        preferred_time_start || preferred_time_end
          ? ` (${preferred_time_start ?? '00:00'} - ${preferred_time_end ?? '23:59'})`
          : '';

      let summary = `## 🎾 Found ${enhancedSlots.length} Available Slot(s)\n\n`;
      summary += `📍 Near "${location}" on ${date}${timeRange}\n\n`;

      for (const [venueName, venueSlots] of slotsByVenue) {
        const firstSlot = venueSlots[0];
        const distanceInfo = (firstSlot as any).distance_km
          ? ` (${(firstSlot as any).distance_km}km away)`
          : '';

        summary += `### ${venueName}${distanceInfo}\n`;

        if (firstSlot.venue_address) {
          summary += `📍 ${firstSlot.venue_address}\n`;
        }
        if (firstSlot.venue_phone) {
          summary += `📞 ${firstSlot.venue_phone}\n`;
        }
        summary += '\n';

        // Show up to 5 slots per venue
        for (const slot of venueSlots.slice(0, 5)) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';

          summary += `**${startTime} - ${endTime}** | ${slot.court_name} | ${slot.currency}${slot.price.toFixed(2)}\n`;

          // Add weather line if available
          if (slot.weather) {
            summary += `${formatWeatherLine(slot.weather)}\n`;
            summary += `${formatPlayabilityStatus(slot.weather)}\n`;
          }

          // Add action links
          const links: string[] = [];
          if (slot.calendar_link) {
            links.push(formatCalendarLinkMarkdown(slot.calendar_link));
          }
          if (slot.booking_url) {
            links.push(formatBookingLinkMarkdown(slot.booking_url));
          }
          if (links.length > 0) {
            summary += links.join(' | ') + '\n';
          }

          summary += '\n';
        }

        if (venueSlots.length > 5) {
          summary += `... and ${venueSlots.length - 5} more slots at this venue\n\n`;
        }

        summary += '---\n\n';
      }

      // Build response JSON
      const response = {
        search: {
          location,
          date,
          time_range: {
            start: preferred_time_start ?? null,
            end: preferred_time_end ?? null,
          },
          max_distance_km: maxDistanceKm,
        },
        results: enhancedSlots.map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          venue_address: s.venue_address,
          court: s.court_name,
          start: s.start_time,
          end: s.end_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          currency: s.currency,
          booking_url: s.booking_url,
          calendar_link: s.calendar_link,
          weather: s.weather
            ? {
                temperature_c: s.weather.temperature_c,
                feels_like_c: s.weather.feels_like_c,
                condition: s.weather.condition,
                condition_emoji: s.weather.condition_emoji,
                precipitation_chance: s.weather.precipitation_chance,
                wind_speed_kmh: s.weather.wind_speed_kmh,
                is_playable: s.weather.is_playable,
                playability_note: s.weather.playability_note,
              }
            : null,
        })),
        total_found: enhancedSlots.length,
      };

      // Create interactive UI resource for chat clients
      const uiResource = createSlotCardsResource(enhancedSlots, {
        groupByVenue: true,
        maxSlotsPerVenue: 5,
        title: `🎾 ${enhancedSlots.length} Available Slots - ${date}`,
      });

      // Return with Goose MCP-UI metadata for proper rendering
      return createUIToolResponse({
        textContent: summary + '\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
        uiResource,
        uiName: 'Available Padel Courts',
      });
    }
  );
}
