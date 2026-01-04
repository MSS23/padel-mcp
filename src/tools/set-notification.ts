/**
 * set_availability_alert MCP Tool
 *
 * Set up alerts for when preferred time slots become available.
 * Note: This is an in-memory implementation for MVP.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AvailabilityAlert } from '../types/index.js';

// In-memory alert storage
const alerts: AvailabilityAlert[] = [];

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
};

export const listNotificationsSchema = {};

export const cancelNotificationSchema = {
  alert_id: z
    .string()
    .describe('The alert ID to cancel'),
};

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function registerSetNotification(server: McpServer): void {
  // Set new alert
  server.tool(
    'set_availability_alert',
    'Set up an alert for when a preferred time slot becomes available. Note: Alerts are stored in memory and will be lost when the server restarts.',
    setNotificationSchema,
    async ({ venue_id, venue_name, date, preferred_time_start, preferred_time_end }) => {
      const alert: AvailabilityAlert = {
        id: generateAlertId(),
        venue_id,
        venue_name: venue_name ?? venue_id,
        date,
        preferred_time_start,
        preferred_time_end,
        created_at: new Date().toISOString(),
        active: true,
      };

      alerts.push(alert);

      const summary = `✅ Alert created!\n\n**Alert Details:**\n- ID: ${alert.id}\n- Venue: ${alert.venue_name}\n- Date: ${date}\n- Time window: ${preferred_time_start} - ${preferred_time_end}\n\nNote: This is an in-memory alert. The server will need to be checked periodically for availability, and alerts will be lost on server restart.`;

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
    'List all active availability alerts.',
    listNotificationsSchema,
    async () => {
      const activeAlerts = alerts.filter((a) => a.active);

      if (activeAlerts.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No active alerts. Use `set_availability_alert` to create one.',
            },
          ],
        };
      }

      let summary = `**Active Alerts (${activeAlerts.length}):**\n\n`;

      for (const alert of activeAlerts) {
        summary += `- **${alert.venue_name}** on ${alert.date}\n`;
        summary += `  Time: ${alert.preferred_time_start} - ${alert.preferred_time_end}\n`;
        summary += `  ID: ${alert.id}\n\n`;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '```json\n' + JSON.stringify(activeAlerts, null, 2) + '\n```',
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
      const alertIndex = alerts.findIndex((a) => a.id === alert_id);

      if (alertIndex === -1) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Alert not found: ${alert_id}`,
            },
          ],
        };
      }

      alerts[alertIndex].active = false;

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Alert ${alert_id} has been cancelled.`,
          },
        ],
      };
    }
  );
}
