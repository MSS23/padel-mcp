/**
 * Compare Bar Component
 *
 * Fixed bottom bar for comparing multiple selected slots.
 * Shows selected count and compare/clear actions.
 */

import { wrapWithStyles } from '../styles.js';

export interface CompareBarConfig {
  maxSelections?: number;
  selectedIds?: string[];
}

/**
 * Generate HTML for the compare bar
 */
export function generateCompareBarHTML(config: CompareBarConfig = {}): string {
  const { maxSelections = 4, selectedIds = [] } = config;

  const selectedCount = selectedIds.length;
  const canCompare = selectedCount >= 2;

  return `
    <div id="compare-bar" class="compare-bar ${selectedCount > 0 ? '' : 'hidden'}">
      <div class="compare-bar-content">
        <div class="compare-bar-info">
          <span class="compare-count">${selectedCount} selected</span>
          <span class="compare-limit">(max ${maxSelections})</span>
        </div>
        <div class="compare-bar-actions">
          <button class="btn btn-text" onclick="CompareMode.clear()">
            Clear
          </button>
          <button class="btn btn-primary" onclick="CompareMode.compare()" ${!canCompare ? 'disabled' : ''}>
            Compare${canCompare ? ` (${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate compare results HTML
 */
export function generateCompareResultsHTML(slots: Array<{
  id: string;
  venueName: string;
  courtName: string;
  time: string;
  date: string;
  price: number;
  currency: string;
  pricePerHour: number;
  duration: number;
  distance?: number;
  weather?: {
    temperature: number;
    condition: string;
    conditionEmoji: string;
    isPlayable: boolean;
  };
}>): string {
  if (slots.length === 0) {
    return wrapWithStyles(`
      <div class="empty-state">
        <h3>No slots to compare</h3>
        <p>Select 2-4 slots to compare them</p>
      </div>
    `);
  }

  // Find best values for highlighting
  const prices = slots.map(s => s.price);
  const lowestPrice = Math.min(...prices);
  const distances = slots.filter(s => s.distance).map(s => s.distance!);
  const shortestDistance = distances.length > 0 ? Math.min(...distances) : null;

  let slotsHtml = '';
  for (const slot of slots) {
    const isCheapest = slot.price === lowestPrice;
    const isNearest = shortestDistance !== null && slot.distance === shortestDistance;

    let badges = '';
    if (isCheapest) badges += '<span class="compare-badge best-price">Best Price</span>';
    if (isNearest) badges += '<span class="compare-badge nearest">Nearest</span>';

    const weatherHtml = slot.weather
      ? `
        <div class="compare-weather">
          <span>${slot.weather.conditionEmoji} ${slot.weather.temperature}°C</span>
          <span class="playability ${slot.weather.isPlayable ? 'good' : 'warning'}">
            ${slot.weather.isPlayable ? '✓ Playable' : '⚠ Check conditions'}
          </span>
        </div>
      `
      : '';

    slotsHtml += `
      <div class="compare-card ${isCheapest ? 'best-deal' : ''}">
        ${badges ? `<div class="compare-badges">${badges}</div>` : ''}

        <div class="compare-venue">
          <h3>${escapeHtml(slot.venueName)}</h3>
          <p>${escapeHtml(slot.courtName)}</p>
        </div>

        <div class="compare-details">
          <div class="compare-row">
            <span class="label">Date</span>
            <span class="value">${slot.date}</span>
          </div>
          <div class="compare-row">
            <span class="label">Time</span>
            <span class="value">${slot.time}</span>
          </div>
          <div class="compare-row">
            <span class="label">Duration</span>
            <span class="value">${slot.duration} min</span>
          </div>
          ${slot.distance ? `
            <div class="compare-row">
              <span class="label">Distance</span>
              <span class="value ${isNearest ? 'highlight' : ''}">${slot.distance} km</span>
            </div>
          ` : ''}
        </div>

        ${weatherHtml}

        <div class="compare-price">
          <div class="price-main ${isCheapest ? 'highlight' : ''}">
            <span class="currency">${slot.currency}</span>
            <span class="amount">${slot.price}</span>
          </div>
          <span class="price-per-hour">${slot.currency}${slot.pricePerHour.toFixed(2)}/hr</span>
        </div>

        <button class="btn btn-primary compare-book-btn" onclick="bookSlot('${slot.id}')">
          Book This
        </button>
      </div>
    `;
  }

  const content = `
    <div class="compare-results">
      <div class="compare-header">
        <h2>🔍 Comparing ${slots.length} Slots</h2>
        <button class="btn btn-text" onclick="closeCompare()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Close
        </button>
      </div>

      <div class="compare-grid">
        ${slotsHtml}
      </div>

      <div class="compare-summary">
        <p>
          <strong>Best value:</strong> ${slots.find(s => s.price === lowestPrice)?.venueName}
          at ${slots.find(s => s.price === lowestPrice)?.currency}${lowestPrice}
        </p>
      </div>
    </div>
  `;

  return wrapWithStyles(content);
}

/**
 * Generate JavaScript for compare mode functionality
 */
export function generateCompareScript(): string {
  return `
    // Compare Mode - Also included in styles.ts
    if (typeof CompareMode === 'undefined') {
      window.CompareMode = {
        selected: new Set(),
        maxSelections: 4,
        isActive: false,

        toggleMode: function(btn) {
          this.isActive = !this.isActive;
          if (btn) btn.classList.toggle('active', this.isActive);
          document.body.classList.toggle('compare-mode-active', this.isActive);

          if (!this.isActive) {
            this.clear();
          }

          ToastSystem.info(
            this.isActive ? 'Select up to 4 slots to compare' : 'Compare mode disabled',
            'Compare'
          );
        },

        toggle: function(slotId, btn) {
          if (this.selected.has(slotId)) {
            this.selected.delete(slotId);
            if (btn) btn.classList.remove('active');
            var card = document.getElementById(slotId);
            if (card) card.classList.remove('compare-selected');
          } else {
            if (this.selected.size >= this.maxSelections) {
              ToastSystem.warning('Maximum ' + this.maxSelections + ' slots can be compared');
              return;
            }
            this.selected.add(slotId);
            if (btn) btn.classList.add('active');
            var card = document.getElementById(slotId);
            if (card) card.classList.add('compare-selected');
          }

          this.updateBar();
        },

        updateBar: function() {
          var bar = document.getElementById('compare-bar');
          if (!bar) return;

          var count = this.selected.size;
          bar.classList.toggle('hidden', count === 0);

          var countEl = bar.querySelector('.compare-count');
          if (countEl) countEl.textContent = count + ' selected';

          var compareBtn = bar.querySelector('.btn-primary');
          if (compareBtn) {
            compareBtn.disabled = count < 2;
            compareBtn.textContent = count >= 2 ? 'Compare (' + count + ')' : 'Compare';
          }
        },

        clear: function() {
          this.selected.forEach(function(id) {
            var card = document.getElementById(id);
            if (card) card.classList.remove('compare-selected');
            var btn = card ? card.querySelector('.quick-action-btn.active') : null;
            if (btn) btn.classList.remove('active');
          });
          this.selected.clear();
          this.updateBar();
        },

        compare: function() {
          if (this.selected.size < 2) {
            ToastSystem.warning('Select at least 2 slots to compare');
            return;
          }

          var ids = Array.from(this.selected);

          // Send to parent via postMessage for tool call
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'tool',
              payload: {
                toolName: 'compare_slots',
                params: { slot_ids: ids }
              }
            }, '*');
          }

          ToastSystem.info('Comparing ' + ids.length + ' slots...', 'Compare');
        }
      };
    }

    function closeCompare() {
      // Navigate back or close compare view
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'close_compare'
        }, '*');
      }
    }
  `;
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
