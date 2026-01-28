/**
 * Common widget types
 */

import type { EnhancedTimeSlot, Coordinates } from '../../types/index.js';

export interface WidgetSessionState {
  sessionId: string;
  expandedSlots: Set<string>;
  selectedSlots: Set<string>;
  filters: SearchFilters;
}

export interface SearchFilters {
  courtType?: 'indoor' | 'outdoor' | 'any';
  maxPrice?: number;
  minDuration?: number;
  timeStart?: string;
  timeEnd?: string;
}

export interface WidgetProps {
  widgetSessionId?: string;
  onSlotClick?: (slot: EnhancedTimeSlot) => void;
  onBookingClick?: (slot: EnhancedTimeSlot) => void;
  onFavoriteClick?: (venueId: string, venueName: string) => void;
}

// ChatGPT Apps API types
export interface OpenAIWindow {
  callTool: (params: {
    toolName: string;
    params: Record<string, any>;
  }) => Promise<any>;
  requestDisplayMode: (mode: 'inline' | 'fullscreen' | 'picture-in-picture') => void;
}

declare global {
  interface Window {
    openai?: OpenAIWindow;
    __WIDGET_PROPS__?: Record<string, any>;
    __WIDGET_SESSION_ID__?: string;
  }
}
