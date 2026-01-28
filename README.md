# Padel Finder MCP Server

An MCP (Model Context Protocol) server for finding available padel courts via Playtomic API. Now supports both Goose MCP-UI and ChatGPT Apps with real Playtomic API integration.

## Features

### Core Tools
- `find_nearby_courts` - Find padel venues near a location
- `check_availability` - Check available time slots at a venue
- `find_available_games` - Find the nearest available game
- `compare_prices` - Compare prices across venues

### Advanced Tools
- `get_venue_details` - Get detailed venue information
- `search_by_duration` - Find slots with specific duration (60/90/120 min)
- `get_weekly_availability` - View availability across multiple days
- `find_cheapest_time` - Find cheapest available slots
- `get_peak_hours` - Analyze busy/quiet times at venues

### Favorites
- `save_favorite_venue` - Save a venue to favorites
- `remove_favorite_venue` - Remove from favorites
- `list_favorite_venues` - List all favorites
- `quick_book_check` - Check availability at all favorites

### Alerts
- `set_availability_alert` - Set up alerts for preferred slots
- `list_availability_alerts` - List all active alerts
- `cancel_availability_alert` - Cancel an alert

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Playtomic API Configuration
PLAYTOMIC_CLIENT_ID=your_client_id_here
PLAYTOMIC_CLIENT_SECRET=your_client_secret_here
PLAYTOMIC_API_BASE=https://api.playtomic.io/v1
PLAYTOMIC_RATE_LIMIT_PER_MIN=1
PLAYTOMIC_SPORT_ID=1

# Geocoding Configuration
GEOCODING_PROVIDER=nominatim
GEOCODING_API_KEY=

# Server Configuration
NODE_ENV=development
PORT=3000
```

### Getting Playtomic API Credentials

1. Contact Playtomic support to request API credentials
2. Review the [Playtomic External API v1.5 Documentation](https://developers.playtomic.io/)
3. Set `PLAYTOMIC_CLIENT_ID` and `PLAYTOMIC_CLIENT_SECRET` in your `.env` file

## Usage

### Run the MCP server (stdio)

```bash
npm start:stdio
```

### Run the HTTP/SSE server

```bash
npm start
```

### Development mode

```bash
npm run dev
```

## MCP Configuration

### For Goose/Claude Desktop

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "padel-finder": {
      "command": "node",
      "args": ["path/to/padel-finder/dist/index.js"]
    }
  }
}
```

### For ChatGPT Apps

The server automatically detects ChatGPT clients and returns widgets in `text/html+skybridge` format. No special configuration needed.

## Architecture

### Phase 1: Real API Integration ✅

- **Playtomic API**: Real authentication, venue search, and availability checking
- **Geocoding**: Nominatim OSM integration with 7-day caching
- **Rate Limiting**: Smart queuing system respecting 1 req/min limit
- **Caching**: Optimized TTLs (5min availability, 24h venues, 7d geocoding)

### Phase 2: Widget Infrastructure ✅

- **Preact Widgets**: Lightweight React alternative (3KB vs 44KB)
- **Widget Bundler**: Server-side rendering to HTML
- **Core Widgets**: SlotCards, SearchForm, WeeklyCalendar, PriceComparison

### Phase 3: ChatGPT Apps Integration ✅

- **UI Adapter**: Automatic client detection (Goose vs ChatGPT)
- **Backward Compatible**: Existing Goose MCP-UI still works
- **Display Modes**: Inline, fullscreen, picture-in-picture support

### Phase 4: Backward Compatibility ✅

- **Dual Format Support**: Returns `text/html` for Goose, `text/html+skybridge` for ChatGPT
- **Auto-Detection**: Detects client from User-Agent headers
- **Zero Breaking Changes**: Existing integrations continue to work

## Widget Development

### Creating New Widgets

1. Create widget component in `src/widgets/YourWidget/index.tsx`:

```tsx
import { h } from 'preact';
import type { YourWidgetProps } from '../common/types.js';

export function YourWidgetWidget(props: YourWidgetProps) {
  return <div>Your widget content</div>;
}
```

2. Register in `src/widget-renderer/bundler.ts`:

```typescript
case 'YourWidget':
  const { YourWidgetWidget } = await import('../widgets/YourWidget/index.js');
  WidgetComponent = YourWidgetWidget;
  break;
```

3. Use in tools via UI adapter:

```typescript
const uiAdapter = getUIAdapter();
const widget = await uiAdapter.createYourWidgetUI(data);
```

## API Integration

### Playtomic API

- **Authentication**: Bearer token with auto-refresh
- **Rate Limiting**: 1 request per minute (queued automatically)
- **Batching**: Fetches up to 25 hours per request
- **Error Handling**: Graceful fallback to cached data

### Geocoding

- **Provider**: Nominatim OSM (free, no API key required)
- **Caching**: 7-day cache for addresses and reverse geocoding
- **Fallback**: Hardcoded coordinates for popular UK cities

## Performance

- **API Response**: < 500ms p95 (with caching)
- **Cache Hit Rate**: > 80% after warmup
- **Widget Bundle**: < 200KB per widget
- **Widget Render**: < 100ms initial load

## Deployment

### Render.com

1. Set environment variables in Render dashboard
2. Deploy using `npm start` (HTTP/SSE server)
3. Health check: `GET /health`

### Local Development

```bash
npm run dev  # HTTP/SSE with hot reload
npm start:stdio  # stdio transport for MCP clients
```

## Testing

### Verification Steps

1. **API Integration**: 
   ```bash
   # Test venue search
   curl -X POST http://localhost:3000/messages -d '{"method":"tools/call","params":{"name":"find_available_games","arguments":{"location":"London","date":"2025-01-29"}}}'
   ```

2. **Widget Rendering**: Check that widgets render correctly in ChatGPT Apps

3. **Backward Compatibility**: Verify Goose clients still receive HTML format

## Troubleshooting

### Playtomic API Errors

- **401 Unauthorized**: Check `PLAYTOMIC_CLIENT_ID` and `PLAYTOMIC_CLIENT_SECRET`
- **429 Rate Limit**: Normal - requests are automatically queued
- **Timeout**: Check network connectivity, API may be slow

### Geocoding Issues

- **No results**: Try more specific address or use coordinates
- **Rate limit**: Nominatim allows 1 req/sec - caching helps

### Widget Issues

- **Not rendering**: Check browser console for errors
- **ChatGPT API not available**: Widgets fall back to static HTML

## License

MIT

## Resources

- [Playtomic External API Documentation](https://developers.playtomic.io/)
- [OpenAI Apps SDK Examples](https://platform.openai.com/docs/guides/apps)
- [MCP Server Builder Guide](https://modelcontextprotocol.io/)
