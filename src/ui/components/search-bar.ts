/**
 * Search Bar Component
 *
 * Compact inline search bar with filter chips and sort controls.
 * Provides instant filtering without page reload.
 */

export interface SearchBarConfig {
  location?: string;
  date?: string;
  activeFilters?: string[];
  sortBy?: 'price' | 'time' | 'distance';
  showFilters?: boolean;
}

export interface FilterChip {
  id: string;
  label: string;
  icon?: string;
  group?: string;
}

const DEFAULT_FILTERS: FilterChip[] = [
  { id: 'indoor', label: 'Indoor', icon: '🏠', group: 'type' },
  { id: 'outdoor', label: 'Outdoor', icon: '☀️', group: 'type' },
  { id: 'morning', label: 'Morning', icon: '🌅', group: 'time' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️', group: 'time' },
  { id: 'evening', label: 'Evening', icon: '🌙', group: 'time' },
  { id: 'under20', label: 'Under €20', icon: '💰', group: 'price' },
  { id: 'under30', label: 'Under €30', icon: '💰', group: 'price' },
];

const SORT_OPTIONS = [
  { value: 'price', label: 'Price: Low to High' },
  { value: 'time', label: 'Time: Earliest' },
  { value: 'distance', label: 'Distance: Nearest' },
];

/**
 * Generate compact search bar HTML
 */
export function generateSearchBarHTML(config?: SearchBarConfig): string {
  const {
    location = '',
    date = '',
    activeFilters = [],
    sortBy = 'time',
    showFilters = true,
  } = config ?? {};

  // Get today's date for default
  const today = new Date().toISOString().split('T')[0];
  const dateValue = date || today;

  return `
    <div class="search-bar-container">
      <div class="search-bar">
        <div class="search-inputs">
          <div class="search-field location-field">
            <span class="field-icon">📍</span>
            <input type="text" id="search-location" placeholder="City or area..."
                   value="${escapeHtml(location)}" autocomplete="off" />
          </div>
          <div class="search-field date-field">
            <span class="field-icon">📅</span>
            <input type="date" id="search-date" value="${dateValue}" />
          </div>
          <button class="search-submit" onclick="executeSearch()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      ${showFilters ? `
        <div class="filter-bar">
          <div class="filter-chips-scroll">
            ${DEFAULT_FILTERS.map(f => `
              <button class="filter-chip ${activeFilters.includes(f.id) ? 'active' : ''}"
                      data-filter-id="${f.id}"
                      data-filter-group="${f.group || ''}"
                      onclick="toggleFilterChip(this, '${f.id}')">
                ${f.icon ? `<span class="chip-icon">${f.icon}</span>` : ''}
                <span class="chip-label">${f.label}</span>
              </button>
            `).join('')}
          </div>

          <div class="sort-dropdown">
            <select id="sort-select" onchange="handleSortChange(this.value)">
              ${SORT_OPTIONS.map(o => `
                <option value="${o.value}" ${sortBy === o.value ? 'selected' : ''}>
                  ${o.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate search bar scripts
 */
export function getSearchBarScripts(): string {
  return `
    var activeFilters = new Set();
    var currentSort = 'time';
    var slotsData = [];

    function toggleFilterChip(btn, filterId) {
      btn.classList.toggle('active');

      if (btn.classList.contains('active')) {
        activeFilters.add(filterId);
      } else {
        activeFilters.delete(filterId);
      }

      applyFilters();
    }

    function handleSortChange(value) {
      currentSort = value;
      applySorting();
    }

    function executeSearch() {
      var location = document.getElementById('search-location').value.trim();
      var date = document.getElementById('search-date').value;

      if (!location) {
        ToastSystem.warning('Please enter a location');
        document.getElementById('search-location').focus();
        return;
      }

      var btn = document.querySelector('.search-submit');
      if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
      }

      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'find_available_games',
          params: {
            location: location,
            date: date || undefined,
            filters: Array.from(activeFilters)
          }
        }
      }, '*');

      // Reset button after delay
      setTimeout(function() {
        if (btn) {
          btn.classList.remove('loading');
          btn.disabled = false;
        }
      }, 2000);
    }

    function applyFilters() {
      var cards = document.querySelectorAll('.slot-card');
      var visibleCount = 0;

      cards.forEach(function(card) {
        var shouldShow = true;

        if (activeFilters.size > 0) {
          // Check time filters
          var timeSlot = card.querySelector('.time')?.textContent || '';
          var hour = parseInt(timeSlot.split(':')[0]);

          if (activeFilters.has('morning') && (hour < 6 || hour >= 12)) shouldShow = false;
          if (activeFilters.has('afternoon') && (hour < 12 || hour >= 18)) shouldShow = false;
          if (activeFilters.has('evening') && (hour < 18 || hour >= 23)) shouldShow = false;

          // Check price filters
          var priceEl = card.querySelector('.price');
          if (priceEl) {
            var price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
            if (activeFilters.has('under20') && price >= 20) shouldShow = false;
            if (activeFilters.has('under30') && price >= 30) shouldShow = false;
          }
        }

        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
      });

      updateResultsCount(visibleCount);
    }

    function applySorting() {
      var container = document.querySelector('.slots-list, .venue-slots');
      if (!container) return;

      var cards = Array.from(container.querySelectorAll('.slot-card'));

      cards.sort(function(a, b) {
        if (currentSort === 'price') {
          var priceA = parseFloat(a.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '') || '0');
          var priceB = parseFloat(b.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '') || '0');
          return priceA - priceB;
        }
        if (currentSort === 'time') {
          var timeA = a.querySelector('.time')?.textContent || '00:00';
          var timeB = b.querySelector('.time')?.textContent || '00:00';
          return timeA.localeCompare(timeB);
        }
        return 0;
      });

      cards.forEach(function(card) {
        container.appendChild(card);
      });
    }

    function updateResultsCount(count) {
      var countEl = document.querySelector('.results-count');
      if (countEl) {
        countEl.textContent = count + ' slot' + (count !== 1 ? 's' : '') + ' found';
      }
    }

    // Quick filter presets
    function applyQuickFilter(preset) {
      activeFilters.clear();

      if (preset === 'tonight') {
        activeFilters.add('evening');
      } else if (preset === 'tomorrow') {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('search-date').value = tomorrow.toISOString().split('T')[0];
      } else if (preset === 'weekend') {
        var today = new Date();
        var dayOfWeek = today.getDay();
        var daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
        var saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSat);
        document.getElementById('search-date').value = saturday.toISOString().split('T')[0];
      } else if (preset === 'cheap') {
        activeFilters.add('under20');
      }

      // Update chip visuals
      document.querySelectorAll('.filter-chip').forEach(function(chip) {
        chip.classList.toggle('active', activeFilters.has(chip.dataset.filterId));
      });

      applyFilters();
    }

    // Search on Enter key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.id === 'search-location') {
        executeSearch();
      }
    });
  `;
}

/**
 * Generate search bar styles
 */
export function getSearchBarStyles(): string {
  return `.search-bar-container{margin-bottom:20px}.search-bar{background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:12px;box-shadow:var(--shadow-sm)}.search-inputs{display:flex;gap:8px;align-items:stretch}.search-field{display:flex;align-items:center;gap:8px;background:var(--color-background);border:2px solid transparent;border-radius:12px;padding:10px 14px;flex:1;transition:all var(--duration-fast)}.search-field:focus-within{border-color:var(--color-primary);background:var(--color-surface)}.search-field .field-icon{font-size:16px;opacity:.7}.search-field input{border:none;background:none;outline:none;width:100%;font-size:14px;color:var(--color-text-primary)}.search-field input::placeholder{color:var(--color-text-secondary)}.location-field{flex:2}.date-field{flex:1;min-width:140px}.search-submit{background:var(--color-primary-gradient);border:none;border-radius:12px;padding:12px 16px;cursor:pointer;color:#fff;transition:all var(--duration-fast);display:flex;align-items:center;justify-content:center}.search-submit:hover{transform:scale(1.05);box-shadow:var(--shadow-glow)}.search-submit.loading{opacity:.7;pointer-events:none}.search-submit.loading svg{animation:spin .8s linear infinite}.filter-bar{display:flex;align-items:center;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-light)}.filter-chips-scroll{display:flex;gap:8px;overflow-x:auto;flex:1;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.filter-chips-scroll::-webkit-scrollbar{display:none}.filter-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--color-background);border:1px solid var(--color-border);border-radius:20px;font-size:13px;font-weight:500;color:var(--color-text-primary);cursor:pointer;transition:all var(--duration-fast);white-space:nowrap;flex-shrink:0}.filter-chip:hover{border-color:var(--color-primary);background:rgba(13,148,136,.05)}.filter-chip.active{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}.chip-icon{font-size:14px}.sort-dropdown{flex-shrink:0}.sort-dropdown select{padding:8px 12px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface);font-size:13px;color:var(--color-text-primary);cursor:pointer;min-width:140px}.sort-dropdown select:focus{outline:none;border-color:var(--color-primary)}@media(max-width:600px){.search-inputs{flex-wrap:wrap}.location-field,.date-field{flex:1 1 100%}.search-submit{flex:1 1 100%}}`;
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
