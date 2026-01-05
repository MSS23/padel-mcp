/**
 * Booking Confirmation Modal Component
 *
 * Shows a confirmation modal before redirecting to booking.
 * Includes booking summary, weather notice, and action buttons.
 */

import { wrapWithStyles } from '../styles.js';

export interface BookingDetails {
  venueName: string;
  courtName?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  price: string;
  currency?: string;
  bookingUrl: string;
  weather?: {
    condition: string;
    conditionEmoji: string;
    temperature: number;
    isPlayable: boolean;
    playabilityNote?: string;
  };
}

/**
 * Generate HTML for the booking confirmation modal
 */
export function generateBookingModalHTML(details: BookingDetails): string {
  const {
    venueName,
    courtName,
    date,
    startTime,
    endTime,
    duration,
    price,
    bookingUrl,
    weather,
  } = details;

  // Weather notice
  let weatherNoticeHtml = '';
  if (weather) {
    const noticeClass = weather.isPlayable ? 'info' : 'warning';
    const icon = weather.isPlayable ? 'ℹ️' : '⚠️';
    weatherNoticeHtml = `
      <div class="modal-notice ${noticeClass}">
        <span class="notice-icon">${icon}</span>
        <div class="notice-content">
          <strong>Weather: ${weather.conditionEmoji} ${weather.condition}, ${weather.temperature}°C</strong>
          ${weather.playabilityNote ? `<p>${escapeHtml(weather.playabilityNote)}</p>` : ''}
        </div>
      </div>
    `;
  }

  const content = `
    <div class="modal-overlay" id="booking-modal" onclick="closeBookingModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeBookingModal()" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div class="modal-header">
          <div class="modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M9 16l2 2 4-4"/>
            </svg>
          </div>
          <h2>Confirm Booking</h2>
          <p class="modal-subtitle">Review your selection before proceeding</p>
        </div>

        <div class="modal-body">
          <div class="booking-summary">
            <div class="summary-row venue">
              <span class="summary-icon">🏟️</span>
              <div class="summary-content">
                <span class="summary-label">Venue</span>
                <span class="summary-value">${escapeHtml(venueName)}</span>
                ${courtName ? `<span class="summary-detail">${escapeHtml(courtName)}</span>` : ''}
              </div>
            </div>

            <div class="summary-row date">
              <span class="summary-icon">📅</span>
              <div class="summary-content">
                <span class="summary-label">Date</span>
                <span class="summary-value">${formatDate(date)}</span>
              </div>
            </div>

            <div class="summary-row time">
              <span class="summary-icon">🕐</span>
              <div class="summary-content">
                <span class="summary-label">Time</span>
                <span class="summary-value">${startTime} - ${endTime}</span>
                ${duration ? `<span class="summary-detail">${duration} minutes</span>` : ''}
              </div>
            </div>

            <div class="summary-row price">
              <span class="summary-icon">💰</span>
              <div class="summary-content">
                <span class="summary-label">Price</span>
                <span class="summary-value price-value">${price}</span>
              </div>
            </div>
          </div>

          ${weatherNoticeHtml}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeBookingModal()">
            Cancel
          </button>
          <button class="btn btn-primary" onclick="proceedToBooking('${escapeHtml(bookingUrl)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Continue to Booking
          </button>
        </div>
      </div>
    </div>
  `;

  return content;
}

/**
 * Generate the modal container (for injection into page)
 */
export function generateModalContainerHTML(): string {
  return `<div id="modal-container"></div>`;
}

/**
 * Generate JavaScript for modal functionality
 */
export function generateModalScript(): string {
  return `
    // Modal Functions - Also included in styles.ts
    function showBookingModal(bookingUrl, venueName, startTime, endTime, price, weather) {
      var container = document.getElementById('modal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'modal-container';
        document.body.appendChild(container);
      }

      // Parse date from startTime if it's ISO format
      var date = '';
      if (startTime && startTime.includes('T')) {
        date = startTime.split('T')[0];
        startTime = startTime.split('T')[1].substring(0, 5);
      }

      var weatherHtml = '';
      if (weather && weather.condition) {
        var noticeClass = weather.isPlayable ? 'info' : 'warning';
        var icon = weather.isPlayable ? 'ℹ️' : '⚠️';
        weatherHtml = '<div class="modal-notice ' + noticeClass + '">' +
          '<span class="notice-icon">' + icon + '</span>' +
          '<div class="notice-content">' +
          '<strong>Weather: ' + weather.conditionEmoji + ' ' + weather.condition + ', ' + weather.temperature + '°C</strong>' +
          (weather.playabilityNote ? '<p>' + weather.playabilityNote + '</p>' : '') +
          '</div></div>';
      }

      var modalHtml = '<div class="modal-overlay active" id="booking-modal" onclick="closeBookingModal(event)">' +
        '<div class="modal" onclick="event.stopPropagation()">' +
        '<button class="modal-close" onclick="closeBookingModal()" aria-label="Close">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '<div class="modal-header">' +
        '<div class="modal-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
        '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
        '<line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg></div>' +
        '<h2>Confirm Booking</h2>' +
        '<p class="modal-subtitle">Review your selection before proceeding</p></div>' +
        '<div class="modal-body"><div class="booking-summary">' +
        '<div class="summary-row venue"><span class="summary-icon">🏟️</span>' +
        '<div class="summary-content"><span class="summary-label">Venue</span>' +
        '<span class="summary-value">' + venueName + '</span></div></div>' +
        (date ? '<div class="summary-row date"><span class="summary-icon">📅</span>' +
        '<div class="summary-content"><span class="summary-label">Date</span>' +
        '<span class="summary-value">' + date + '</span></div></div>' : '') +
        '<div class="summary-row time"><span class="summary-icon">🕐</span>' +
        '<div class="summary-content"><span class="summary-label">Time</span>' +
        '<span class="summary-value">' + startTime + ' - ' + endTime + '</span></div></div>' +
        '<div class="summary-row price"><span class="summary-icon">💰</span>' +
        '<div class="summary-content"><span class="summary-label">Price</span>' +
        '<span class="summary-value price-value">' + price + '</span></div></div></div>' +
        weatherHtml + '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-secondary" onclick="closeBookingModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="proceedToBooking(\\'' + bookingUrl + '\\')">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
        '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
        'Continue to Booking</button></div></div></div>';

      container.innerHTML = modalHtml;
      document.body.classList.add('modal-open');

      // Trigger animation
      setTimeout(function() {
        var overlay = container.querySelector('.modal-overlay');
        if (overlay) overlay.classList.add('active');
      }, 10);
    }

    function closeBookingModal(event) {
      if (event && event.target !== event.currentTarget) return;

      var modal = document.getElementById('booking-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(function() {
          var container = document.getElementById('modal-container');
          if (container) container.innerHTML = '';
          document.body.classList.remove('modal-open');
        }, 300);
      }
    }

    function proceedToBooking(url) {
      closeBookingModal();
      ToastSystem.success('Opening booking page...', 'Redirecting');

      // Small delay for toast to show
      setTimeout(function() {
        window.open(url, '_blank');
      }, 500);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeBookingModal();
      }
    });
  `;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
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
