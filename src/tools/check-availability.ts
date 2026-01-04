/**
 * check_availability MCP Tool
 *
 * Check available time slots at a specific venue.
 * Enhanced with weather info and booking/calendar links for chat UI.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkVenueAvailability, getVenueDetails } from '../services/playtomic.js';
import { getWeatherForSlot, formatWeatherLine, formatPlayabilityStatus } from '../services/weather.js';
import { generateSlotCalendarLink, formatCalendarLinkMarkdown } from '../utils/calendar.js';
import { generateSlotBookingUrl, formatBookingLinkMarkdown } from '../utils/booking.js';
import { createSlotCardsResource, createUIToolResponse } from '../utils/ui-resources.js';
import type { EnhancedTimeSlot, Coordinates } from '../types/index.js';

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
  include_weather: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include weather information for each slot (default: true)'),
};

export function registerCheckAvailability(server: McpServer): void {
  server.tool(
    'check_availability',
    'Check available padel court time slots at a specific venue. Returns slots with weather info, booking links, and calendar links.',
    checkAvailabilitySchema,
    async ({ venue_id, venue_name, date, start_time, end_time, include_weather }) => {
      const showWeather = include_weather ?? true;

      // Get venue details for coordinates and address
      let venueCoords: Coordinates | undefined;
      let venueAddress = '';
      let venuePhone: string | undefined;
      let venueWebsite: string | undefined;

      try {
        const details = await getVenueDetails(venue_id);
        if (details) {
          venueCoords = details.coordinates;
          venueAddress = `${details.address}, ${details.city}`;
          venuePhone = details.phone;
          venueWebsite = details.website;
          if (!venue_name) {
            venue_name = details.name;
          }
        }
      } catch {
        // Continue without venue details
      }

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

      // Enhance slots with weather and links
      const enhancedSlots: EnhancedTimeSlot[] = [];

      for (const slot of filteredSlots) {
        // Generate booking URL
        const bookingUrl = generateSlotBookingUrl({
          venueId: venue_id,
          startTime: slot.start_time,
          platform: 'playtomic',
        });

        // Generate calendar link
        const calendarLink = generateSlotCalendarLink({
          venueName: venue_name ?? venue_id,
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
          venue_phone: venuePhone,
          venue_website: venueWebsite,
        };

        // Get weather if requested and we have coordinates
        if (showWeather && venueCoords) {
          try {
            const weather = await getWeatherForSlot(venueCoords, slot.start_time);
            if (weather) {
              enhanced.weather = weather;
            }
          } catch {
            // Weather fetch failed, continue without it
          }
        }

        enhancedSlots.push(enhanced);
      }

      // Group slots by court
      const slotsByCourt = new Map<string, EnhancedTimeSlot[]>();
      for (const slot of enhancedSlots) {
        const courtSlots = slotsByCourt.get(slot.court_name) ?? [];
        courtSlots.push(slot);
        slotsByCourt.set(slot.court_name, courtSlots);
      }

      // Format enhanced response
      let summary = `## 🎾 Availability at ${venue_name ?? venue_id}\n\n`;
      summary += `📅 ${date}\n`;
      if (venueAddress) {
        summary += `📍 ${venueAddress}\n`;
      }
      if (venuePhone) {
        summary += `📞 ${venuePhone}\n`;
      }
      summary += '\n';

      for (const [courtName, courtSlots] of slotsByCourt) {
        summary += `### ${courtName}\n\n`;

        for (const slot of courtSlots) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';

          summary += `**${startTime} - ${endTime}** (${slot.duration_minutes}min) | ${slot.currency}${slot.price.toFixed(2)}\n`;

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
      }

      const response = {
        venue_id,
        venue_name: venue_name ?? venue_id,
        venue_address: venueAddress || undefined,
        venue_phone: venuePhone,
        date,
        slots: enhancedSlots.map((s) => ({
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
        total_slots: enhancedSlots.length,
      };

      // Create interactive UI resource for chat clients
      const uiResource = createSlotCardsResource(enhancedSlots, {
        groupByVenue: false,
        title: `🎾 ${venue_name ?? venue_id} - ${date}`,
      });

      // Return with Goose MCP-UI metadata for proper rendering
      return createUIToolResponse({
        textContent: summary + '\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
        uiResource,
        uiName: `${venue_name ?? 'Venue'} Availability`,
      });
    }
  );
}
