/**
 * find_nearby_courts MCP Tool
 *
 * Finds padel venues near a given location.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { parseLocation } from '../services/geocoding.js';
import { findNearbyVenues } from '../services/playtomic.js';

export const findCourtsSchema = {
  location: z
    .string()
    .describe('Location to search near (address, city name, or coordinates like "51.5074,-0.1278")'),
  radius_km: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Search radius in kilometers (1-50, default: 10)'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of venues to return (1-50, default: 10)'),
};

export function registerFindCourts(server: McpServer): void {
  server.tool(
    'find_nearby_courts',
    'Find padel courts and venues near a given location. Returns a list of venues with their addresses and distances.',
    findCourtsSchema,
    async ({ location, radius_km, max_results }) => {
      const radiusKm = radius_km ?? 10;
      const maxResults = max_results ?? 10;

      // Parse the location
      const coords = await parseLocation(location);

      if (!coords) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Could not find location: "${location}". Please try a different address or use coordinates (e.g., "51.5074,-0.1278").`,
            },
          ],
        };
      }

      // Find nearby venues
      const venues = await findNearbyVenues(coords, radiusKm, maxResults);

      if (venues.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No padel venues found within ${radiusKm}km of "${location}". Try increasing the search radius.`,
            },
          ],
        };
      }

      // Format response
      const venueList = venues
        .map(
          (v) =>
            `- **${v.name}** (${v.distance_km}km away)\n  📍 ${v.address}, ${v.city}\n  🆔 ${v.id}`
        )
        .join('\n\n');

      const summary = `Found ${venues.length} padel venue(s) near "${location}":\n\n${venueList}`;

      const response = {
        venues: venues.map((v) => ({
          id: v.id,
          name: v.name,
          address: v.address,
          city: v.city,
          distance_km: v.distance_km,
          platform: v.platform,
        })),
        search_location: location,
        search_radius_km: radiusKm,
        total_found: venues.length,
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
