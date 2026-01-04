/**
 * set_availability_alert MCP Tool
 *
 * Set up alerts for when preferred time slots become available.
 * Alerts are persisted to disk and support webhook notifications.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createAlert, cancelAlert, getAlerts, getActiveAlerts } from '../services/alerts.js';
import type { PersistentAlert } from '../types/index.js';

export const setNotificationSchema = {
  venue_id: z
    .string()
    .describe('The venue ID to watch'),
  venue_name: z
    .string()
    .optional()
    .describe('Venue name for display'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date to watch (YYYY-MM-DD format)'),
  preferred_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('Start of preferred time window (HH:mm)'),
  preferred_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('End of preferred time window (HH:mm)'),
  notification_method: z
    .enum(['webhook', 'log', 'callback'])
    .optional()
    .default('log')
    .describe('How to notify: webhook (POST to URL), log (write to file), or callback (return in response)'),
  webhook_url: z
    .string()
    .url()
    .optional()
    .describe('Webhook URL for notifications (required if notification_method is webhook)'),
};

export const listNotificationsSchema = {
  include_inactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include triggered/cancelled alerts (default: false)'),
};

export const cancelNotificationSchema = {
  alert_id: z
    .string()
    .describe('The alert ID to cancel'),
};

export function registerSetNotification(server: McpServer): void {
  // Set new alert
  server.tool(
    'set_availability_alert',
    'Set up a persistent alert for when a preferred time slot becomes available. Alerts are saved to disk and support webhook notifications.',
    setNotificationSchema,
    async ({ venue_id, venue_name, date, preferred_time_start, preferred_time_end, notification_method, webhook_url }) => {
      const method = notification_method ?? 'log';

      // Validate webhook URL if method is webhook
      if (method === 'webhook' && !webhook_url) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Webhook URL is required when notification_method is "webhook".',
            },
          ],
        };
      }

      const alert = await createAlert({
        venue_id,
        venue_name: venue_name ?? venue_id,
        date,
        time_start: preferred_time_start,
        time_end: preferred_time_end,
        notification_method: method,
        webhook_url,
      });

      const notificationInfo = method === 'webhook'
        ? `Webhook: ${webhook_url}`
        : method === 'log'
          ? 'Log file: ~/.padel-finder/notifications.log'
          : 'Callback (in check_alerts response)';

      const summary = `## ✅ Alert Created!\n\n**Alert Details:**\n- 🆔 ID: \`${alert.id}\`\n- 🏢 Venue: ${alert.venue_name}\n- 📅 Date: ${date}\n- 🕐 Time window: ${preferred_time_start} - ${preferred_time_end}\n- 🔔 Notification: ${notificationInfo}\n\n**Note:** Use \`check_alerts\` to manually check for availability, or set up a scheduled task to call it periodically.`;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(alert, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // List alerts
  server.tool(
    'list_availability_alerts',
    'List all availability alerts (active and past).',
    listNotificationsSchema,
    async ({ include_inactive }) => {
      const alerts = include_inactive
        ? await getAlerts()
        : await getActiveAlerts();

      if (alerts.length === 0) {
        const message = include_inactive
          ? 'No alerts found. Use `set_availability_alert` to create one.'
          : 'No active alerts. Use `set_availability_alert` to create one, or use `include_inactive: true` to see past alerts.';

        return {
          content: [
            {
              type: 'text' as const,
              text: message,
            },
          ],
        };
      }

      let summary = `## 🔔 Alerts (${alerts.length})\n\n`;

      const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
      const triggeredAlerts = alerts.filter((a) => a.triggered);
      const cancelledAlerts = alerts.filter((a) => !a.active && !a.triggered);

      if (activeAlerts.length > 0) {
        summary += `### Active Alerts (${activeAlerts.length})\n\n`;
        for (const alert of activeAlerts) {
          summary += `- **${alert.venue_name}** on ${alert.date}\n`;
          summary += `  Time: ${alert.time_start} - ${alert.time_end}\n`;
          summary += `  Method: ${alert.notification_method}\n`;
          summary += `  ID: \`${alert.id}\`\n\n`;
        }
      }

      if (include_inactive && triggeredAlerts.length > 0) {
        summary += `### Triggered Alerts (${triggeredAlerts.length})\n\n`;
        for (const alert of triggeredAlerts) {
          summary += `- ✅ **${alert.venue_name}** on ${alert.date} - Notified!\n`;
          summary += `  ID: \`${alert.id}\`\n\n`;
        }
      }

      if (include_inactive && cancelledAlerts.length > 0) {
        summary += `### Cancelled Alerts (${cancelledAlerts.length})\n\n`;
        for (const alert of cancelledAlerts) {
          summary += `- ❌ **${alert.venue_name}** on ${alert.date}\n`;
          summary += `  ID: \`${alert.id}\`\n\n`;
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '```json\n' + JSON.stringify(alerts, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // Cancel alert
  server.tool(
    'cancel_availability_alert',
    'Cancel an existing availability alert.',
    cancelNotificationSchema,
    async ({ alert_id }) => {
      const success = await cancelAlert(alert_id);

      if (!success) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Alert not found: \`${alert_id}\``,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Alert \`${alert_id}\` has been cancelled.`,
          },
        ],
      };
    }
  );
}
