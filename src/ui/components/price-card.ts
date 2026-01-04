/**
 * Price Card Component
 *
 * Generates HTML cards for price comparison results.
 */

import { wrapWithStyles } from '../styles.js';

export interface PriceSlot {
  venue: string;
  venue_id: string;
  court: string;
  time: string;
  duration_minutes: number;
  price: number;
  price_per_hour: number;
  currency: string;
}

export interface VenuePrice {
  venue: string;
  min_price_per_hour: number;
  currency: string;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML for price comparison cards
 */
export function generatePriceComparisonHTML(params: {
  venuesByPrice: VenuePrice[];
  cheapestSlots: PriceSlot[];
  location: string;
  date: string;
  totalCompared: number;
}): string {
  const { venuesByPrice, cheapestSlots, location, date, totalCompared } = params;

  // Venue ranking section
  let venuesHtml = '';
  for (let i = 0; i < Math.min(venuesByPrice.length, 5); i++) {
    const venue = venuesByPrice[i];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    venuesHtml += `
      <div class="venue-price-row ${i === 0 ? 'best-deal' : ''}">
        <span class="rank">${medal}</span>
        <span class="venue-name">${escapeHtml(venue.venue)}</span>
        <span class="venue-price">${venue.currency}${venue.min_price_per_hour.toFixed(0)}/hr</span>
      </div>
    `;
  }

  // Cheapest slots section
  let slotsHtml = '';
  for (let i = 0; i < Math.min(cheapestSlots.length, 5); i++) {
    const slot = cheapestSlots[i];
    slotsHtml += `
      <div class="slot-price-row">
        <div class="slot-info">
          <span class="slot-price">${slot.currency}${slot.price.toFixed(0)}</span>
          <span class="slot-time">${slot.time}</span>
        </div>
        <div class="slot-details">
          <span class="slot-venue">${escapeHtml(slot.venue)}</span>
          <span class="slot-meta">${slot.court} · ${slot.duration_minutes}min</span>
        </div>
      </div>
    `;
  }

  const content = `
    <div class="price-comparison">
      <div class="comparison-header">
        <h2>💰 Price Comparison</h2>
        <p class="comparison-meta">Near "${escapeHtml(location)}" on ${date}</p>
        <p class="comparison-stats">${totalCompared} slots compared</p>
      </div>

      <div class="comparison-section">
        <h3>🏆 Cheapest Venues (per hour)</h3>
        <div class="venue-list">
          ${venuesHtml}
        </div>
      </div>

      <div class="comparison-section">
        <h3>⚡ Best Value Slots</h3>
        <div class="slots-list">
          ${slotsHtml}
        </div>
      </div>
    </div>

    <style>
      .price-comparison {
        background: #ffffff;
        border: 1px solid #e1e4e8;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }

      .comparison-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .comparison-header h2 {
        margin: 0 0 8px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1a1a2e;
      }

      .comparison-meta {
        color: #64748b;
        margin: 0;
        font-size: 14px;
      }

      .comparison-stats {
        color: #0d9488;
        margin: 4px 0 0 0;
        font-size: 13px;
        font-weight: 600;
      }

      .comparison-section {
        margin-bottom: 24px;
      }

      .comparison-section:last-child {
        margin-bottom: 0;
      }

      .comparison-section h3 {
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 600;
        color: #374151;
      }

      .venue-price-row {
        display: flex;
        align-items: center;
        padding: 12px;
        background: #f8fafc;
        border-radius: 10px;
        margin-bottom: 8px;
      }

      .venue-price-row.best-deal {
        background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
        border: 1px solid #0d9488;
      }

      .rank {
        font-size: 18px;
        width: 32px;
        text-align: center;
      }

      .venue-name {
        flex: 1;
        font-weight: 500;
        color: #1a1a2e;
      }

      .venue-price {
        font-weight: 700;
        color: #0d9488;
        font-size: 16px;
      }

      .slot-price-row {
        display: flex;
        align-items: center;
        padding: 12px;
        background: #f8fafc;
        border-radius: 10px;
        margin-bottom: 8px;
        gap: 16px;
      }

      .slot-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 70px;
      }

      .slot-price {
        font-size: 20px;
        font-weight: 700;
        color: #0d9488;
      }

      .slot-time {
        font-size: 12px;
        color: #64748b;
      }

      .slot-details {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .slot-venue {
        font-weight: 600;
        color: #1a1a2e;
      }

      .slot-meta {
        font-size: 13px;
        color: #64748b;
      }
    </style>
  `;

  return wrapWithStyles(content);
}
