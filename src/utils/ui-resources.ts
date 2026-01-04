/**
 * MCP-UI Resource Helpers
 *
 * Creates UIResource objects for interactive components in chat interfaces.
 * Uses @mcp-ui/server to generate resources that render in Goose, Claude, ChatGPT.
 */

import { createUIResource, type UIResource } from '@mcp-ui/server';
import type { EnhancedTimeSlot, EnhancedDayAvailability } from '../types/index.js';
import { generateSlotCardHTML, generateSlotCardsHTML } from '../ui/components/slot-card.js';
import { generateSearchFormHTML, generateQuickSearchHTML, generateVenueSearchFormHTML, type SearchFormDefaults } from '../ui/components/search-form.js';
import { generateWeeklyCalendarHTML, generateWeeklyListHTML } from '../ui/components/calendar-view.js';

/**
 * Create a UIResource for slot cards (multiple slots grouped by venue)
 */
export function createSlotCardsResource(
  slots: EnhancedTimeSlot[],
  options?: {
    groupByVenue?: boolean;
    maxSlotsPerVenue?: number;
    title?: string;
  }
): UIResource {
  const htmlContent = generateSlotCardsHTML(slots, options);

  return createUIResource({
    uri: `ui://padel-finder/slots/${Date.now()}`,
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', 'auto'],
    },
  });
}

/**
 * Create a UIResource for a single slot card
 */
export function createSlotCardResource(
  slot: EnhancedTimeSlot,
  options?: {
    showVenueName?: boolean;
    compact?: boolean;
  }
): UIResource {
  const htmlContent = generateSlotCardHTML(slot, options);

  return createUIResource({
    uri: `ui://padel-finder/slot/${slot.venue_id}/${encodeURIComponent(slot.start_time)}`,
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
  });
}

/**
 * Create a UIResource for the search form
 */
export function createSearchFormResource(defaults?: SearchFormDefaults): UIResource {
  const htmlContent = generateSearchFormHTML(defaults);

  return createUIResource({
    uri: 'ui://padel-finder/search-form',
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', '350px'],
    },
  });
}

/**
 * Create a UIResource for the compact/quick search form
 */
export function createQuickSearchResource(defaults?: SearchFormDefaults): UIResource {
  const htmlContent = generateQuickSearchHTML(defaults);

  return createUIResource({
    uri: 'ui://padel-finder/quick-search',
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', '100px'],
    },
  });
}

/**
 * Create a UIResource for venue-specific availability check form
 */
export function createVenueSearchResource(params: {
  venueId: string;
  venueName: string;
  defaultDate?: string;
}): UIResource {
  const htmlContent = generateVenueSearchFormHTML(params);

  return createUIResource({
    uri: `ui://padel-finder/venue-search/${params.venueId}`,
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', '120px'],
    },
  });
}

/**
 * Create a UIResource for the weekly calendar view
 */
export function createWeeklyCalendarResource(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
  startDate: string;
}): UIResource {
  const htmlContent = generateWeeklyCalendarHTML(params);

  return createUIResource({
    uri: `ui://padel-finder/calendar/${params.venueId}/${params.startDate}`,
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', '300px'],
    },
  });
}

/**
 * Create a UIResource for the weekly list view (compact)
 */
export function createWeeklyListResource(params: {
  venueName: string;
  venueId: string;
  days: EnhancedDayAvailability[];
}): UIResource {
  const htmlContent = generateWeeklyListHTML(params);

  return createUIResource({
    uri: `ui://padel-finder/weekly-list/${params.venueId}`,
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    uiMetadata: {
      'preferred-frame-size': ['100%', 'auto'],
    },
  });
}

/**
 * Helper to add UIResources to tool response content array
 */
export function addUIResourcesToContent(
  content: Array<{ type: 'text'; text: string }>,
  resources: UIResource[]
): Array<{ type: 'text'; text: string } | UIResource> {
  return [...content, ...resources];
}
