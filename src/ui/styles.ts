/**
 * Shared CSS Styles for MCP-UI Components
 *
 * These styles are embedded in each UI component to ensure consistent styling
 * across all interactive elements in the chat interface.
 */

export const BASE_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    background: transparent;
  }

  /* Card Components */
  .slot-card, .venue-card {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;
    margin: 8px 0;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .slot-card:hover, .venue-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    transform: translateY(-1px);
  }

  .slot-header, .venue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .slot-header h3, .venue-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .price {
    font-size: 18px;
    font-weight: 700;
    color: #2e7d32;
  }

  .slot-details, .venue-details {
    margin-bottom: 12px;
  }

  .slot-details p, .venue-details p {
    margin: 4px 0;
    color: #666;
    font-size: 13px;
  }

  /* Weather Info */
  .weather-info {
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
    padding: 10px 14px;
    border-radius: 8px;
    margin: 12px 0;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    font-size: 13px;
  }

  .weather-info span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .playability {
    width: 100%;
    margin-top: 6px;
    font-weight: 500;
  }

  .playability.good { color: #2e7d32; }
  .playability.warning { color: #f57c00; }
  .playability.bad { color: #d32f2f; }

  /* Action Buttons */
  .slot-actions, .card-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
  }

  .btn-secondary {
    background: white;
    color: #1976d2;
    border: 1px solid #1976d2;
  }

  .btn-secondary:hover {
    background: #e3f2fd;
  }

  .btn-icon {
    background: transparent;
    border: 1px solid #e0e0e0;
    padding: 10px;
    min-width: auto;
  }

  .btn-icon:hover {
    background: #f5f5f5;
    border-color: #bdbdbd;
  }

  .btn-success {
    background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
    color: white;
  }

  .btn-success:hover {
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  }

  /* Forms */
  .search-form, .config-form {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e0e0e0;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 13px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-row .form-group {
    flex: 1;
  }

  /* Range Slider */
  input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e0e0e0;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1976d2;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  /* Calendar View */
  .weekly-calendar {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;
    background: white;
  }

  .weekly-calendar h2 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  @media (max-width: 600px) {
    .calendar-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .calendar-day {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .calendar-day:hover {
    background: #f5f5f5;
    border-color: #bdbdbd;
  }

  .calendar-day.has-slots {
    border-color: #4caf50;
    background: linear-gradient(180deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%);
  }

  .calendar-day.has-slots:hover {
    border-color: #2e7d32;
    background: rgba(76, 175, 80, 0.1);
  }

  .calendar-day.no-slots {
    opacity: 0.5;
    cursor: default;
  }

  .day-header {
    margin-bottom: 6px;
  }

  .day-name {
    font-weight: 600;
    font-size: 12px;
    color: #666;
  }

  .day-date {
    font-size: 14px;
    font-weight: 500;
    display: block;
    margin-top: 2px;
  }

  .day-weather {
    font-size: 12px;
    margin: 4px 0;
  }

  .day-slots {
    font-size: 11px;
    color: #666;
  }

  .slot-count {
    display: block;
    font-weight: 500;
    color: #2e7d32;
  }

  .price-range {
    display: block;
    color: #666;
  }

  .no-availability {
    color: #999;
    font-style: italic;
  }

  /* Utility Classes */
  .text-center { text-align: center; }
  .text-muted { color: #666; }
  .text-success { color: #2e7d32; }
  .text-warning { color: #f57c00; }
  .text-error { color: #d32f2f; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }

  /* Loading State */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #666;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-top-color: #1976d2;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/**
 * JavaScript helper functions embedded in UI components
 */
export const UI_SCRIPTS = `
  // Book slot - opens booking URL in new tab
  function bookSlot(bookingUrl) {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank');
      // Notify parent of action
      window.parent.postMessage({
        type: 'intent',
        payload: {
          action: 'book_slot',
          bookingUrl: bookingUrl
        }
      }, '*');
    }
  }

  // Add to calendar - opens calendar link
  function addToCalendar(calendarUrl) {
    if (calendarUrl) {
      window.open(calendarUrl, '_blank');
      window.parent.postMessage({
        type: 'intent',
        payload: {
          action: 'add_calendar',
          calendarUrl: calendarUrl
        }
      }, '*');
    }
  }

  // Save venue to favorites
  function saveVenue(venueId, venueName) {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'save_favorite_venue',
        params: {
          venue_id: venueId,
          venue_name: venueName
        }
      }
    }, '*');
  }

  // Remove venue from favorites
  function removeVenue(venueId) {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'remove_favorite_venue',
        params: {
          venue_id: venueId
        }
      }
    }, '*');
  }

  // Submit search form
  function submitSearch(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'find_available_games',
        params: {
          location: formData.get('location'),
          date: formData.get('date'),
          preferred_time_start: formData.get('time_start') || undefined,
          preferred_time_end: formData.get('time_end') || undefined,
          max_distance_km: parseInt(formData.get('max_distance')) || 10
        }
      }
    }, '*');
  }

  // Show slots for a specific day
  function showDaySlots(date) {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'check_availability',
        params: {
          date: date
        }
      }
    }, '*');
  }

  // Check availability at venue
  function checkVenueAvailability(venueId, venueName, date) {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'check_availability',
        params: {
          venue_id: venueId,
          venue_name: venueName,
          date: date || new Date().toISOString().split('T')[0]
        }
      }
    }, '*');
  }

  // Notify parent of UI size change
  function notifyResize() {
    const height = document.body.scrollHeight;
    window.parent.postMessage({
      type: 'ui-size-change',
      payload: { height: height }
    }, '*');
  }

  // Auto-resize on load
  window.addEventListener('load', notifyResize);
  window.addEventListener('resize', notifyResize);
`;

/**
 * Wrap HTML content with styles and scripts
 */
export function wrapWithStyles(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${content}
  <script>${UI_SCRIPTS}</script>
</body>
</html>
  `.trim();
}
