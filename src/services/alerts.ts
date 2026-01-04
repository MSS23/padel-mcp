/**
 * Alerts Service
 *
 * Persistent storage for availability alerts with webhook notification support.
 * Alerts are stored in a JSON file and survive server restarts.
 */

import { readFile, writeFile, mkdir, appendFile } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import { checkVenueAvailability } from './playtomic.js';
import type { PersistentAlert, AlertCheckResult, TimeSlot } from '../types/index.js';
import { generateSlotBookingUrl } from '../utils/booking.js';

interface AlertsData {
  alerts: PersistentAlert[];
}

const DEFAULT_DATA: AlertsData = {
  alerts: [],
};

class AlertsService {
  private alertsPath: string;
  private logPath: string;
  private data: AlertsData | null = null;

  constructor() {
    const baseDir = join(homedir(), '.padel-finder');
    this.alertsPath = join(baseDir, 'alerts.json');
    this.logPath = join(baseDir, 'notifications.log');
  }

  /**
   * Load alerts from disk
   */
  async load(): Promise<AlertsData> {
    if (this.data) {
      return this.data;
    }

    try {
      const content = await readFile(this.alertsPath, 'utf-8');
      this.data = { ...DEFAULT_DATA, ...JSON.parse(content) };
    } catch {
      this.data = { ...DEFAULT_DATA };
    }

    return this.data!;
  }

  /**
   * Save alerts to disk
   */
  async save(): Promise<void> {
    if (!this.data) {
      return;
    }

    try {
      await mkdir(dirname(this.alertsPath), { recursive: true });
      await writeFile(this.alertsPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  /**
   * Get all alerts
   */
  async getAlerts(): Promise<PersistentAlert[]> {
    const data = await this.load();
    return data.alerts;
  }

  /**
   * Get active alerts only
   */
  async getActiveAlerts(): Promise<PersistentAlert[]> {
    const data = await this.load();
    return data.alerts.filter((a) => a.active && !a.triggered);
  }

  /**
   * Get a specific alert by ID
   */
  async getAlert(alertId: string): Promise<PersistentAlert | undefined> {
    const data = await this.load();
    return data.alerts.find((a) => a.id === alertId);
  }

  /**
   * Create a new alert
   */
  async createAlert(params: {
    venue_id: string;
    venue_name: string;
    date: string;
    time_start: string;
    time_end: string;
    notification_method: 'webhook' | 'log' | 'callback';
    webhook_url?: string;
  }): Promise<PersistentAlert> {
    const data = await this.load();

    // Check for duplicate
    const existing = data.alerts.find(
      (a) =>
        a.venue_id === params.venue_id &&
        a.date === params.date &&
        a.time_start === params.time_start &&
        a.active &&
        !a.triggered
    );

    if (existing) {
      return existing;
    }

    const alert: PersistentAlert = {
      id: randomUUID(),
      venue_id: params.venue_id,
      venue_name: params.venue_name,
      date: params.date,
      time_start: params.time_start,
      time_end: params.time_end,
      created_at: new Date().toISOString(),
      active: true,
      notification_method: params.notification_method,
      webhook_url: params.webhook_url,
      triggered: false,
    };

    data.alerts.push(alert);
    await this.save();
    return alert;
  }

  /**
   * Cancel an alert
   */
  async cancelAlert(alertId: string): Promise<boolean> {
    const data = await this.load();
    const alert = data.alerts.find((a) => a.id === alertId);

    if (alert) {
      alert.active = false;
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    const data = await this.load();
    const initialLength = data.alerts.length;
    data.alerts = data.alerts.filter((a) => a.id !== alertId);

    if (data.alerts.length < initialLength) {
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Check a single alert for availability
   */
  async checkAlert(alert: PersistentAlert): Promise<AlertCheckResult> {
    const result: AlertCheckResult = {
      alert,
      available_slots: [],
      notified: false,
    };

    if (!alert.active || alert.triggered) {
      return result;
    }

    try {
      const slots = await checkVenueAvailability(alert.venue_id, alert.date, alert.venue_name);

      // Filter by time range
      const matchingSlots = slots.filter((slot) => {
        const slotTime = slot.start_time.split('T')[1]?.substring(0, 5) ?? '00:00';
        return slotTime >= alert.time_start && slotTime <= alert.time_end;
      });

      if (matchingSlots.length > 0) {
        result.available_slots = matchingSlots;

        // Send notification
        await this.notifyAlert(alert, matchingSlots);
        result.notified = true;

        // Mark as triggered
        alert.triggered = true;
        alert.last_checked = new Date().toISOString();
        await this.save();
      } else {
        // Update last checked
        alert.last_checked = new Date().toISOString();
        await this.save();
      }
    } catch (error) {
      console.error(`Error checking alert ${alert.id}:`, error);
    }

    return result;
  }

  /**
   * Check all active alerts
   */
  async checkAllAlerts(): Promise<AlertCheckResult[]> {
    const activeAlerts = await this.getActiveAlerts();
    const results: AlertCheckResult[] = [];

    for (const alert of activeAlerts) {
      const result = await this.checkAlert(alert);
      results.push(result);

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return results;
  }

  /**
   * Send notification for an alert
   */
  private async notifyAlert(alert: PersistentAlert, slots: TimeSlot[]): Promise<void> {
    const payload = {
      type: 'slot_available',
      alert_id: alert.id,
      venue_name: alert.venue_name,
      date: alert.date,
      available_slots: slots.map((s) => ({
        time: s.start_time.split('T')[1]?.substring(0, 5),
        court: s.court_name,
        price: s.price,
        currency: s.currency,
      })),
      booking_url: generateSlotBookingUrl({
        venueId: alert.venue_id,
        startTime: slots[0].start_time,
        platform: 'playtomic',
      }),
      timestamp: new Date().toISOString(),
    };

    switch (alert.notification_method) {
      case 'webhook':
        if (alert.webhook_url) {
          await this.sendWebhook(alert.webhook_url, payload);
        }
        break;

      case 'log':
        await this.logNotification(payload);
        break;

      case 'callback':
        // Callback is handled by returning the result
        break;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(url: string, payload: object): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PadelFinderMCP/2.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  /**
   * Log notification to file
   */
  private async logNotification(payload: object): Promise<void> {
    try {
      await mkdir(dirname(this.logPath), { recursive: true });
      const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(payload)}\n`;
      await appendFile(this.logPath, logEntry);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Clean up expired alerts (past date)
   */
  async cleanupExpired(): Promise<number> {
    const data = await this.load();
    const today = new Date().toISOString().split('T')[0];
    const initialLength = data.alerts.length;

    data.alerts = data.alerts.filter((a) => a.date >= today);

    const removed = initialLength - data.alerts.length;
    if (removed > 0) {
      await this.save();
    }

    return removed;
  }
}

// Export singleton instance
export const alerts = new AlertsService();

// Export helper functions for tools
export async function getAlerts(): Promise<PersistentAlert[]> {
  return alerts.getAlerts();
}

export async function getActiveAlerts(): Promise<PersistentAlert[]> {
  return alerts.getActiveAlerts();
}

export async function createAlert(params: {
  venue_id: string;
  venue_name: string;
  date: string;
  time_start: string;
  time_end: string;
  notification_method: 'webhook' | 'log' | 'callback';
  webhook_url?: string;
}): Promise<PersistentAlert> {
  return alerts.createAlert(params);
}

export async function cancelAlert(alertId: string): Promise<boolean> {
  return alerts.cancelAlert(alertId);
}

export async function checkAllAlerts(): Promise<AlertCheckResult[]> {
  return alerts.checkAllAlerts();
}
