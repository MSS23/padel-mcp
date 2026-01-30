/**
 * test_slot_cards MCP Tool
 *
 * Test slot cards widget with mock booking data to validate rendering and interactivity.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { bundleWidget } from '../widget-renderer/bundler.js';

export function registerTestSlotCards(server: McpServer): void {
  server.tool(
    'test_slot_cards',
    'Test slot cards widget with mock booking data',
    {},
    async () => {
      const mockSlots = [
        {
          venue_id: 'test-1',
          venue_name: 'Test Padel Club',
          court_name: 'Court 1',
          start_time: '2026-01-31T19:00:00Z',
          end_time: '2026-01-31T20:30:00Z',
          duration_minutes: 90,
          price: 25.0,
          currency: 'GBP',
          available: true,
          court_id: 'court-1',
        },
        {
          venue_id: 'test-2',
          venue_name: 'Premium Padel Centre',
          court_name: 'Court 2',
          start_time: '2026-01-31T19:00:00Z',
          end_time: '2026-01-31T20:30:00Z',
          duration_minutes: 90,
          price: 30.0,
          currency: 'GBP',
          available: true,
          court_id: 'court-2',
        },
      ];

      const widgetHtml = await bundleWidget('SlotCards', {
        slots: mockSlots,
        groupByVenue: false,
        title: '🎾 Test Slots - Click Book Now',
        enableBooking: true,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: 'Here are 2 test slots. Click "Book Now" to test:',
          },
          {
            type: 'resource' as const,
            resource: {
              uri: 'ui://widget/test-slots',
              mimeType: 'text/html+skybridge' as const,
              text: widgetHtml.html,
            },
          },
        ],
      };
    }
  );
}
