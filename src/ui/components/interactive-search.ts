/**
 * Interactive Search Component
 *
 * A full-featured search panel with editable inputs, quick presets,
 * and real-time controls. Embedded in all MCP-UI responses so users
 * can modify searches without typing new prompts.
 */

import { wrapWithStyles } from '../styles.js';

export interface InteractiveSearchParams {
  location?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  maxDistanceKm?: number;
  collapsed?: boolean;
  showResults?: boolean;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get next Saturday's date
 */
function getNextSaturdayDate(): string {
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  return saturday.toISOString().split('T')[0];
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
 * Generate HTML for the interactive search panel
 */
export function generateInteractiveSearchHTML(params?: InteractiveSearchParams): string {
  const {
    location = '',
    date = getTodayDate(),
    timeStart = '',
    timeEnd = '',
    maxDistanceKm = 15,
    collapsed = false,
  } = params ?? {};

  const todayDate = getTodayDate();
  const tomorrowDate = getTomorrowDate();
  const weekendDate = getNextSaturdayDate();

  const content = `
    <div class="interactive-search ${collapsed ? 'collapsed' : ''}" id="search-panel">
      <div class="search-header" onclick="toggleSearchPanel()">
        <h2>
          <span class="search-icon">&#x1F3BE;</span>
          Padel Court Search
        </h2>
        <button class="toggle-btn" aria-label="Toggle search panel">
          <span class="toggle-icon">${collapsed ? '+' : '-'}</span>
        </button>
      </div>

      <div class="search-body">
        <form id="interactive-search-form" onsubmit="runInteractiveSearch(event)">
          <!-- Location Input -->
          <div class="form-group">
            <label for="search-location">
              <span class="label-icon">&#x1F4CD;</span>
              Location
            </label>
            <input
              type="text"
              id="search-location"
              name="location"
              placeholder="City, address, or coordinates..."
              value="${escapeHtml(location)}"
              required
            >
          </div>

          <!-- Date Input -->
          <div class="form-group">
            <label for="search-date">
              <span class="label-icon">&#x1F4C5;</span>
              Date
            </label>
            <input
              type="date"
              id="search-date"
              name="date"
              value="${escapeHtml(date)}"
              min="${todayDate}"
              required
            >
          </div>

          <!-- Time Range -->
          <div class="form-row">
            <div class="form-group">
              <label for="search-time-start">
                <span class="label-icon">&#x1F550;</span>
                From
              </label>
              <select id="search-time-start" name="time_start">
                <option value="">Any time</option>
                <option value="06:00" ${timeStart === '06:00' ? 'selected' : ''}>6:00 AM</option>
                <option value="09:00" ${timeStart === '09:00' ? 'selected' : ''}>9:00 AM</option>
                <option value="12:00" ${timeStart === '12:00' ? 'selected' : ''}>12:00 PM</option>
                <option value="15:00" ${timeStart === '15:00' ? 'selected' : ''}>3:00 PM</option>
                <option value="17:00" ${timeStart === '17:00' ? 'selected' : ''}>5:00 PM</option>
                <option value="18:00" ${timeStart === '18:00' ? 'selected' : ''}>6:00 PM</option>
                <option value="19:00" ${timeStart === '19:00' ? 'selected' : ''}>7:00 PM</option>
                <option value="20:00" ${timeStart === '20:00' ? 'selected' : ''}>8:00 PM</option>
              </select>
            </div>
            <div class="form-group">
              <label for="search-time-end">
                <span class="label-icon">&#x1F550;</span>
                To
              </label>
              <select id="search-time-end" name="time_end">
                <option value="">Any time</option>
                <option value="12:00" ${timeEnd === '12:00' ? 'selected' : ''}>12:00 PM</option>
                <option value="15:00" ${timeEnd === '15:00' ? 'selected' : ''}>3:00 PM</option>
                <option value="18:00" ${timeEnd === '18:00' ? 'selected' : ''}>6:00 PM</option>
                <option value="20:00" ${timeEnd === '20:00' ? 'selected' : ''}>8:00 PM</option>
                <option value="21:00" ${timeEnd === '21:00' ? 'selected' : ''}>9:00 PM</option>
                <option value="22:00" ${timeEnd === '22:00' ? 'selected' : ''}>10:00 PM</option>
                <option value="23:00" ${timeEnd === '23:00' ? 'selected' : ''}>11:00 PM</option>
              </select>
            </div>
          </div>

          <!-- Distance Slider -->
          <div class="form-group">
            <label for="search-distance">
              <span class="label-icon">&#x1F4CF;</span>
              Max Distance: <span id="distance-display">${maxDistanceKm}</span> km
            </label>
            <input
              type="range"
              id="search-distance"
              name="max_distance_km"
              min="1"
              max="50"
              value="${maxDistanceKm}"
              class="distance-slider"
              oninput="updateDistanceDisplay(this.value)"
            >
            <div class="slider-labels">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>

          <!-- Quick Presets -->
          <div class="quick-presets">
            <button type="button" class="preset-btn" onclick="setPreset('tonight', '${escapeHtml(location)}')">
              <span>&#x1F319;</span> Tonight
            </button>
            <button type="button" class="preset-btn" onclick="setPreset('tomorrow', '${escapeHtml(location)}')">
              <span>&#x2600;&#xFE0F;</span> Tomorrow
            </button>
            <button type="button" class="preset-btn" onclick="setPreset('weekend', '${escapeHtml(location)}')">
              <span>&#x1F389;</span> Weekend
            </button>
          </div>

          <!-- Search Button -->
          <button type="submit" class="btn btn-primary search-submit">
            <span>&#x1F50D;</span>
            Search Available Courts
          </button>
        </form>
      </div>
    </div>

    <style>
      .interactive-search {
        background: #ffffff;
        border: 1px solid #e1e4e8;
        border-radius: 16px;
        margin-bottom: 20px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }

      .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
        color: white;
        cursor: pointer;
        user-select: none;
      }

      .search-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .search-icon {
        font-size: 22px;
      }

      .toggle-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toggle-btn:hover {
        background: rgba(255,255,255,0.3);
      }

      .search-body {
        padding: 20px;
        display: block;
      }

      .interactive-search.collapsed .search-body {
        display: none;
      }

      .interactive-search.collapsed .toggle-icon {
        transform: rotate(0deg);
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-weight: 600;
        color: #374151;
        font-size: 13px;
      }

      .label-icon {
        font-size: 14px;
      }

      .form-group input[type="text"],
      .form-group input[type="date"],
      .form-group select {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: #fafbfc;
      }

      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #0d9488;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        background: #ffffff;
      }

      .form-row {
        display: flex;
        gap: 12px;
      }

      .form-row .form-group {
        flex: 1;
      }

      .distance-slider {
        width: 100%;
        height: 8px;
        -webkit-appearance: none;
        background: linear-gradient(to right, #0d9488, #0d9488);
        border-radius: 4px;
        outline: none;
        margin: 8px 0;
      }

      .distance-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        background: #0d9488;
        border-radius: 50%;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }

      .distance-slider::-moz-range-thumb {
        width: 22px;
        height: 22px;
        background: #0d9488;
        border-radius: 50%;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
        margin-top: 4px;
      }

      .quick-presets {
        display: flex;
        gap: 8px;
        margin: 16px 0;
        flex-wrap: wrap;
      }

      .preset-btn {
        flex: 1;
        min-width: 90px;
        padding: 10px 12px;
        background: #f0fdfa;
        border: 2px solid #0d9488;
        border-radius: 10px;
        color: #0d9488;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .preset-btn:hover {
        background: #ccfbf1;
        transform: translateY(-1px);
      }

      .preset-btn.active {
        background: #0d9488;
        color: white;
      }

      .search-submit {
        width: 100%;
        padding: 14px 24px;
        font-size: 15px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .search-submit span {
        font-size: 16px;
      }
    </style>

    <script>
      function toggleSearchPanel() {
        const panel = document.getElementById('search-panel');
        if (panel) {
          panel.classList.toggle('collapsed');
          const icon = panel.querySelector('.toggle-icon');
          if (icon) {
            icon.textContent = panel.classList.contains('collapsed') ? '+' : '-';
          }
          notifySize();
        }
      }

      function updateDistanceDisplay(value) {
        const display = document.getElementById('distance-display');
        if (display) {
          display.textContent = value;
        }
      }

      function setPreset(preset, currentLocation) {
        const form = document.getElementById('interactive-search-form');
        if (!form) return;

        const dateInput = document.getElementById('search-date');
        const timeStartSelect = document.getElementById('search-time-start');
        const timeEndSelect = document.getElementById('search-time-end');
        const locationInput = document.getElementById('search-location');

        // Get dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);

        // Format date as YYYY-MM-DD
        function formatDate(d) {
          return d.toISOString().split('T')[0];
        }

        // Clear active states
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.preset-btn')?.classList.add('active');

        switch(preset) {
          case 'tonight':
            if (dateInput) dateInput.value = formatDate(today);
            if (timeStartSelect) timeStartSelect.value = '17:00';
            if (timeEndSelect) timeEndSelect.value = '23:00';
            break;
          case 'tomorrow':
            if (dateInput) dateInput.value = formatDate(tomorrow);
            if (timeStartSelect) timeStartSelect.value = '';
            if (timeEndSelect) timeEndSelect.value = '';
            break;
          case 'weekend':
            if (dateInput) dateInput.value = formatDate(saturday);
            if (timeStartSelect) timeStartSelect.value = '';
            if (timeEndSelect) timeEndSelect.value = '';
            break;
        }

        // Auto-submit if location is already filled
        if (currentLocation && locationInput && locationInput.value) {
          runInteractiveSearch({ preventDefault: () => {}, target: form });
        }
      }

      function runInteractiveSearch(e) {
        e.preventDefault();
        const form = e.target;

        const location = document.getElementById('search-location')?.value?.trim();
        const date = document.getElementById('search-date')?.value;
        const timeStart = document.getElementById('search-time-start')?.value;
        const timeEnd = document.getElementById('search-time-end')?.value;
        const maxDistance = parseInt(document.getElementById('search-distance')?.value) || 15;

        if (!location) {
          const input = document.getElementById('search-location');
          if (input) {
            input.style.borderColor = '#ef4444';
            input.focus();
          }
          return;
        }

        // Show loading state
        const btn = form.querySelector('.search-submit');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span>&#x23F3;</span> Searching...';
        }

        // Build params - only include non-empty values
        const params = {
          location: location,
          date: date
        };

        if (timeStart) params.preferred_time_start = timeStart;
        if (timeEnd) params.preferred_time_end = timeEnd;
        if (maxDistance) params.max_distance_km = maxDistance;

        try {
          window.parent.postMessage({
            type: 'tool',
            payload: {
              toolName: 'find_available_games',
              params: params
            }
          }, '*');
        } catch (err) {
          console.error('Search error:', err);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>&#x1F50D;</span> Search Available Courts';
          }
        }
      }
    </script>
  `;

  return wrapWithStyles(content);
}

/**
 * Generate a compact version of the interactive search for embedding in results
 */
export function generateCompactSearchHTML(params?: InteractiveSearchParams): string {
  const {
    location = '',
    date = getTodayDate(),
    maxDistanceKm = 15,
  } = params ?? {};

  const content = `
    <div class="compact-search">
      <form onsubmit="runInteractiveSearch(event)" id="interactive-search-form">
        <div class="compact-row">
          <input
            type="text"
            id="search-location"
            name="location"
            placeholder="Location..."
            value="${escapeHtml(location)}"
            required
            class="compact-input"
          >
          <input
            type="date"
            id="search-date"
            name="date"
            value="${escapeHtml(date)}"
            min="${getTodayDate()}"
            required
            class="compact-input compact-date"
          >
          <select id="search-time-start" name="time_start" class="compact-input compact-select" style="display:none;">
            <option value="">Any</option>
          </select>
          <select id="search-time-end" name="time_end" class="compact-input compact-select" style="display:none;">
            <option value="">Any</option>
          </select>
          <input type="hidden" id="search-distance" name="max_distance_km" value="${maxDistanceKm}">
          <button type="submit" class="btn btn-primary compact-btn">
            <span>&#x1F50D;</span> Search
          </button>
        </div>
      </form>
    </div>

    <style>
      .compact-search {
        background: #f8fafc;
        border: 1px solid #e1e4e8;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 16px;
      }

      .compact-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .compact-input {
        padding: 10px 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        flex: 1;
        min-width: 120px;
      }

      .compact-date {
        flex: 0 0 auto;
        width: 140px;
      }

      .compact-select {
        flex: 0 0 auto;
        width: 100px;
      }

      .compact-btn {
        padding: 10px 16px;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    </style>

    <script>
      function runInteractiveSearch(e) {
        e.preventDefault();
        const location = document.getElementById('search-location')?.value?.trim();
        const date = document.getElementById('search-date')?.value;
        const maxDistance = parseInt(document.getElementById('search-distance')?.value) || 15;

        if (!location) return;

        const btn = e.target.querySelector('.compact-btn');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '&#x23F3; ...';
        }

        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: 'find_available_games',
            params: { location, date, max_distance_km: maxDistance }
          }
        }, '*');
      }
    </script>
  `;

  return wrapWithStyles(content);
}
