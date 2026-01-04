/**
 * get_peak_hours MCP Tool
 *
 * Analyze typical busy/quiet times at venues.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkVenueAvailability } from '../services/playtomic.js';
import type { HourlyStats } from '../types/index.js';

export const peakHoursSchema = {
  venue_id: z.string().describe('The venue ID to analyze'),
  venue_name: z.string().optional().describe('Venue name for display'),
  sample_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Date to sample (defaults to next suitable day)'),
};

function getNextWeekday(dayOffset: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split('T')[0];
}

export function registerPeakHours(server: McpServer): void {
  server.tool(
    'get_peak_hours',
    'Analyze availability patterns at a venue to find peak and off-peak hours. Shows when courts are typically busy or quiet.',
    peakHoursSchema,
    async ({ venue_id, venue_name, sample_date }) => {
      // Use provided date or default to tomorrow
      const date = sample_date ?? getNextWeekday();

      const slots = await checkVenueAvailability(venue_id, date, venue_name);

      if (slots.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No availability data for ${venue_name ?? venue_id} on ${date}. The venue might be closed or fully booked.`,
            },
          ],
        };
      }

      // Group slots by hour
      const hourlyData = new Map<string, { count: number; prices: number[] }>();

      for (const slot of slots) {
        const hour = slot.start_time.split('T')[1]?.substring(0, 2) ?? '00';
        const hourKey = `${hour}:00`;

        const existing = hourlyData.get(hourKey) ?? { count: 0, prices: [] };
        existing.count++;
        existing.prices.push(slot.price);
        hourlyData.set(hourKey, existing);
      }

      // Calculate stats for each hour
      const hours = Array.from(hourlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, data]) => {
          const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
          return { hour, count: data.count, avgPrice };
        });

      // Determine popularity thresholds
      const counts = hours.map((h) => h.count);
      const maxCount = Math.max(...counts);
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

      const hourlyStats: HourlyStats[] = hours.map((h) => {
        let popularity: 'low' | 'medium' | 'high';
        if (h.count >= maxCount * 0.8) {
          popularity = 'high';
        } else if (h.count >= avgCount) {
          popularity = 'medium';
        } else {
          popularity = 'low';
        }

        return {
          hour: h.hour,
          avg_available_courts: h.count,
          avg_price: Math.round(h.avgPrice * 100) / 100,
          popularity,
        };
      });

      // Find peak and off-peak hours
      const peakHours = hourlyStats.filter((h) => h.popularity === 'high').map((h) => h.hour);
      const offPeakHours = hourlyStats.filter((h) => h.popularity === 'low').map((h) => h.hour);

      // Calculate average prices by popularity
      const peakPrices = hourlyStats.filter((h) => h.popularity === 'high').map((h) => h.avg_price);
      const offPeakPrices = hourlyStats.filter((h) => h.popularity === 'low').map((h) => h.avg_price);

      const avgPeakPrice = peakPrices.length > 0 ? peakPrices.reduce((a, b) => a + b, 0) / peakPrices.length : 0;
      const avgOffPeakPrice = offPeakPrices.length > 0 ? offPeakPrices.reduce((a, b) => a + b, 0) / offPeakPrices.length : 0;

      const currency = slots[0].currency;

      // Build visual summary
      let summary = `## Peak Hours Analysis: ${venue_name ?? venue_id}\n`;
      summary += `*Based on ${date} availability*\n\n`;

      // Visual bar chart
      summary += `**Availability by Hour:**\n\`\`\`\n`;
      for (const stat of hourlyStats) {
        const bar = '█'.repeat(Math.min(stat.avg_available_courts, 20));
        const icon = stat.popularity === 'high' ? '🔥' : stat.popularity === 'low' ? '💚' : '  ';
        summary += `${stat.hour} ${icon} ${bar} (${stat.avg_available_courts})\n`;
      }
      summary += `\`\`\`\n\n`;

      summary += `**Peak Hours (busy):** ${peakHours.length > 0 ? peakHours.join(', ') : 'None identified'}\n`;
      summary += `**Off-Peak Hours (quiet):** ${offPeakHours.length > 0 ? offPeakHours.join(', ') : 'None identified'}\n\n`;

      if (avgPeakPrice > 0 && avgOffPeakPrice > 0) {
        const savings = ((avgPeakPrice - avgOffPeakPrice) / avgPeakPrice) * 100;
        summary += `**Price Comparison:**\n`;
        summary += `- Peak: ~${currency} ${avgPeakPrice.toFixed(2)}\n`;
        summary += `- Off-Peak: ~${currency} ${avgOffPeakPrice.toFixed(2)}\n`;
        if (savings > 0) {
          summary += `- 💰 Save ~${savings.toFixed(0)}% by booking off-peak!\n`;
        }
      }

      const response = {
        venue_id,
        venue_name: venue_name ?? venue_id,
        sample_date: date,
        hourly_stats: hourlyStats,
        summary: {
          peak_hours: peakHours,
          off_peak_hours: offPeakHours,
          avg_peak_price: Math.round(avgPeakPrice * 100) / 100,
          avg_off_peak_price: Math.round(avgOffPeakPrice * 100) / 100,
          currency,
        },
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
