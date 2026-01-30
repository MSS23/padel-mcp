/**
 * book_court MCP Tool
 *
 * Start booking process for a padel court slot with interactive checkout wizard.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { bundleWidget } from '../widget-renderer/bundler.js';
import { detectClientType, getUIAdapter } from '../utils/ui-adapter.js';

export const bookCourtSchema = {
  venue_id: z.string().describe('The venue ID'),
  venue_name: z.string().describe('Name of the venue'),
  start_time: z.string().describe('Start time in ISO 8601 format (e.g., "2026-01-31T19:00:00Z")'),
  duration_minutes: z.number().describe('Duration of the booking in minutes'),
  price: z.number().describe('Price of the booking'),
  currency: z.string().optional().default('EUR').describe('Currency code'),
  court_name: z.string().optional().describe('Name of the court'),
};

export function registerBookCourt(server: McpServer): void {
  server.tool(
    'book_court',
    'Start booking process for a padel court slot with interactive checkout wizard. Opens a multi-step checkout flow.',
    bookCourtSchema,
    async (params) => {
      const {
        venue_id,
        venue_name,
        start_time,
        duration_minutes,
        price,
        currency = 'EUR',
        court_name,
      } = params;

      // Detect client type
      const clientType = detectClientType();
      const uiAdapter = getUIAdapter(clientType);

      // Generate checkout wizard widget
      const widgetHtml = await bundleWidget('CheckoutWizard', {
        slot: {
          venue_id,
          venue_name,
          start_time,
          duration_minutes,
          price,
          currency,
          court_name: court_name || 'Court 1',
        },
        mode: 'demo', // Always succeeds for demo
        autoFillUser: true, // Pre-fill for demos
      });

      // Return response based on client type
      if (clientType === 'chatgpt' || clientType === 'auto') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Starting booking for **${venue_name}** at ${new Date(start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}...`,
            },
            {
              type: 'resource' as const,
              resource: {
                uri: 'ui://widget/checkout',
                mimeType: 'text/html+skybridge' as const,
                text: widgetHtml.html,
              },
            },
          ],
          _meta: {
            'openai/outputTemplate': 'ui://widget/checkout',
            'openai/toolInvocation/invoking': 'Opening checkout wizard...',
            'openai/toolInvocation/invoked': 'Checkout wizard ready',
          },
        };
      }

      // Fallback for Goose MCP-UI
      return {
        content: [
          {
            type: 'text' as const,
            text: `Starting booking for **${venue_name}** at ${new Date(start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}...\n\nCheckout wizard opened.`,
          },
          {
            type: 'resource' as const,
            resource: {
              uri: 'ui://widget/checkout',
              mimeType: 'text/html' as const,
              text: widgetHtml.html,
            },
          },
        ],
      };
    }
  );
}
