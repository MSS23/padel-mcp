/**
 * search_with_filters MCP Tool
 *
 * Advanced search with court type, surface, price, and duration filters.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findAvailableGamesWithFilters, getVenueDetails } from '../services/playtomic.js';
import { getWeatherForSlot, formatWeatherLine, formatPlayabilityStatus } from '../services/weather.js';
import { generateSlotCalendarLink, formatCalendarLinkMarkdown } from '../utils/calendar.js';
import { generateSlotBookingUrl, formatBookingLinkMarkdown } from '../utils/booking.js';
import { createSlotCardsResource } from '../utils/ui-resources.js';
import type { EnhancedTimeSlot, Coordinates, SearchFilters } from '../types/index.js';

export const searchWithFiltersSchema = {
  location: z
    .string()
    .describe('Your location (address, city name, or coordinates like "51.5074,-0.1278")'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to find games (YYYY-MM-DD format)'),
  time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Earliest start time (HH:mm format, e.g., "18:00")'),
  time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Latest start time (HH:mm format, e.g., "21:00")'),
  max_distance_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum distance to search (1-50km, default: 10)'),
  court_type: z
    .enum(['indoor', 'outdoor', 'any'])
    .optional()
    .default('any')
    .describe('Court type filter: indoor, outdoor, or any'),
  surface: z
    .enum(['artificial_grass', 'cement', 'clay', 'any'])
    .optional()
    .default('any')
    .describe('Court surface: artificial_grass, cement, clay, or any'),
  min_duration_minutes: z
    .number()
    .int()
    .min(30)
    .max(180)
    .optional()
    .describe('Minimum slot duration in minutes'),
  max_price: z
    .number()
    .min(0)
    .optional()
    .describe('Maximum price per slot'),
  has_lighting: z
    .boolean()
    .optional()
    .describe('Only show courts with lighting (for evening games)'),
  sort_by: z
    .enum(['time', 'price', 'distance'])
    .optional()
    .default('time')
    .describe('Sort results by: time, price, or distance'),
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
    .describe('Include weather information (default: true)'),
};

export function registerSearchWithFilters(server: McpServer): void {
  server.tool(
    'search_with_filters',
    'Advanced padel court search with filters for court type (indoor/outdoor), surface, price, duration, and lighting. Returns slots with weather info and booking links.',
    searchWithFiltersSchema,
    async ({
      location,
      date,
      time_start,
      time_end,
      max_distance_km,
      court_type,
      surface,
      min_duration_minutes,
      max_price,
      has_lighting,
      sort_by,
      max_results,
      include_weather,
    }) => {
      const maxDistanceKm = max_distance_km ?? 10;
      const maxResultCount = max_results ?? 20;
      const showWeather = include_weather ?? true;
      const sortBy = sort_by ?? 'time';

      // Parse location
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

      // Build filters
      const filters: SearchFilters = {};
      if (court_type && court_type !== 'any') {
        filters.court_type = court_type;
      }
      if (surface && surface !== 'any') {
        filters.surface = surface;
      }
      if (min_duration_minutes) {
        filters.min_duration_minutes = min_duration_minutes;
      }
      if (max_price) {
        filters.max_price = max_price;
      }
      if (has_lighting) {
        filters.has_lighting = has_lighting;
      }

      // Find slots with filters
      const slots = await findAvailableGamesWithFilters(coords, date, {
        preferredTimeStart: time_start,
        preferredTimeEnd: time_end,
        maxDistanceKm,
        filters,
        sortBy,
      });

      const limitedSlots = slots.slice(0, maxResultCount);

      if (limitedSlots.length === 0) {
        const filterDescriptions: string[] = [];
        if (court_type && court_type !== 'any') filterDescriptions.push(court_type);
        if (surface && surface !== 'any') filterDescriptions.push(surface);
        if (max_price) filterDescriptions.push(`max ${max_price}€`);
        if (min_duration_minutes) filterDescriptions.push(`${min_duration_minutes}+ min`);

        const filterText = filterDescriptions.length > 0
          ? ` with filters: ${filterDescriptions.join(', ')}`
          : '';

        return {
          content: [
            {
              type: 'text' as const,
              text: `No available padel courts found near "${location}" on ${date}${filterText}.\n\nTry:\n- Expanding the search radius\n- Removing some filters\n- Looking at a different date`,
            },
          ],
        };
      }

      // Enhance slots with weather and links
      const enhancedSlots: EnhancedTimeSlot[] = [];

      for (const slot of limitedSlots) {
        let venueCoords: Coordinates | undefined;
        let venueAddress = '';
        let venuePhone: string | undefined;

        // Get venue details
        try {
          const details = await getVenueDetails(slot.venue_id);
          if (details) {
            venueCoords = details.coordinates;
            venueAddress = `${details.address}, ${details.city}`;
            venuePhone = details.phone;
          }
        } catch {
          // Continue without venue details
        }

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
          venue_coordinates: venueCoords,
          venue_phone: venuePhone,
        };

        // Get weather if requested
        if (showWeather && venueCoords) {
          try {
            const weather = await getWeatherForSlot(venueCoords, slot.start_time);
            if (weather) {
              enhanced.weather = weather;
            }
          } catch {
            // Weather fetch failed
          }
        }

        enhancedSlots.push(enhanced);
      }

      // Build summary
      const filterDescriptions: string[] = [];
      if (court_type && court_type !== 'any') filterDescriptions.push(`🏠 ${court_type}`);
      if (surface && surface !== 'any') filterDescriptions.push(`🌿 ${surface}`);
      if (max_price) filterDescriptions.push(`💰 max ${max_price}€`);
      if (min_duration_minutes) filterDescriptions.push(`⏱️ ${min_duration_minutes}+ min`);

      const timeRange = time_start || time_end
        ? ` (${time_start ?? '00:00'} - ${time_end ?? '23:59'})`
        : '';

      let summary = `## 🎾 Found ${enhancedSlots.length} Available Slot(s)\n\n`;
      summary += `📍 Near "${location}" on ${date}${timeRange}\n`;
      if (filterDescriptions.length > 0) {
        summary += `🔍 Filters: ${filterDescriptions.join(' | ')}\n`;
      }
      summary += `📊 Sorted by: ${sortBy}\n\n`;

      // Group by venue
      const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
      for (const slot of enhancedSlots) {
        const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
        venueSlots.push(slot);
        slotsByVenue.set(slot.venue_name, venueSlots);
      }

      for (const [venueName, venueSlots] of slotsByVenue) {
        const firstSlot = venueSlots[0];
        const distanceInfo = (firstSlot as any).distance_km
          ? ` (${(firstSlot as any).distance_km}km away)`
          : '';

        summary += `### ${venueName}${distanceInfo}\n`;

        if (firstSlot.venue_address) {
          summary += `📍 ${firstSlot.venue_address}\n`;
        }
        summary += '\n';

        for (const slot of venueSlots.slice(0, 5)) {
          const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
          const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';
          const courtType = (slot as any).court_type ? ` [${(slot as any).court_type}]` : '';

          summary += `**${startTime} - ${endTime}** | ${slot.court_name}${courtType} | ${slot.currency}${slot.price.toFixed(2)}\n`;

          if (slot.weather) {
            summary += `${formatWeatherLine(slot.weather)}\n`;
            summary += `${formatPlayabilityStatus(slot.weather)}\n`;
          }

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

      // Build response
      const response = {
        search: {
          location,
          date,
          time_range: { start: time_start ?? null, end: time_end ?? null },
          max_distance_km: maxDistanceKm,
          filters: {
            court_type: court_type ?? 'any',
            surface: surface ?? 'any',
            min_duration_minutes: min_duration_minutes ?? null,
            max_price: max_price ?? null,
            has_lighting: has_lighting ?? false,
          },
          sort_by: sortBy,
        },
        results: enhancedSlots.map((s) => ({
          venue: s.venue_name,
          venue_id: s.venue_id,
          venue_address: s.venue_address,
          court: s.court_name,
          court_type: (s as any).court_type ?? null,
          surface: (s as any).surface ?? null,
          start: s.start_time,
          end: s.end_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          currency: s.currency,
          distance_km: (s as any).distance_km ?? null,
          booking_url: s.booking_url,
          calendar_link: s.calendar_link,
          weather: s.weather ?? null,
        })),
        total_found: enhancedSlots.length,
      };

      // Create UI resource
      const uiResource = createSlotCardsResource(enhancedSlots, {
        groupByVenue: true,
        maxSlotsPerVenue: 5,
        title: `🎾 ${enhancedSlots.length} Filtered Results - ${date}`,
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
