/**
 * Common widget hooks
 */

import { useState, useCallback, useEffect } from 'preact/hooks';
import type { EnhancedTimeSlot } from '../../types/index.js';

/**
 * Hook for managing widget session state
 */
export function useWidgetState(sessionId?: string) {
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const toggleSlot = useCallback((slotId: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }, []);

  const selectSlot = useCallback((slotId: string) => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        if (next.size < 4) {
          next.add(slotId);
        }
      }
      return next;
    });
  }, []);

  return {
    expandedSlots,
    selectedSlots,
    toggleSlot,
    selectSlot,
  };
}

/**
 * Hook for calling ChatGPT tools
 */
export function useChatGPTTool() {
  const callTool = useCallback(async (toolName: string, params: Record<string, any>) => {
    if (window.openai?.callTool) {
      return await window.openai.callTool({ toolName, params });
    }
    console.warn('ChatGPT API not available');
    return null;
  }, []);

  const requestDisplayMode = useCallback((mode: 'inline' | 'fullscreen' | 'picture-in-picture') => {
    if (window.openai?.requestDisplayMode) {
      window.openai.requestDisplayMode(mode);
    }
  }, []);

  return { callTool, requestDisplayMode };
}

/**
 * Hook for handling booking actions
 */
export function useBookingActions() {
  const { callTool } = useChatGPTTool();

  const handleBooking = useCallback(async (slot: EnhancedTimeSlot) => {
    // Track booking via ChatGPT
    await callTool('track_booking', {
      venue_id: slot.venue_id,
      start_time: slot.start_time,
      venue_name: slot.venue_name,
    });

    // Open booking URL
    if (slot.booking_url) {
      window.open(slot.booking_url, '_blank');
    }
  }, [callTool]);

  const handleFavorite = useCallback(async (venueId: string, venueName: string) => {
    await callTool('save_favorite_venue', {
      venue_id: venueId,
      venue_name: venueName,
    });
  }, [callTool]);

  return { handleBooking, handleFavorite };
}
