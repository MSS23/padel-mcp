# ChatGPT Widget Demo

This demo generates standalone HTML files for testing ChatGPT widgets with mock data, without requiring a running MCP server or ChatGPT environment.

## Quick Start

```bash
npm run demo:widgets
```

This will generate 4 HTML files in `demo/output/`:
- `SlotCards.html` - Displays available padel court slots
- `SearchForm.html` - Interactive search form
- `WeeklyCalendar.html` - Weekly availability calendar
- `PriceComparison.html` - Price comparison chart

## Opening the Demo Files

Simply open any of the generated HTML files in your web browser:

```bash
# On macOS
open demo/output/SlotCards.html

# On Linux
xdg-open demo/output/SlotCards.html

# On Windows
start demo/output/SlotCards.html
```

## Testing Widgets

### Visual Testing

1. **SlotCards Widget**: 
   - Expand slot cards to see details
   - Click "Book Now" buttons (will show alert with mock API call)
   - Click favorite star icons
   - Verify weather information displays correctly

2. **SearchForm Widget**:
   - Fill in location, date, and time fields
   - Adjust distance slider
   - Submit form (will show alert with mock API call)
   - Verify form validation

3. **WeeklyCalendar Widget**:
   - View 7-day availability heat map
   - Check slot counts and average prices per day
   - Verify color intensity reflects availability

4. **PriceComparison Widget**:
   - Compare prices across venues
   - View price ranges (min/avg/max)
   - Check slot counts per venue

### Testing window.openai API

Open your browser's developer console (F12) and try:

```javascript
// Test tool call
window.openai.callTool({
  toolName: 'find_available_games',
  params: {
    location: 'London',
    date: '2025-01-30',
    preferred_time_start: '18:00',
    preferred_time_end: '20:00'
  }
});

// Test display mode request
window.openai.requestDisplayMode('fullscreen');
```

You should see:
- Console logs showing the API calls
- Alert dialogs with the call details (for demo purposes)

## Mock Data

The demo uses realistic mock data:
- **122 venues** across 13 UK cities
- **Dynamic pricing** based on time, day, and venue type
- **Realistic availability** patterns (busier evenings/weekends)
- **Weather information** for outdoor courts
- **Booking URLs** and calendar links

## Widget Features Demonstrated

### SlotCards Widget
- ✅ Expandable slot cards with venue details
- ✅ Weather display per slot
- ✅ Book Now button (opens Playtomic)
- ✅ Add to Favorites button
- ✅ Grouping by venue
- ✅ Distance information

### SearchForm Widget
- ✅ Location input (address or city)
- ✅ Date picker
- ✅ Time range selection
- ✅ Distance slider
- ✅ Form submission with ChatGPT API integration
- ✅ Display mode requests

### WeeklyCalendar Widget
- ✅ 7-day availability view
- ✅ Heat map style indicators
- ✅ Slot counts per day
- ✅ Average price display
- ✅ Sample slots preview

### PriceComparison Widget
- ✅ Price comparison across venues
- ✅ Bar chart visualization
- ✅ Min/avg/max price display
- ✅ Slot count per venue

## Troubleshooting

### Widgets don't render
- Check browser console for errors
- Ensure JavaScript is enabled
- Try a different browser (Chrome, Firefox, Safari)

### window.openai is undefined
- The mock API is injected automatically
- Check browser console for initialization message
- Reload the page if needed

### No slots displayed
- Mock data is generated for tomorrow's date
- Check that your system date is correct
- Try running the demo again to regenerate data

## Integration with ChatGPT Apps

When integrated with ChatGPT Apps, the widgets will:
- Use real `window.openai` API (not mock)
- Receive actual tool call responses
- Update display modes dynamically
- Persist widget state across chat turns

## Next Steps

1. **Customize Mock Data**: Edit `src/services/playtomic.ts` to modify venue data
2. **Add New Widgets**: Create widgets in `src/widgets/` and register in bundler
3. **Test in ChatGPT**: Deploy MCP server and test widgets in actual ChatGPT environment
4. **Enhance Styling**: Modify widget styles in individual widget files

## Files Generated

All demo files are saved to `demo/output/` (gitignored):
- `SlotCards.html` - ~50-100KB
- `SearchForm.html` - ~30-50KB
- `WeeklyCalendar.html` - ~40-60KB
- `PriceComparison.html` - ~40-60KB

Each file is self-contained and can be shared or deployed independently.
