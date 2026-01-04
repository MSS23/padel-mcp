/**
 * MCP-UI Resource Helpers
 *
 * Creates embedded resource objects for interactive components in chat interfaces.
 * Uses the standard MCP embedded resource format that Goose recognizes.
 */

import type { EnhancedTimeSlot, EnhancedDayAvailability } from '../types/index.js';
import { generateSlotCardHTML, generateSlotCardsHTML } from '../ui/components/slot-card.js';
import { generateSearchFormHTML, generateQuickSearchHTML, generateVenueSearchFormHTML, type SearchFormDefaults } from '../ui/components/search-form.js';
import { generateWeeklyCalendarHTML, generateWeeklyListHTML } from '../ui/components/calendar-view.js';

/**
 * MCP Embedded Resource type for UI content
 * This is the format Goose expects for rendering HTML in chat
 */
export interface MCPEmbeddedResource {
  type: 'resource';
  resource: {
    uri: string;
    mimeType: 'text/html';
    text: string;
  };
}

/**
 * Create an embedded resource for slot cards (multiple slots grouped by venue)
 */
export function createSlotCardsResource(
  slots: EnhancedTimeSlot[],
  options?: {
    groupByVenue?: boolean;
    maxSlotsPerVenue?: number;
    title?: string;
  }
): MCPEmbeddedResource {
  const htmlContent = generateSlotCardsHTML(slots, options);

  return {
    type: 'resource' as const,
    resource: {
      uri: `ui://padel-finder/slots/${Date.now()}`,
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for a single slot card
 */
export function createSlotCardResource(
  slot: EnhancedTimeSlot,
  options?: {
    showVenueName?: boolean;
    compact?: boolean;
  }
): MCPEmbeddedResource {
  const htmlContent = generateSlotCardHTML(slot, options);

  return {
    type: 'resource' as const,
    resource: {
      uri: `ui://padel-finder/slot/${slot.venue_id}/${encodeURIComponent(slot.start_time)}`,
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for the search form
 */
export function createSearchFormResource(defaults?: SearchFormDefaults): MCPEmbeddedResource {
  const htmlContent = generateSearchFormHTML(defaults);

  return {
    type: 'resource' as const,
    resource: {
      uri: 'ui://padel-finder/search-form',
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for the compact/quick search form
 */
export function createQuickSearchResource(defaults?: SearchFormDefaults): MCPEmbeddedResource {
  const htmlContent = generateQuickSearchHTML(defaults);

  return {
    type: 'resource' as const,
    resource: {
      uri: 'ui://padel-finder/quick-search',
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for venue-specific availability check form
 */
export function createVenueSearchResource(params: {
  venueId: string;
  venueName: string;
  defaultDate?: string;
}): MCPEmbeddedResource {
  const htmlContent = generateVenueSearchFormHTML(params);

  return {
    type: 'resource' as const,
    resource: {
      uri: `ui://padel-finder/venue-search/${params.venueId}`,
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for the weekly calendar view
 */
export function createWeeklyCalendarResource(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
  startDate: string;
}): MCPEmbeddedResource {
  const htmlContent = generateWeeklyCalendarHTML(params);

  return {
    type: 'resource' as const,
    resource: {
      uri: `ui://padel-finder/calendar/${params.venueId}/${params.startDate}`,
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Create an embedded resource for the weekly list view (compact)
 */
export function createWeeklyListResource(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
}): MCPEmbeddedResource {
  const htmlContent = generateWeeklyListHTML(params);

  return {
    type: 'resource' as const,
    resource: {
      uri: `ui://padel-finder/weekly-list/${params.venueId}`,
      mimeType: 'text/html' as const,
      text: htmlContent,
    },
  };
}

/**
 * Helper to add embedded resources to tool response content array
 */
export function addUIResourcesToContent(
  content: Array<{ type: 'text'; text: string }>,
  resources: MCPEmbeddedResource[]
): Array<{ type: 'text'; text: string } | MCPEmbeddedResource> {
  return [...content, ...resources];
}

/**
 * Goose toolUI metadata for MCP-UI rendering
 * Required for Goose 1.18+ to render embedded resources as interactive UI
 */
export interface GooseToolUIMeta {
  _meta: {
    goose: {
      toolUI: {
        displayType: 'inline' | 'sidecar';
        name: string;
        renderer: 'mcp-ui';
      };
    };
  };
}

/**
 * Create a full tool response with Goose MCP-UI metadata
 * This format is required for Goose 1.18+ to render interactive UI
 */
export function createUIToolResponse(params: {
  textContent: string;
  uiResource: MCPEmbeddedResource;
  uiName?: string;
  displayType?: 'inline' | 'sidecar';
}): {
  content: Array<{ type: 'text'; text: string } | MCPEmbeddedResource>;
  _meta: GooseToolUIMeta['_meta'];
} {
  const { textContent, uiResource, uiName = 'Padel Finder', displayType = 'inline' } = params;

  return {
    content: [
      {
        type: 'text' as const,
        text: textContent,
      },
      uiResource,
    ],
    _meta: {
      goose: {
        toolUI: {
          displayType,
          name: uiName,
          renderer: 'mcp-ui',
        },
      },
    },
  };
}
