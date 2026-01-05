/**
 * Filter Chips and Sort Controls Component
 *
 * Interactive filter chips and sort dropdown for dynamically
 * updating search results via postMessage to the parent window.
 */

import { wrapWithStyles } from '../styles.js';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  active?: boolean;
}

export interface SortOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterChipsConfig {
  filters?: FilterOption[];
  sortOptions?: SortOption[];
  currentSort?: string;
  onFilterChange?: string; // JavaScript function name
  onSortChange?: string; // JavaScript function name
}

/**
 * Default filter options for padel court searches
 */
export const DEFAULT_FILTERS: FilterOption[] = [
  { id: 'indoor', label: 'Indoor', value: 'indoor' },
  { id: 'outdoor', label: 'Outdoor', value: 'outdoor' },
  { id: 'morning', label: 'Morning', value: 'morning' },
  { id: 'afternoon', label: 'Afternoon', value: 'afternoon' },
  { id: 'evening', label: 'Evening', value: 'evening' },
  { id: 'under30', label: 'Under €30', value: 'under30' },
];

/**
 * Default sort options
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { id: 'time', label: 'Time: Earliest', value: 'time' },
  { id: 'price', label: 'Price: Low to High', value: 'price' },
  { id: 'price_desc', label: 'Price: High to Low', value: 'price_desc' },
  { id: 'distance', label: 'Distance: Nearest', value: 'distance' },
];

/**
 * Generate HTML for filter chips
 */
export function generateFilterChipsHTML(config: FilterChipsConfig = {}): string {
  const {
    filters = DEFAULT_FILTERS,
    sortOptions = DEFAULT_SORT_OPTIONS,
    currentSort = 'time',
  } = config;

  const filterChipsHtml = filters
    .map(
      (filter) => `
      <button
        class="filter-chip ${filter.active ? 'active' : ''}"
        data-filter-id="${escapeHtml(filter.id)}"
        data-filter-value="${escapeHtml(filter.value)}"
        onclick="toggleFilter(this)"
      >
        ${escapeHtml(filter.label)}
      </button>
    `
    )
    .join('');

  const sortOptionsHtml = sortOptions
    .map(
      (option) => `
      <option value="${escapeHtml(option.value)}" ${option.value === currentSort ? 'selected' : ''}>
        ${escapeHtml(option.label)}
      </option>
    `
    )
    .join('');

  return `
    <div class="filter-sort-bar">
      <div class="filter-chips-container">
        <div class="filter-chips">
          ${filterChipsHtml}
          <button class="filter-chip add-filter" onclick="showFilterMenu(this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Filter
          </button>
        </div>
        <button class="clear-filters-btn hidden" onclick="clearAllFilters()">
          Clear all
        </button>
      </div>
      <div class="sort-controls">
        <label for="sort-select" class="sort-label">Sort by:</label>
        <select id="sort-select" class="sort-select" onchange="handleSortChange(this.value)">
          ${sortOptionsHtml}
        </select>
      </div>
    </div>
  `;
}

/**
 * Generate standalone filter bar with full styling
 */
export function generateFilterBarHTML(config: FilterChipsConfig = {}): string {
  const content = generateFilterChipsHTML(config);

  const script = `
    <script>
      // Active filters state
      var activeFilters = new Set();

      // Toggle a filter chip
      function toggleFilter(btn) {
        var filterId = btn.dataset.filterId;
        var filterValue = btn.dataset.filterValue;

        btn.classList.toggle('active');

        if (activeFilters.has(filterId)) {
          activeFilters.delete(filterId);
        } else {
          activeFilters.add(filterId);
        }

        updateClearButton();
        applyFilters();
      }

      // Clear all filters
      function clearAllFilters() {
        activeFilters.clear();
        document.querySelectorAll('.filter-chip.active').forEach(function(chip) {
          if (!chip.classList.contains('add-filter')) {
            chip.classList.remove('active');
          }
        });
        updateClearButton();
        applyFilters();
      }

      // Update clear button visibility
      function updateClearButton() {
        var clearBtn = document.querySelector('.clear-filters-btn');
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', activeFilters.size === 0);
        }
      }

      // Show filter menu for adding more filters
      function showFilterMenu(btn) {
        ToastSystem.info('More filters coming soon!', 'Filters');
      }

      // Apply current filters
      function applyFilters() {
        var filters = {};
        document.querySelectorAll('.filter-chip.active:not(.add-filter)').forEach(function(chip) {
          filters[chip.dataset.filterId] = chip.dataset.filterValue;
        });

        // Send to parent via postMessage
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'filter_change',
            payload: { filters: filters }
          }, '*');
        }

        // Also trigger local update if handler exists
        if (typeof onFilterUpdate === 'function') {
          onFilterUpdate(filters);
        }
      }

      // Handle sort change
      function handleSortChange(value) {
        // Send to parent via postMessage
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'sort_change',
            payload: { sortBy: value }
          }, '*');
        }

        // Also trigger local update if handler exists
        if (typeof onSortUpdate === 'function') {
          onSortUpdate(value);
        }
      }
    </script>
  `;

  return wrapWithStyles(content + script);
}

/**
 * Generate time-based quick filter chips
 */
export function generateTimeFilterChipsHTML(options?: {
  selectedTime?: string;
}): string {
  const { selectedTime } = options ?? {};

  const timeFilters = [
    { id: 'any', label: 'Any time', start: undefined, end: undefined },
    { id: 'morning', label: 'Morning (6-12)', start: '06:00', end: '12:00' },
    { id: 'afternoon', label: 'Afternoon (12-17)', start: '12:00', end: '17:00' },
    { id: 'evening', label: 'Evening (17-22)', start: '17:00', end: '22:00' },
  ];

  const chipsHtml = timeFilters
    .map(
      (filter) => `
      <button
        class="filter-chip time-filter ${selectedTime === filter.id ? 'active' : ''}"
        data-time-id="${filter.id}"
        data-time-start="${filter.start ?? ''}"
        data-time-end="${filter.end ?? ''}"
        onclick="selectTimeFilter(this)"
      >
        ${filter.label}
      </button>
    `
    )
    .join('');

  return `
    <div class="time-filter-chips">
      <span class="filter-label">Time:</span>
      ${chipsHtml}
    </div>
  `;
}

/**
 * Generate price range filter chips
 */
export function generatePriceFilterChipsHTML(options?: {
  currency?: string;
  selectedRange?: string;
}): string {
  const { currency = '€', selectedRange } = options ?? {};

  const priceFilters = [
    { id: 'any', label: 'Any price', min: undefined, max: undefined },
    { id: 'budget', label: `Under ${currency}20`, min: 0, max: 20 },
    { id: 'mid', label: `${currency}20-40`, min: 20, max: 40 },
    { id: 'premium', label: `${currency}40+`, min: 40, max: undefined },
  ];

  const chipsHtml = priceFilters
    .map(
      (filter) => `
      <button
        class="filter-chip price-filter ${selectedRange === filter.id ? 'active' : ''}"
        data-price-id="${filter.id}"
        data-price-min="${filter.min ?? ''}"
        data-price-max="${filter.max ?? ''}"
        onclick="selectPriceFilter(this)"
      >
        ${filter.label}
      </button>
    `
    )
    .join('');

  return `
    <div class="price-filter-chips">
      <span class="filter-label">Price:</span>
      ${chipsHtml}
    </div>
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
