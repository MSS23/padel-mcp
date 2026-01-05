/**
 * Slot Card Component
 *
 * Generates interactive HTML cards for padel court time slots.
 * Each card shows venue, time, price, weather, and action buttons.
 * Features expandable cards, quick actions, compare mode, and checkout flow.
 */

import type { EnhancedTimeSlot } from '../../types/index.js';
import { wrapWithStyles } from '../styles.js';
import { generateInteractiveSearchHTML } from './interactive-search.js';
import { generateSearchBarHTML, getSearchBarScripts, getSearchBarStyles } from './search-bar.js';
import { getCheckoutStyles } from './checkout-flow.js';

/**
 * Format time from ISO string to HH:mm
 */
function formatTime(isoTime: string): string {
  return isoTime.split('T')[1]?.substring(0, 5) ?? '';
}

/**
 * Format time for display (9:00 AM style)
 */
function formatTimeDisplay(isoTime: string): string {
  const time = formatTime(isoTime);
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
 * Generate a unique ID for a slot
 */
function generateSlotId(slot: EnhancedTimeSlot): string {
  return `slot-${slot.venue_id}-${slot.start_time.replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Determine availability status based on time and other factors
 */
function getAvailabilityStatus(slot: EnhancedTimeSlot): { badge: string; class: string } | null {
  const slotTime = new Date(slot.start_time);
  const hour = slotTime.getHours();
  const dayOfWeek = slotTime.getDay();

  // Weekend evenings are popular
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isEvening = hour >= 18 && hour <= 21;
  const isPrimetime = hour >= 19 && hour <= 20;

  if (isPrimetime && isWeekend) {
    return { badge: 'Last few!', class: 'last-few' };
  }
  if (isEvening || isWeekend) {
    return { badge: 'Popular time', class: 'filling-fast' };
  }
  return null;
}

/**
 * Generate HTML for a single slot card with expandable details and quick actions
 */
export function generateSlotCardHTML(slot: EnhancedTimeSlot, options?: {
  showVenueName?: boolean;
  compact?: boolean;
  enableCompare?: boolean;
  cardIndex?: number;
}): string {
  const { showVenueName = true, compact = false, enableCompare = true, cardIndex = 0 } = options ?? {};

  const slotId = generateSlotId(slot);
  const startTime = formatTime(slot.start_time);
  const endTime = formatTime(slot.end_time);
  const venueName = escapeHtml(slot.venue_name);
  const courtName = escapeHtml(slot.court_name);
  const venueAddress = slot.venue_address ? escapeHtml(slot.venue_address) : '';
  const availabilityStatus = getAvailabilityStatus(slot);

  // Calculate price per hour for comparison
  const pricePerHour = (slot.price / slot.duration_minutes) * 60;
  const pricePerHourDisplay = pricePerHour % 1 === 0 ? pricePerHour.toFixed(0) : pricePerHour.toFixed(2);

  // Weather grid for expanded view
  let weatherGridHtml = '';
  let weatherBadgeHtml = '';
  if (slot.weather) {
    const playabilityClass = slot.weather.is_playable ? 'playable' : 'not-playable';
    weatherBadgeHtml = `
      <span class="weather-badge ${playabilityClass}">
        ${slot.weather.condition_emoji} ${slot.weather.temperature_c}°C
      </span>
    `;
    weatherGridHtml = `
      <div class="weather-grid">
        <div class="weather-item">
          <span class="weather-icon">${slot.weather.condition_emoji}</span>
          <span class="weather-label">Condition</span>
          <span class="weather-value">${escapeHtml(slot.weather.condition)}</span>
        </div>
        <div class="weather-item">
          <span class="weather-icon">🌡️</span>
          <span class="weather-label">Temperature</span>
          <span class="weather-value">${slot.weather.temperature_c}°C</span>
        </div>
        <div class="weather-item">
          <span class="weather-icon">🤔</span>
          <span class="weather-label">Feels Like</span>
          <span class="weather-value">${slot.weather.feels_like_c}°C</span>
        </div>
        <div class="weather-item">
          <span class="weather-icon">💨</span>
          <span class="weather-label">Wind</span>
          <span class="weather-value">${slot.weather.wind_speed_kmh} km/h</span>
        </div>
        <div class="weather-item">
          <span class="weather-icon">🌧️</span>
          <span class="weather-label">Rain Chance</span>
          <span class="weather-value">${slot.weather.precipitation_chance}%</span>
        </div>
        <div class="weather-item playability-item ${playabilityClass}">
          <span class="weather-icon">${slot.weather.is_playable ? '✅' : '⚠️'}</span>
          <span class="weather-label">Playability</span>
          <span class="weather-value">${slot.weather.playability_note ? escapeHtml(slot.weather.playability_note) : (slot.weather.is_playable ? 'Good conditions' : 'Check conditions')}</span>
        </div>
      </div>
    `;
  }

  // Booking URL (escaped for JavaScript)
  const bookingUrl = slot.booking_url ? escapeHtml(slot.booking_url) : '';
  const calendarLink = slot.calendar_link ? escapeHtml(slot.calendar_link) : '';

  // Price formatting - remove trailing zeros
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  // Quick actions overlay
  const quickActionsHtml = `
    <div class="quick-actions">
      ${enableCompare ? `
        <button class="quick-action-btn" onclick="event.stopPropagation(); CompareMode.toggle('${slotId}', this)" title="Compare">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H2v7m15-7h7v7M9 19H2v-7m15 7h7v-7"/>
          </svg>
        </button>
      ` : ''}
      <button class="quick-action-btn" onclick="event.stopPropagation(); shareSlot('${slotId}', '${venueName}', '${startTime}')" title="Share">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      <button class="quick-action-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${slotId}', this)" title="Favorite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
  `;

  // Availability badge
  const availabilityBadgeHtml = availabilityStatus
    ? `<span class="availability-badge ${availabilityStatus.class}">${availabilityStatus.badge}</span>`
    : '';

  const cardHtml = `
    <div class="slot-card" id="${slotId}" data-venue-id="${escapeHtml(slot.venue_id)}" data-slot-time="${escapeHtml(slot.start_time)}" style="animation-delay: ${cardIndex * 50}ms" onclick="toggleCardExpand(this)">
      ${quickActionsHtml}

      <div class="slot-header">
        ${showVenueName ? `
          <div class="slot-header-main">
            <h3>${venueName}</h3>
            <div class="slot-header-badges">
              ${availabilityBadgeHtml}
              ${weatherBadgeHtml}
            </div>
          </div>
        ` : `
          <div class="slot-header-main">
            <h3>${startTime} - ${endTime}</h3>
            <div class="slot-header-badges">
              ${availabilityBadgeHtml}
              ${weatherBadgeHtml}
            </div>
          </div>
        `}
        <div class="slot-price-section">
          <span class="price">${slot.currency}${priceDisplay}</span>
          <span class="price-per-hour">${slot.currency}${pricePerHourDisplay}/hr</span>
        </div>
      </div>

      <div class="slot-details">
        ${showVenueName ? `<p><span class="time">${startTime} - ${endTime}</span> · ${slot.duration_minutes}min</p>` : `<p>${slot.duration_minutes}min session</p>`}
        <p class="court-name">${courtName}</p>
        ${venueAddress && showVenueName ? `<p class="venue-address">${venueAddress}</p>` : ''}
      </div>

      <div class="slot-expanded-content">
        ${weatherGridHtml}

        <div class="price-breakdown">
          <div class="price-breakdown-item">
            <span>Court rental</span>
            <span>${slot.currency}${priceDisplay}</span>
          </div>
          <div class="price-breakdown-item">
            <span>Duration</span>
            <span>${slot.duration_minutes} minutes</span>
          </div>
          <div class="price-breakdown-item total">
            <span>Per hour rate</span>
            <span>${slot.currency}${pricePerHourDisplay}/hr</span>
          </div>
        </div>

        ${slot.venue_phone ? `
          <div class="venue-contact">
            <a href="tel:${escapeHtml(slot.venue_phone)}" class="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              ${escapeHtml(slot.venue_phone)}
            </a>
          </div>
        ` : ''}
      </div>

      <div class="slot-actions">
        ${bookingUrl ? `
          <button class="btn btn-primary" onclick="event.stopPropagation(); openCheckout('${escapeForJS(slot.venue_id)}', '${escapeForJS(venueName)}', '${escapeForJS(courtName)}', '${slot.start_time.split('T')[0]}', '${startTime}', '${endTime}', ${slot.duration_minutes}, ${slot.price}, '${slot.currency}', '${escapeForJS(bookingUrl)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Book Now
          </button>
          <a href="${bookingUrl}" target="_blank" class="btn btn-ghost" onclick="event.stopPropagation();">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            External
          </a>
        ` : ''}
        ${calendarLink ? `
          <button class="btn btn-secondary" onclick="event.stopPropagation(); addToCalendar('${calendarLink}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Calendar
          </button>
        ` : ''}
      </div>

      <div class="card-expand-indicator">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  `;

  return cardHtml;
}

/**
 * Generate HTML for multiple slot cards grouped by venue
 */
export function generateSlotCardsHTML(slots: EnhancedTimeSlot[], options?: {
  groupByVenue?: boolean;
  maxSlotsPerVenue?: number;
  title?: string;
  enableCompare?: boolean;
  searchParams?: {
    location?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
    maxDistanceKm?: number;
  };
}): string {
  const { groupByVenue = true, maxSlotsPerVenue = 5, title, enableCompare = true, searchParams } = options ?? {};

  if (slots.length === 0) {
    return wrapWithStyles(`
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h3>No available slots found</h3>
        <p class="text-muted">Try adjusting your search criteria</p>
      </div>
    `);
  }

  let content = '';

  // Add interactive search panel at the top (collapsed by default for results)
  if (searchParams) {
    const searchHtml = generateInteractiveSearchHTML({
      location: searchParams.location,
      date: searchParams.date,
      timeStart: searchParams.timeStart,
      timeEnd: searchParams.timeEnd,
      maxDistanceKm: searchParams.maxDistanceKm,
      collapsed: true, // Collapsed when showing results
    });
    // Extract content between <body> tags
    const bodyMatch = searchHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content += bodyMatch[1];
    }
  }

  if (title) {
    content += `<h2 class="results-title">${escapeHtml(title)}</h2>`;
  }

  // Results summary bar
  content += `
    <div class="results-summary">
      <span class="results-count">${slots.length} slot${slots.length !== 1 ? 's' : ''} found</span>
      ${enableCompare ? `
        <button class="btn btn-text compare-toggle" onclick="CompareMode.toggleMode(this)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H2v7m15-7h7v7M9 19H2v-7m15 7h7v-7"/>
          </svg>
          Compare
        </button>
      ` : ''}
    </div>
  `;

  let cardIndex = 0;

  if (groupByVenue) {
    // Group slots by venue
    const slotsByVenue = new Map<string, EnhancedTimeSlot[]>();
    for (const slot of slots) {
      const venueSlots = slotsByVenue.get(slot.venue_name) ?? [];
      venueSlots.push(slot);
      slotsByVenue.set(slot.venue_name, venueSlots);
    }

    for (const [venueName, venueSlots] of slotsByVenue) {
      const firstSlot = venueSlots[0];
      const distanceInfo = (firstSlot as any).distance_km
        ? ` · ${(firstSlot as any).distance_km}km`
        : '';

      // Calculate venue stats
      const prices = venueSlots.map(s => s.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = minPrice === maxPrice
        ? `${firstSlot.currency}${minPrice}`
        : `${firstSlot.currency}${minPrice} - ${firstSlot.currency}${maxPrice}`;

      content += `
        <div class="venue-group">
          <div class="venue-header">
            <div class="venue-header-main">
              <h3>${escapeHtml(venueName)}</h3>
              ${firstSlot.venue_address || distanceInfo ? `<p class="venue-location">${firstSlot.venue_address ? escapeHtml(firstSlot.venue_address) : ''}${distanceInfo}</p>` : ''}
            </div>
            <div class="venue-stats">
              <span class="venue-price-range">${priceRange}</span>
              <span class="venue-slot-count">${venueSlots.length} slot${venueSlots.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="venue-slots">
      `;

      const slotsToShow = venueSlots.slice(0, maxSlotsPerVenue);
      for (const slot of slotsToShow) {
        content += generateSlotCardHTML(slot, {
          showVenueName: false,
          enableCompare,
          cardIndex: cardIndex++,
        });
      }

      if (venueSlots.length > maxSlotsPerVenue) {
        const remainingCount = venueSlots.length - maxSlotsPerVenue;
        content += `
          <button class="btn btn-text show-more-btn" onclick="showMoreSlots(this, '${escapeHtml(venueName)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            Show ${remainingCount} more slot${remainingCount !== 1 ? 's' : ''}
          </button>
        `;
      }

      content += '</div></div>';
    }
  } else {
    // Show all slots without grouping
    content += '<div class="slots-list">';
    for (const slot of slots) {
      content += generateSlotCardHTML(slot, {
        showVenueName: true,
        enableCompare,
        cardIndex: cardIndex++,
      });
    }
    content += '</div>';
  }

  // Compare bar (hidden by default)
  if (enableCompare) {
    content += `
      <div id="compare-bar" class="compare-bar hidden">
        <div class="compare-bar-content">
          <span class="compare-count">0 selected</span>
          <div class="compare-bar-actions">
            <button class="btn btn-text" onclick="CompareMode.clear()">Clear</button>
            <button class="btn btn-primary" onclick="CompareMode.compare()">Compare</button>
          </div>
        </div>
      </div>
    `;
  }

  // Add checkout modal container
  content += `<div id="checkout-modal-container"></div>`;

  // Add checkout scripts
  content += `
    <script>
      ${getSearchBarScripts()}

      function openCheckout(venueId, venueName, courtName, date, startTime, endTime, duration, price, currency, bookingUrl) {
        var slot = {
          venueId: venueId,
          venueName: venueName,
          courtName: courtName,
          date: date,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          price: price,
          currency: currency,
          bookingUrl: bookingUrl
        };

        // Store slot data
        window.checkoutSlot = slot;

        // Show checkout modal
        var container = document.getElementById('checkout-modal-container');
        if (container) {
          container.innerHTML = generateCheckoutHTML(slot, 'review');
          document.body.style.overflow = 'hidden';
        }
      }

      function generateCheckoutHTML(slot, step) {
        var bookingRef = 'PF-' + slot.date.replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        window.bookingRef = bookingRef;

        var steps = ['Review', 'Details', 'Payment', 'Done'];
        var stepIdx = {review: 0, details: 1, payment: 2, confirmation: 3}[step];

        var stepIndicator = '<div class="checkout-steps">' + steps.map(function(label, i) {
          return '<div class="checkout-step ' + (i < stepIdx ? 'completed' : '') + ' ' + (i === stepIdx ? 'active' : '') + '">' +
            '<div class="step-circle">' + (i < stepIdx ? '✓' : (i + 1)) + '</div>' +
            '<span class="step-label">' + label + '</span>' +
            '</div>' + (i < steps.length - 1 ? '<div class="step-line"></div>' : '');
        }).join('') + '</div>';

        var stepContent = '';
        if (step === 'review') {
          stepContent = generateReviewStep(slot);
        } else if (step === 'details') {
          stepContent = generateDetailsStep(slot);
        } else if (step === 'payment') {
          stepContent = generatePaymentStep(slot);
        } else if (step === 'confirmation') {
          stepContent = generateConfirmationStep(slot, bookingRef);
        }

        return '<div class="checkout-modal-overlay active" id="checkout-modal" onclick="if(event.target===this)closeCheckout()">' +
          '<div class="checkout-modal">' +
            '<button class="checkout-close" onclick="closeCheckout()">×</button>' +
            '<div class="checkout-header">' +
              '<h2>' + (step === 'confirmation' ? 'Booking Complete' : 'Book Your Court') + '</h2>' +
              stepIndicator +
            '</div>' +
            '<div id="checkout-container">' + stepContent + '</div>' +
          '</div>' +
        '</div>';
      }

      function formatTimeAMPM(time) {
        var parts = time.split(':');
        var hours = parseInt(parts[0]);
        var mins = parts[1];
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return hours + ':' + mins + ' ' + ampm;
      }

      function formatDateDisplay(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }

      function generateReviewStep(slot) {
        return '<div class="checkout-content">' +
          '<div class="booking-card">' +
            '<div class="booking-venue"><div class="venue-icon">🎾</div><div class="venue-info"><h3>' + slot.venueName + '</h3><p>' + slot.courtName + '</p></div></div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-item"><span class="detail-icon">📅</span><span class="detail-label">Date</span><span class="detail-value">' + formatDateDisplay(slot.date) + '</span></div>' +
              '<div class="detail-item"><span class="detail-icon">⏰</span><span class="detail-label">Time</span><span class="detail-value">' + formatTimeAMPM(slot.startTime) + ' - ' + formatTimeAMPM(slot.endTime) + '</span></div>' +
              '<div class="detail-item"><span class="detail-icon">⏱️</span><span class="detail-label">Duration</span><span class="detail-value">' + slot.duration + ' min</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="price-summary">' +
            '<div class="price-row"><span>Court rental</span><span>' + slot.currency + slot.price + '</span></div>' +
            '<div class="price-row"><span>Booking fee</span><span>Free</span></div>' +
            '<div class="price-row total"><span>Total</span><span>' + slot.currency + slot.price + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="checkout-actions">' +
          '<button class="btn btn-secondary" onclick="closeCheckout()">Cancel</button>' +
          "<button class=\"btn btn-primary\" onclick=\"goToStep('details')\">Continue</button>" +
        '</div>';
      }

      function generateDetailsStep(slot) {
        return '<div class="checkout-content">' +
          '<div class="form-section"><h4>Player Information</h4>' +
            '<div class="form-group"><label>Full Name</label><input type="text" id="player-name" value="Demo Player" /></div>' +
            '<div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="player-email" value="demo@example.com" /></div>' +
            '<div class="form-group"><label>Phone</label><input type="tel" id="player-phone" value="+34 612 345 678" /></div></div>' +
          '</div>' +
          '<div class="form-section"><h4>Additional Players (Optional)</h4>' +
            '<div class="players-note"><span class="note-icon">ℹ️</span><span>Add other players or invite them later</span></div>' +
            '<div class="form-group"><input type="text" placeholder="Player 2 name or email" /></div>' +
            '<div class="form-group"><input type="text" placeholder="Player 3 name or email" /></div>' +
          '</div>' +
        '</div>' +
        '<div class="checkout-actions">' +
          "<button class=\"btn btn-secondary\" onclick=\"goToStep('review')\">Back</button>" +
          "<button class=\"btn btn-primary\" onclick=\"goToStep('payment')\">Continue to Payment</button>" +
        '</div>';
      }

      function generatePaymentStep(slot) {
        return '<div class="checkout-content">' +
          '<div class="payment-amount"><span class="amount-label">Amount to pay</span><span class="amount-value">' + slot.currency + slot.price + '</span></div>' +
          '<div class="payment-form">' +
            '<div class="card-preview"><div class="card-type" id="card-type-icon">💳</div><div class="card-number-display" id="card-display">•••• •••• •••• ••••</div></div>' +
            '<div class="form-group"><label>Card Number</label><input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatCardNumber(this)" /><span class="input-hint">Any 16 digits work for demo</span></div>' +
            '<div class="form-row"><div class="form-group"><label>Expiry</label><input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5" oninput="formatExpiry(this)" /></div>' +
            '<div class="form-group"><label>CVV</label><input type="text" id="card-cvv" placeholder="123" maxlength="3" /></div></div>' +
            '<div class="form-group"><label>Name on Card</label><input type="text" id="card-name" value="DEMO USER" style="text-transform:uppercase" /></div>' +
          '</div>' +
          '<div class="secure-badge"><span class="lock-icon">🔒</span><span>Secure payment (Demo Mode)</span></div>' +
        '</div>' +
        '<div class="checkout-actions">' +
          "<button class=\"btn btn-secondary\" onclick=\"goToStep('details')\">Back</button>" +
          '<button class="btn btn-primary" id="pay-btn" onclick="processPayment()">Pay ' + slot.currency + slot.price + '</button>' +
        '</div>';
      }

      function generateConfirmationStep(slot, ref) {
        return '<div class="checkout-content confirmation-content">' +
          '<div class="success-animation"><div class="success-circle"><svg class="checkmark" viewBox="0 0 52 52"><circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></div></div>' +
          '<h2 class="confirmation-title">Booking Confirmed!</h2>' +
          '<p class="booking-ref">Reference: <strong>' + ref + '</strong></p>' +
          '<div class="confirmation-card">' +
            '<div class="confirmation-venue"><span class="venue-emoji">🎾</span><div><h4>' + slot.venueName + '</h4><p>' + slot.courtName + '</p></div></div>' +
            '<div class="confirmation-details">' +
              '<div class="conf-detail"><span class="conf-icon">📅</span><span>' + formatDateDisplay(slot.date) + '</span></div>' +
              '<div class="conf-detail"><span class="conf-icon">⏰</span><span>' + formatTimeAMPM(slot.startTime) + ' - ' + formatTimeAMPM(slot.endTime) + '</span></div>' +
              '<div class="conf-detail"><span class="conf-icon">💰</span><span>' + slot.currency + slot.price + ' paid</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="confirmation-actions">' +
            '<button class="btn btn-secondary" onclick="addCalendarFromConfirm()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Add to Calendar</button>' +
            '<button class="btn btn-secondary" onclick="shareBookingRef()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</button>' +
          '</div>' +
        '</div>' +
        '<div class="checkout-actions"><button class="btn btn-primary full-width" onclick="closeCheckout()">Done</button></div>';
      }

      function goToStep(step) {
        var container = document.getElementById('checkout-modal-container');
        if (container && window.checkoutSlot) {
          container.innerHTML = generateCheckoutHTML(window.checkoutSlot, step);
        }
      }

      function formatCardNumber(input) {
        var v = input.value.replace(/\\s+/g, '').replace(/[^0-9]/gi, '');
        var parts = [];
        for (var i = 0; i < v.length && i < 16; i += 4) {
          parts.push(v.substring(i, i + 4));
        }
        input.value = parts.join(' ');
        var display = document.getElementById('card-display');
        if (display) display.textContent = input.value || '•••• •••• •••• ••••';
        var typeIcon = document.getElementById('card-type-icon');
        if (typeIcon && v.length > 0) {
          if (v[0] === '4') typeIcon.textContent = '💳 Visa';
          else if (v[0] === '5') typeIcon.textContent = '💳 Mastercard';
          else if (v[0] === '3') typeIcon.textContent = '💳 Amex';
          else typeIcon.textContent = '💳';
        }
      }

      function formatExpiry(input) {
        var v = input.value.replace(/\\D/g, '');
        if (v.length >= 2) input.value = v.substring(0, 2) + '/' + v.substring(2, 4);
        else input.value = v;
      }

      function processPayment() {
        var cardNum = (document.getElementById('card-number').value || '').replace(/\\s/g, '');
        var expiry = document.getElementById('card-expiry').value || '';
        var cvv = document.getElementById('card-cvv').value || '';
        if (cardNum.length < 16) { ToastSystem.error('Enter a valid card number'); return; }
        if (expiry.length < 5) { ToastSystem.error('Enter expiry date'); return; }
        if (cvv.length < 3) { ToastSystem.error('Enter CVV'); return; }
        var btn = document.getElementById('pay-btn');
        setButtonLoading(btn, true);
        setTimeout(function() {
          setButtonSuccess(btn);
          ToastSystem.success('Payment successful!', 'Booking Confirmed');
          setTimeout(function() { goToStep('confirmation'); }, 800);
        }, 1500);
      }

      function closeCheckout() {
        var container = document.getElementById('checkout-modal-container');
        if (container) container.innerHTML = '';
        document.body.style.overflow = '';
      }

      function addCalendarFromConfirm() {
        var slot = window.checkoutSlot;
        if (!slot) return;
        var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Padel - ' + slot.venueName) +
          '&dates=' + slot.date.replace(/-/g, '') + 'T' + slot.startTime.replace(/:/g, '') + '00/' + slot.date.replace(/-/g, '') + 'T' + slot.endTime.replace(/:/g, '') + '00';
        window.open(url, '_blank');
        ToastSystem.success('Opening calendar...', 'Add Event');
      }

      function shareBookingRef() {
        var slot = window.checkoutSlot;
        var ref = window.bookingRef;
        var text = 'Padel booked! ' + slot.venueName + ' on ' + slot.date + ' at ' + slot.startTime + '. Ref: ' + ref;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          ToastSystem.success('Copied to clipboard!', 'Share');
        }
      }
    </script>
  `;

  // Add additional styles
  const additionalStyles = getSearchBarStyles() + getCheckoutStyles();

  return wrapWithStyles(content, additionalStyles);
}

/**
 * Escape HTML for use in JavaScript strings
 */
function escapeForJS(text: string): string {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
