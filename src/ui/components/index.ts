/**
 * UI Components Index
 *
 * Exports all UI component generators for easy importing.
 */

// Core slot and venue cards
export { generateSlotCardHTML, generateSlotCardsHTML } from './slot-card.js';

// Search forms
export { generateSearchFormHTML, generateQuickSearchHTML, generateVenueSearchFormHTML, type SearchFormDefaults } from './search-form.js';

// Calendar views
export { generateWeeklyCalendarHTML, generateWeeklyListHTML, generateDaySummaryHTML, generateMiniCalendarHTML } from './calendar-view.js';

// Toast notifications
export { generateToastHTML, generateToastContainerHTML, generateToastSystemScript, type ToastOptions } from './toast.js';

// Loading skeletons
export { generateSkeletonCardHTML, generateSkeletonCardsHTML, generateVenueSkeletonHTML, generateTextSkeletonHTML, generateLoadingOverlayHTML } from './skeleton.js';

// Filter and sort controls
export { generateFilterChipsHTML, generateFilterBarHTML, generateTimeFilterChipsHTML, generatePriceFilterChipsHTML, DEFAULT_FILTERS, DEFAULT_SORT_OPTIONS, type FilterOption, type SortOption, type FilterChipsConfig } from './filter-chips.js';

// Time picker
export { generateTimePickerHTML, generateTimePickerComponentHTML, generateCompactTimeRangeHTML, type TimeSlotAvailability, type TimePickerConfig } from './time-picker.js';

// Booking modal
export { generateBookingModalHTML, generateModalContainerHTML, generateModalScript, type BookingDetails } from './booking-modal.js';

// Compare mode
export { generateCompareBarHTML, generateCompareResultsHTML, generateCompareScript, type CompareBarConfig } from './compare-bar.js';

// Checkout flow (multi-step booking wizard)
export { generateCheckoutWizardHTML, getCheckoutStyles, type BookingSlot, type CheckoutConfig } from './checkout-flow.js';

// Search bar (compact search with filters)
export { generateSearchBarHTML, getSearchBarScripts, getSearchBarStyles, type SearchBarConfig, type FilterChip } from './search-bar.js';
