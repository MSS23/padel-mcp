/**
 * Price Comparison Widget
 *
 * Compares pricing across venues with bar chart visualization.
 */

import { h } from 'preact';
import type { EnhancedTimeSlot } from '../../types/index.js';

export interface PriceComparisonWidgetProps {
  slots: EnhancedTimeSlot[];
  widgetSessionId?: string;
}

export function PriceComparisonWidget(props: PriceComparisonWidgetProps) {
  const { slots } = props;

  // Group by venue and calculate average price
  const venueStats = new Map<string, { name: string; prices: number[]; slots: EnhancedTimeSlot[] }>();
  
  for (const slot of slots) {
    const stats = venueStats.get(slot.venue_name) || {
      name: slot.venue_name,
      prices: [],
      slots: [],
    };
    stats.prices.push(slot.price);
    stats.slots.push(slot);
    venueStats.set(slot.venue_name, stats);
  }

  const venues = Array.from(venueStats.values())
    .map(stats => ({
      ...stats,
      avgPrice: stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length,
      minPrice: Math.min(...stats.prices),
      maxPrice: Math.max(...stats.prices),
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice);

  const maxPrice = Math.max(...venues.map(v => v.maxPrice));

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Price Comparison</h2>
      <div style={styles.chart}>
        {venues.map(venue => (
          <VenueBar
            key={venue.name}
            venue={venue}
            maxPrice={maxPrice}
          />
        ))}
      </div>
    </div>
  );
}

function VenueBar({
  venue,
  maxPrice,
}: {
  venue: { name: string; avgPrice: number; minPrice: number; maxPrice: number; slots: EnhancedTimeSlot[] };
  maxPrice: number;
}) {
  const avgWidth = (venue.avgPrice / maxPrice) * 100;
  const minWidth = (venue.minPrice / maxPrice) * 100;
  const maxWidth = (venue.maxPrice / maxPrice) * 100;

  return (
    <div style={styles.barContainer}>
      <div style={styles.venueName}>{venue.name}</div>
      <div style={styles.barWrapper}>
        <div style={styles.barBackground}>
          <div
            style={{
              ...styles.barRange,
              left: `${minWidth}%`,
              width: `${maxWidth - minWidth}%`,
            }}
          />
          <div
            style={{
              ...styles.barAvg,
              left: `${avgWidth}%`,
            }}
          />
        </div>
        <div style={styles.priceLabels}>
          <span style={styles.minPrice}>£{venue.minPrice.toFixed(0)}</span>
          <span style={styles.avgPrice}>£{venue.avgPrice.toFixed(0)} avg</span>
          <span style={styles.maxPrice}>£{venue.maxPrice.toFixed(0)}</span>
        </div>
      </div>
      <div style={styles.slotCount}>{venue.slots.length} slots</div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  chart: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  venueName: {
    minWidth: '150px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  barWrapper: {
    flex: 1,
    position: 'relative' as const,
  },
  barBackground: {
    height: '40px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    position: 'relative' as const,
  },
  barRange: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(44, 90, 160, 0.2)',
  },
  barAvg: {
    position: 'absolute' as const,
    top: 0,
    width: '2px',
    height: '100%',
    backgroundColor: '#2c5aa0',
  },
  priceLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '12px',
    color: '#666',
  },
  minPrice: {},
  avgPrice: {
    fontWeight: 'bold',
  },
  maxPrice: {},
  slotCount: {
    minWidth: '80px',
    fontSize: '12px',
    color: '#666',
    textAlign: 'right' as const,
  },
};
