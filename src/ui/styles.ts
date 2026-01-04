/**
 * Professional CSS Styles for MCP-UI Components
 *
 * Clean, modern design for client demos.
 */

export const BASE_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1a2e;
    background: #fafbfc;
    padding: 12px;
  }

  /* Professional Card Design */
  .slot-card {
    background: #ffffff;
    border: 1px solid #e1e4e8;
    border-radius: 16px;
    padding: 20px;
    margin: 12px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .slot-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
  }

  /* Header with Venue & Price */
  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .slot-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }

  .price {
    font-size: 24px;
    font-weight: 700;
    color: #0d9488;
    letter-spacing: -0.5px;
  }

  /* Slot Details */
  .slot-details {
    margin-bottom: 16px;
  }

  .slot-details p {
    margin: 8px 0;
    color: #4a5568;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slot-details .time {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
  }

  /* Weather Info - Compact Single Line */
  .weather-info {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 12px 16px;
    border-radius: 10px;
    margin: 16px 0;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #475569;
  }

  .weather-info span {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .playability {
    margin-left: auto;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
  }

  .playability.good {
    background: #dcfce7;
    color: #166534;
  }

  .playability.warning {
    background: #fef3c7;
    color: #92400e;
  }

  /* Action Buttons */
  .slot-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    color: white;
    flex: 1;
    padding: 14px 24px;
    font-size: 15px;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
  }

  .btn-secondary {
    background: #ffffff;
    color: #0d9488;
    border: 2px solid #0d9488;
    padding: 12px 18px;
  }

  .btn-secondary:hover {
    background: #f0fdfa;
  }

  /* Venue Group Header */
  .venue-group {
    margin-bottom: 28px;
  }

  .venue-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
  }

  .venue-header h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .venue-header p {
    margin: 2px 0;
    font-size: 13px;
    color: #64748b;
  }

  /* Calendar Styles */
  .weekly-calendar {
    background: #ffffff;
    border: 1px solid #e1e4e8;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .weekly-calendar h2 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
  }

  @media (max-width: 600px) {
    .calendar-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .calendar-day {
    background: #fafbfc;
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 14px 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .calendar-day:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .calendar-day.has-slots {
    background: #f0fdfa;
    border-color: #0d9488;
  }

  .calendar-day.has-slots:hover {
    background: #ccfbf1;
  }

  .calendar-day.no-slots {
    opacity: 0.5;
    cursor: default;
  }

  .day-name {
    font-weight: 600;
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .day-date {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    display: block;
    margin: 4px 0;
  }

  .day-weather {
    font-size: 13px;
    margin: 6px 0;
  }

  .slot-count {
    display: block;
    font-weight: 600;
    color: #0d9488;
    font-size: 12px;
  }

  .price-range {
    display: block;
    color: #64748b;
    font-size: 11px;
  }

  /* Search Form */
  .search-form {
    background: #ffffff;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid #e1e4e8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
  }

  .form-group input,
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
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  /* Utility */
  .text-center { text-align: center; }
  .text-muted { color: #64748b; }
  .text-success { color: #0d9488; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #64748b;
  }

  .empty-state p {
    font-size: 16px;
    margin-bottom: 8px;
  }
`;

/**
 * JavaScript for interactive buttons
 */
export const UI_SCRIPTS = `
  function bookSlot(url) {
    if (url) {
      window.open(url, '_blank');
      window.parent.postMessage({ type: 'intent', payload: { action: 'book_slot', bookingUrl: url }}, '*');
    }
  }

  function addToCalendar(url) {
    if (url) {
      window.open(url, '_blank');
      window.parent.postMessage({ type: 'intent', payload: { action: 'add_calendar', calendarUrl: url }}, '*');
    }
  }

  function saveVenue(id, name) {
    window.parent.postMessage({ type: 'tool', payload: { toolName: 'save_favorite_venue', params: { venue_id: id, venue_name: name }}}, '*');
  }

  function showDaySlots(date) {
    window.parent.postMessage({ type: 'tool', payload: { toolName: 'check_availability', params: { date: date }}}, '*');
  }

  function submitSearch(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    window.parent.postMessage({ type: 'tool', payload: {
      toolName: 'find_available_games',
      params: {
        location: fd.get('location'),
        date: fd.get('date'),
        preferred_time_start: fd.get('time_start') || undefined,
        preferred_time_end: fd.get('time_end') || undefined,
        max_distance_km: parseInt(fd.get('max_distance')) || 10
      }
    }}, '*');
  }

  window.addEventListener('load', () => {
    window.parent.postMessage({ type: 'ui-size-change', payload: { height: document.body.scrollHeight }}, '*');
  });
`;

/**
 * Wrap content with styles
 */
export function wrapWithStyles(content: string): string {
  return `<!DOCTYPE html>
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
</html>`;
}
