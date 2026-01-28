/**
 * UI Adapter
 *
 * Provides backward compatibility between Goose MCP-UI (text/html) and
 * ChatGPT Apps (text/html+skybridge) widget formats.
 */

import type { EnhancedTimeSlot } from '../types/index.js';
import { bundleWidget, determineDisplayMode } from '../widget-renderer/bundler.js';
import { createSlotCardsResource, createEmptyStateResource, type MCPEmbeddedResource } from './ui-resources.js';
import type { EmptyStateParams } from '../ui/components/empty-state.js';

export type UIClientType = 'chatgpt' | 'goose' | 'auto';

export interface UIAdapter {
  createSlotCardsUI(slots: EnhancedTimeSlot[], options?: {
    groupByVenue?: boolean;
    maxSlotsPerVenue?: number;
    title?: string;
  }): Promise<MCPEmbeddedResource | ChatGPTWidgetResource>;
  
  createEmptyStateUI(params: EmptyStateParams): Promise<MCPEmbeddedResource | ChatGPTWidgetResource>;
  
  createSearchFormUI(defaults?: {
    location?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
  }): Promise<MCPEmbeddedResource | ChatGPTWidgetResource>;
  
  createWeeklyCalendarUI(slots: EnhancedTimeSlot[], startDate: string): Promise<MCPEmbeddedResource | ChatGPTWidgetResource>;
  
  createPriceComparisonUI(slots: EnhancedTimeSlot[]): Promise<MCPEmbeddedResource | ChatGPTWidgetResource>;
}

export interface ChatGPTWidgetResource {
  type: 'resource';
  resource: {
    uri: string;
    mimeType: 'text/html+skybridge';
    text: string;
  };
}

/**
 * Goose MCP-UI Adapter (backward compatible)
 */
class GooseUIAdapter implements UIAdapter {
  async createSlotCardsUI(
    slots: EnhancedTimeSlot[],
    options?: {
      groupByVenue?: boolean;
      maxSlotsPerVenue?: number;
      title?: string;
    }
  ): Promise<MCPEmbeddedResource> {
    return createSlotCardsResource(slots, options);
  }

  async createEmptyStateUI(params: EmptyStateParams): Promise<MCPEmbeddedResource> {
    return createEmptyStateResource(params);
  }

  async createSearchFormUI(defaults?: {
    location?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
  }): Promise<MCPEmbeddedResource> {
    const { createSearchFormResource } = await import('./ui-resources.js');
    return createSearchFormResource(defaults);
  }

  async createWeeklyCalendarUI(
    slots: EnhancedTimeSlot[],
    startDate: string
  ): Promise<MCPEmbeddedResource> {
    // For Goose, we'd use the existing HTML-based calendar
    // This is a placeholder - implement based on existing calendar component
    return createSlotCardsResource(slots, { title: `Weekly Availability - ${startDate}` });
  }

  async createPriceComparisonUI(slots: EnhancedTimeSlot[]): Promise<MCPEmbeddedResource> {
    // Use existing price comparison HTML
    const { createPriceComparisonResource } = await import('./ui-resources.js');
    // This would need proper implementation with venue grouping
    return createSlotCardsResource(slots, { title: 'Price Comparison' });
  }
}

/**
 * ChatGPT Apps Adapter (new widget format)
 */
class ChatGPTUIAdapter implements UIAdapter {
  async createSlotCardsUI(
    slots: EnhancedTimeSlot[],
    options?: {
      groupByVenue?: boolean;
      maxSlotsPerVenue?: number;
      title?: string;
      widgetSessionId?: string;
    }
  ): Promise<ChatGPTWidgetResource> {
    const bundle = await bundleWidget('SlotCards', {
      slots,
      groupByVenue: options?.groupByVenue ?? true,
      widgetSessionId: options?.widgetSessionId,
      title: options?.title,
    });

    return {
      type: 'resource',
      resource: {
        uri: `ui://widget/SlotCards.html`,
        mimeType: 'text/html+skybridge',
        text: bundle.html,
      },
    };
  }

  async createEmptyStateUI(params: EmptyStateParams): Promise<ChatGPTWidgetResource> {
    // For ChatGPT, we can use a simple widget or fallback to HTML
    // For now, use the Goose HTML format but with skybridge mime type
    const gooseResource = await createEmptyStateResource(params);
    return {
      type: 'resource',
      resource: {
        uri: gooseResource.resource.uri,
        mimeType: 'text/html+skybridge',
        text: gooseResource.resource.text,
      },
    };
  }

  async createSearchFormUI(defaults?: {
    location?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
    widgetSessionId?: string;
  }): Promise<ChatGPTWidgetResource> {
    const bundle = await bundleWidget('SearchForm', {
      initialLocation: defaults?.location,
      initialDate: defaults?.date,
      initialTimeStart: defaults?.timeStart,
      initialTimeEnd: defaults?.timeEnd,
      widgetSessionId: defaults?.widgetSessionId,
    });

    return {
      type: 'resource',
      resource: {
        uri: `ui://widget/SearchForm.html`,
        mimeType: 'text/html+skybridge',
        text: bundle.html,
      },
    };
  }

  async createWeeklyCalendarUI(
    slots: EnhancedTimeSlot[],
    startDate: string,
    widgetSessionId?: string
  ): Promise<ChatGPTWidgetResource> {
    const bundle = await bundleWidget('WeeklyCalendar', {
      slots,
      startDate,
      widgetSessionId,
    });

    return {
      type: 'resource',
      resource: {
        uri: `ui://widget/WeeklyCalendar.html`,
        mimeType: 'text/html+skybridge',
        text: bundle.html,
      },
    };
  }

  async createPriceComparisonUI(
    slots: EnhancedTimeSlot[],
    widgetSessionId?: string
  ): Promise<ChatGPTWidgetResource> {
    const bundle = await bundleWidget('PriceComparison', {
      slots,
      widgetSessionId,
    });

    return {
      type: 'resource',
      resource: {
        uri: `ui://widget/PriceComparison.html`,
        mimeType: 'text/html+skybridge',
        text: bundle.html,
      },
    };
  }
}

/**
 * Auto-detect client type from context
 */
export function detectClientType(context?: {
  headers?: Record<string, string>;
  userAgent?: string;
}): UIClientType {
  if (!context) return 'auto';

  const userAgent = context.headers?.['user-agent'] || context.userAgent || '';
  
  if (userAgent.includes('ChatGPT') || userAgent.includes('OpenAI')) {
    return 'chatgpt';
  }
  
  if (userAgent.includes('Goose') || userAgent.includes('MCP-UI')) {
    return 'goose';
  }

  return 'auto';
}

/**
 * Get UI adapter based on client type
 */
export function getUIAdapter(clientType: UIClientType = 'auto'): UIAdapter {
  if (clientType === 'chatgpt') {
    return new ChatGPTUIAdapter();
  }
  
  // Default to Goose for backward compatibility
  return new GooseUIAdapter();
}

/**
 * Generate session ID for widget state
 */
export function generateWidgetSessionId(prefix: string = 'widget'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
