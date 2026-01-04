/**
 * get_venue_details MCP Tool
 *
 * Get detailed information about a specific venue.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getVenueDetails } from '../services/playtomic.js';
import { preferences } from '../services/preferences.js';

export const getVenueDetailsSchema = {
  venue_id: z
    .string()
    .describe('The venue ID to get details for'),
};

export function registerGetVenueDetails(server: McpServer): void {
  server.tool(
    'get_venue_details',
    'Get detailed information about a specific padel venue including address, contact info, courts, and amenities.',
    getVenueDetailsSchema,
    async ({ venue_id }) => {
      const details = await getVenueDetails(venue_id);

      if (!details) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Venue not found: ${venue_id}`,
            },
          ],
        };
      }

      // Check if it's a favorite
      const isFavorite = await preferences.isFavorite(venue_id);

      // Build summary
      let summary = `## ${details.name}${isFavorite ? ' ⭐' : ''}\n\n`;
      summary += `📍 **Address:** ${details.address}, ${details.city}\n`;

      if (details.phone) {
        summary += `📞 **Phone:** ${details.phone}\n`;
      }
      if (details.email) {
        summary += `✉️ **Email:** ${details.email}\n`;
      }
      if (details.website) {
        summary += `🌐 **Website:** ${details.website}\n`;
      }

      if (details.description) {
        summary += `\n${details.description}\n`;
      }

      if (details.courts && details.courts.length > 0) {
        summary += `\n**Courts (${details.courts.length}):**\n`;
        for (const court of details.courts) {
          const courtInfo = [court.surface, court.type].filter(Boolean).join(', ');
          summary += `- ${court.name}${courtInfo ? ` (${courtInfo})` : ''}\n`;
        }
      }

      if (details.amenities && details.amenities.length > 0) {
        summary += `\n**Amenities:** ${details.amenities.join(', ')}\n`;
      }

      if (details.images.length > 0) {
        summary += `\n**Images:** ${details.images.length} photo(s) available\n`;
      }

      const response = {
        venue: {
          id: details.id,
          name: details.name,
          address: details.address,
          city: details.city,
          coordinates: details.coordinates,
          phone: details.phone,
          email: details.email,
          website: details.website,
          description: details.description,
          courts: details.courts,
          amenities: details.amenities,
          images: details.images,
          is_favorite: isFavorite,
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
