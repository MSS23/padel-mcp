/**
 * check_alerts MCP Tool
 *
 * Manually trigger checking of all active alerts for availability.
 * Returns current status and any newly available slots.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { alerts, checkAllAlerts, getActiveAlerts } from '../services/alerts.js';
import type { AlertCheckResult } from '../types/index.js';
import { generateSlotBookingUrl, formatBookingLinkMarkdown } from '../utils/booking.js';

export const checkAlertsSchema = {
  alert_id: z
    .string()
    .optional()
    .describe('Check a specific alert by ID (optional, checks all if not provided)'),
  cleanup_expired: z
    .boolean()
    .optional()
    .default(false)
    .describe('Also remove alerts for past dates (default: false)'),
};

export function registerCheckAlerts(server: McpServer): void {
  server.tool(
    'check_alerts',
    'Check all active availability alerts for matching slots. Use this to manually poll for availability or set up scheduled checks.',
    checkAlertsSchema,
    async ({ alert_id, cleanup_expired }) => {
      // Cleanup expired alerts if requested
      if (cleanup_expired) {
        const removed = await alerts.cleanupExpired();
        if (removed > 0) {
          console.log(`Cleaned up ${removed} expired alerts`);
        }
      }

      let results: AlertCheckResult[];

      if (alert_id) {
        // Check specific alert
        const alert = await alerts.getAlert(alert_id);
        if (!alert) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `❌ Alert not found: \`${alert_id}\``,
              },
            ],
          };
        }

        if (!alert.active || alert.triggered) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `⚠️ Alert \`${alert_id}\` is not active (${alert.triggered ? 'already triggered' : 'cancelled'}).`,
              },
            ],
          };
        }

        const result = await alerts.checkAlert(alert);
        results = [result];
      } else {
        // Check all active alerts
        results = await checkAllAlerts();
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: '📭 No active alerts to check. Use `set_availability_alert` to create one.',
            },
          ],
        };
      }

      // Build response
      let summary = `## 🔔 Alert Check Results\n\n`;
      summary += `Checked ${results.length} alert(s) at ${new Date().toLocaleTimeString()}\n\n`;

      const notified = results.filter((r) => r.notified);
      const noMatch = results.filter((r) => !r.notified && r.alert.active);

      if (notified.length > 0) {
        summary += `### 🎉 Slots Found! (${notified.length})\n\n`;

        for (const result of notified) {
          summary += `**${result.alert.venue_name}** on ${result.alert.date}\n`;
          summary += `Time window: ${result.alert.time_start} - ${result.alert.time_end}\n\n`;

          for (const slot of result.available_slots) {
            const startTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '';
            const endTime = slot.end_time.split('T')[1]?.substring(0, 5) ?? '';

            summary += `- **${startTime} - ${endTime}** | ${slot.court_name} | ${slot.currency}${slot.price.toFixed(2)}\n`;

            const bookingUrl = generateSlotBookingUrl({
              venueId: slot.venue_id,
              startTime: slot.start_time,
              platform: 'playtomic',
            });

            if (bookingUrl) {
              summary += `  ${formatBookingLinkMarkdown(bookingUrl)}\n`;
            }
          }

          summary += '\n';

          // Note about notification
          const method = result.alert.notification_method;
          if (method === 'webhook') {
            summary += `📤 Webhook notification sent to: ${result.alert.webhook_url}\n`;
          } else if (method === 'log') {
            summary += `📝 Logged to: ~/.padel-finder/notifications.log\n`;
          }

          summary += '\n---\n\n';
        }
      }

      if (noMatch.length > 0) {
        summary += `### ⏳ Still Waiting (${noMatch.length})\n\n`;

        for (const result of noMatch) {
          summary += `- **${result.alert.venue_name}** on ${result.alert.date}\n`;
          summary += `  Time: ${result.alert.time_start} - ${result.alert.time_end}\n`;
          summary += `  Last checked: ${result.alert.last_checked ? new Date(result.alert.last_checked).toLocaleString() : 'Never'}\n\n`;
        }
      }

      // Build JSON response
      const response = {
        checked_at: new Date().toISOString(),
        total_checked: results.length,
        slots_found: notified.length,
        still_waiting: noMatch.length,
        results: results.map((r) => ({
          alert_id: r.alert.id,
          venue_name: r.alert.venue_name,
          date: r.alert.date,
          time_window: `${r.alert.time_start} - ${r.alert.time_end}`,
          status: r.notified ? 'found' : 'waiting',
          available_slots: r.available_slots.map((s) => ({
            time: s.start_time.split('T')[1]?.substring(0, 5),
            court: s.court_name,
            price: s.price,
            currency: s.currency,
          })),
          notification_sent: r.notified,
          notification_method: r.alert.notification_method,
        })),
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '```json\n' + JSON.stringify(response, null, 2) + '\n```',
          },
        ],
      };
    }
  );
}
