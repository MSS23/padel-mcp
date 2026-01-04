/**
 * weekly_availability MCP Tool
 *
 * View availability across multiple days at once.
 * Enhanced with daily weather forecasts for planning.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkVenueAvailability, findNearbyVenues, getVenueDetails } from '../services/playtomic.js';
import { parseLocation } from '../services/geocoding.js';
import { getDailyWeatherSummary } from '../services/weather.js';
import type { DayAvailability, EnhancedDayAvailability, Coordinates } from '../types/index.js';

export const weeklyAvailabilitySchema = {
  venue_id: z.string().optional().describe('Specific venue ID to check'),
  location: z.string().optional().describe('Or search by location'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date (YYYY-MM-DD format)'),
  num_days: z
    .number()
    .int()
    .min(1)
    .max(7)
    .optional()
    .default(7)
    .describe('Number of days to check (1-7, default: 7)'),
  time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Filter by time start (HH:mm)'),
  time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('Filter by time end (HH:mm)'),
  include_weather: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include weather forecast for each day (default: true)'),
};

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function registerWeeklyAvailability(server: McpServer): void {
  server.tool(
    'get_weekly_availability',
    'View padel court availability across multiple days (up to a week). Includes weather forecast for planning.',
    weeklyAvailabilitySchema,
    async ({ venue_id, location, start_date, num_days, time_start, time_end, include_weather }) => {
      const days = num_days ?? 7;
      const showWeather = include_weather ?? true;

      // Need either venue_id or location
      if (!venue_id && !location) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Please provide either a venue_id or location.',
            },
          ],
        };
      }

      let venueId = venue_id;
      let venueName = venue_id ?? 'Unknown';
      let venueCoords: Coordinates | undefined;
      let venueAddress: string | undefined;

      // If location provided, find the nearest venue
      if (!venue_id && location) {
        const coords = await parseLocation(location);
        if (!coords) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Could not find location: "${location}".`,
              },
            ],
          };
        }

        const venues = await findNearbyVenues(coords, 10, 1);
        if (venues.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No venues found near "${location}".`,
              },
            ],
          };
        }

        venueId = venues[0].id;
        venueName = venues[0].name;
        venueCoords = venues[0].coordinates;
        venueAddress = `${venues[0].address}, ${venues[0].city}`;
      }

      // Get venue details for coordinates if we have venue_id
      if (venueId && !venueCoords) {
        try {
          const details = await getVenueDetails(venueId);
          if (details) {
            venueCoords = details.coordinates;
            venueAddress = `${details.address}, ${details.city}`;
            if (venue_id && !venueName) {
              venueName = details.name;
            }
          }
        } catch {
          // Continue without coordinates
        }
      }

      const weekData: EnhancedDayAvailability[] = [];

      for (let i = 0; i < days; i++) {
        const date = addDays(start_date, i);

        try {
          let slots = await checkVenueAvailability(venueId!, date, venueName);

          // Filter by time if specified
          if (time_start || time_end) {
            slots = slots.filter((slot) => {
              const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
              if (time_start && slotTime < time_start) return false;
              if (time_end && slotTime > time_end) return false;
              return true;
            });
          }

          const dayAvail: EnhancedDayAvailability = {
            date,
            day_name: getDayName(date),
            total_slots: slots.length,
          };

          if (slots.length > 0) {
            dayAvail.earliest_slot = slots[0].start_time.split('T')[1]?.substring(0, 5);
            dayAvail.latest_slot = slots[slots.length - 1].start_time.split('T')[1]?.substring(0, 5);

            const prices = slots.map((s) => s.price);
            dayAvail.price_range = {
              min: Math.min(...prices),
              max: Math.max(...prices),
              currency: slots[0].currency,
            };
          }

          // Get weather for the day
          if (showWeather && venueCoords) {
            try {
              const weather = await getDailyWeatherSummary(venueCoords, date);
              if (weather) {
                dayAvail.weather = weather;
              }
            } catch {
              // Weather fetch failed, continue without it
            }
          }

          weekData.push(dayAvail);

          // Small delay between days
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          weekData.push({
            date,
            day_name: getDayName(date),
            total_slots: 0,
          });
        }
      }

      // Build enhanced calendar view
      let summary = `## 📅 Weekly Availability: ${venueName}\n\n`;
      if (venueAddress) {
        summary += `📍 ${venueAddress}\n\n`;
      }

      // Header with weather column if weather data is available
      const hasWeather = weekData.some((d) => d.weather);
      if (hasWeather) {
        summary += `| Day | Date | Weather | Slots | Earliest | Latest | Price Range |\n`;
        summary += `|-----|------|---------|-------|----------|--------|-------------|\n`;
      } else {
        summary += `| Day | Date | Slots | Earliest | Latest | Price Range |\n`;
        summary += `|-----|------|-------|----------|--------|-------------|\n`;
      }

      for (const day of weekData) {
        const slotsInfo = day.total_slots > 0 ? `${day.total_slots}` : '-';
        const earliest = day.earliest_slot ?? '-';
        const latest = day.latest_slot ?? '-';
        const priceRange = day.price_range
          ? `${day.price_range.currency}${day.price_range.min.toFixed(0)}-${day.price_range.max.toFixed(0)}`
          : '-';

        if (hasWeather) {
          const weatherInfo = day.weather ? `${day.weather.emoji} ${day.weather.temp_high}°C` : '-';
          summary += `| ${day.day_name} | ${day.date} | ${weatherInfo} | ${slotsInfo} | ${earliest} | ${latest} | ${priceRange} |\n`;
        } else {
          summary += `| ${day.day_name} | ${day.date} | ${slotsInfo} | ${earliest} | ${latest} | ${priceRange} |\n`;
        }
      }

      const totalSlots = weekData.reduce((sum, d) => sum + d.total_slots, 0);
      const daysWithAvailability = weekData.filter((d) => d.total_slots > 0).length;

      summary += `\n**Summary:** ${totalSlots} total slots across ${daysWithAvailability}/${days} days\n`;

      // Add weather tips if we have weather data
      if (hasWeather) {
        const rainyDays = weekData.filter(
          (d) => d.weather && (d.weather.condition.toLowerCase().includes('rain') || d.weather.emoji.includes('🌧'))
        );
        const bestDays = weekData.filter(
          (d) => d.weather && d.total_slots > 0 && (d.weather.emoji === '☀️' || d.weather.emoji === '🌤️')
        );

        if (bestDays.length > 0) {
          summary += `\n💡 **Best weather days:** ${bestDays.map((d) => `${d.day_name} (${d.weather!.emoji})`).join(', ')}\n`;
        }
        if (rainyDays.length > 0) {
          summary += `⚠️ **Possible rain:** ${rainyDays.map((d) => d.day_name).join(', ')} - consider indoor courts\n`;
        }
      }

      const response = {
        venue_id: venueId,
        venue_name: venueName,
        venue_address: venueAddress,
        period: {
          start: start_date,
          end: addDays(start_date, days - 1),
          days,
        },
        time_filter: time_start || time_end ? { start: time_start, end: time_end } : null,
        daily_availability: weekData.map((d) => ({
          date: d.date,
          day_name: d.day_name,
          total_slots: d.total_slots,
          earliest_slot: d.earliest_slot,
          latest_slot: d.latest_slot,
          price_range: d.price_range,
          weather: d.weather
            ? {
                emoji: d.weather.emoji,
                temp_high: d.weather.temp_high,
                temp_low: d.weather.temp_low,
                condition: d.weather.condition,
              }
            : null,
        })),
        summary: {
          total_slots: totalSlots,
          days_with_availability: daysWithAvailability,
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}
