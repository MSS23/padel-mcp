/**
 * Slot Cards Widget
 *
 * Displays available padel court slots as expandable cards with weather,
 * pricing, and booking actions.
 */

import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import type { EnhancedTimeSlot } from '../../types/index.js';
import { useWidgetState, useBookingActions } from '../common/hooks.js';
import '../global.d.js';

export interface SlotCardsWidgetProps {
  slots: EnhancedTimeSlot[];
  groupByVenue?: boolean;
  widgetSessionId?: string;
  title?: string;
  enableBooking?: boolean;
}

export function SlotCardsWidget(props: SlotCardsWidgetProps) {
  const { slots, groupByVenue = true, title, enableBooking = true } = props;
  const { expandedSlots, toggleSlot } = useWidgetState(props.widgetSessionId);
  const { handleBooking, handleFavorite } = useBookingActions();

  if (slots.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p>No available slots found.</p>
        </div>
      </div>
    );
  }

  if (groupByVenue) {
    // Group slots by venue
    const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
    for (const slot of slots) {
      const venueSlots = slotsByVenue.get(slot.venue_name) || [];
      venueSlots.push(slot);
      slotsByVenue.set(slot.venue_name, venueSlots);
    }

    return (
      <div style={styles.container}>
        {title && <h2 style={styles.title}>{title}</h2>}
        {Array.from(slotsByVenue.entries()).map(([venueName, venueSlots]) => (
          <VenueGroup
            key={venueName}
            venueName={venueName}
            slots={venueSlots}
            expandedSlots={expandedSlots}
            onToggleSlot={toggleSlot}
            onBooking={handleBooking}
            onFavorite={handleFavorite}
            enableBooking={enableBooking}
          />
        ))}
      </div>
    );
  }

  // Flat list of slots
  return (
    <div style={styles.container}>
      {title && <h2 style={styles.title}>{title}</h2>}
      <div style={styles.slotsGrid}>
        {slots.map(slot => (
          <SlotCard
            key={`${slot.venue_id}-${slot.start_time}`}
            slot={slot}
            isExpanded={expandedSlots.has(`${slot.venue_id}-${slot.start_time}`)}
            onToggle={() => toggleSlot(`${slot.venue_id}-${slot.start_time}`)}
            onBooking={() => handleBooking(slot)}
            onFavorite={() => handleFavorite(slot.venue_id, slot.venue_name)}
            enableBooking={enableBooking}
          />
        ))}
      </div>
    </div>
  );
}

function VenueGroup({
  venueName,
  slots,
  expandedSlots,
  onToggleSlot,
  onBooking,
  onFavorite,
  enableBooking = true,
}: {
  venueName: string;
  slots: EnhancedTimeSlot[];
  expandedSlots: Set<string>;
  onToggleSlot: (id: string) => void;
  onBooking: (slot: EnhancedTimeSlot) => void;
  onFavorite: (venueId: string, venueName: string) => void;
  enableBooking?: boolean;
}) {
  const firstSlot = slots[0];
  const distance = (firstSlot as any).distance_km;

  return (
    <div style={styles.venueGroup}>
      <div style={styles.venueHeader}>
        <h3 style={styles.venueName}>{venueName}</h3>
        {distance && <span style={styles.distance}>{distance}km away</span>}
        <button
          style={styles.favoriteButton}
          onClick={() => onFavorite(firstSlot.venue_id, venueName)}
          title="Add to favorites"
        >
          ⭐
        </button>
      </div>
      {firstSlot.venue_address && (
        <p style={styles.venueAddress}>📍 {firstSlot.venue_address}</p>
      )}
      <div style={styles.slotsList}>
        {slots.map(slot => (
          <SlotCard
            key={`${slot.venue_id}-${slot.start_time}`}
            slot={slot}
            isExpanded={expandedSlots.has(`${slot.venue_id}-${slot.start_time}`)}
            onToggle={() => onToggleSlot(`${slot.venue_id}-${slot.start_time}`)}
            onBooking={() => onBooking(slot)}
            onFavorite={() => onFavorite(slot.venue_id, slot.venue_name)}
            enableBooking={enableBooking}
          />
        ))}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  isExpanded,
  onToggle,
  onBooking,
  onFavorite,
  enableBooking = true,
}: {
  slot: EnhancedTimeSlot;
  isExpanded: boolean;
  onToggle: () => void;
  onBooking: () => void;
  onFavorite: () => void;
  enableBooking?: boolean;
}) {
  const startTime = slot.start_time.split('T')[1]?.substring(0, 5) || '';
  const endTime = slot.end_time.split('T')[1]?.substring(0, 5) || '';

  return (
    <div style={styles.slotCard}>
      <div style={styles.slotHeader} onClick={onToggle}>
        <div style={styles.slotTime}>
          <strong>{startTime} - {endTime}</strong>
          <span style={styles.courtName}>{slot.court_name}</span>
        </div>
        <div style={styles.slotPrice}>
          {slot.currency}{slot.price.toFixed(2)}
          <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.slotDetails}>
          {slot.weather && (
            <div style={styles.weather}>
              <span>{slot.weather.condition_emoji}</span>
              <span>{slot.weather.temperature_c}°C</span>
              <span>{slot.weather.condition}</span>
              {slot.weather.precipitation_chance > 0 && (
                <span>{slot.weather.precipitation_chance}% rain</span>
              )}
            </div>
          )}
          <div style={styles.slotActions}>
            {enableBooking && (
              <button
                style={styles.bookButton}
                onClick={async () => {
                  // Call book_court tool via ChatGPT API
                  if (window.openai?.callTool) {
                    try {
                      await window.openai.callTool({
                        toolName: 'book_court',
                        params: {
                          venue_id: slot.venue_id,
                          venue_name: slot.venue_name,
                          start_time: slot.start_time,
                          duration_minutes: slot.duration_minutes || 90,
                          price: slot.price,
                          currency: slot.currency || 'GBP',
                          court_name: slot.court_name,
                        },
                      });
                    } catch (error) {
                      console.error('Booking error:', error);
                      // Fallback to booking URL if tool call fails
                      if (slot.booking_url) {
                        window.open(slot.booking_url, '_blank');
                      }
                    }
                  } else if (slot.booking_url) {
                    // Fallback to direct booking URL
                    window.open(slot.booking_url, '_blank');
                  }
                }}
                data-action="book"
                data-venue-id={slot.venue_id}
                data-venue-name={slot.venue_name}
                data-start-time={slot.start_time}
                data-duration-minutes={slot.duration_minutes || 90}
                data-price={slot.price}
                data-currency={slot.currency || 'GBP'}
                data-court-name={slot.court_name}
              >
                📅 Book Now
              </button>
            )}
            {slot.calendar_link && (
              <a href={slot.calendar_link} style={styles.calendarLink} target="_blank" rel="noopener noreferrer">
                📅 Add to Calendar
              </a>
            )}
            <button
              style={styles.favoriteButtonSmall}
              onClick={onFavorite}
              title="Add to favorites"
            >
              ⭐ Favorite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    maxWidth: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  venueGroup: {
    marginBottom: '24px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  },
  venueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  venueName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  distance: {
    fontSize: '14px',
    color: '#666',
  },
  favoriteButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  venueAddress: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  },
  slotsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  slotCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  slotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9',
  },
  slotTime: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  courtName: {
    fontSize: '12px',
    color: '#666',
  },
  slotPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c5aa0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#999',
  },
  slotDetails: {
    padding: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  weather: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    marginBottom: '12px',
    color: '#666',
  },
  slotActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  bookButton: {
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  calendarLink: {
    color: '#2c5aa0',
    textDecoration: 'none',
    fontSize: '14px',
  },
  favoriteButtonSmall: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
};
