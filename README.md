# padel-mcp

An MCP (Model Context Protocol) server for finding available padel courts via Playtomic.

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

## Usage

### Run the MCP server
```bash
npm start
```

### Development mode
```bash
npm run dev
```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "padel-finder": {
      "command": "node",
      "args": ["path/to/padel-mcp/dist/index.js"]
    }
  }
}
```

## API

This server uses the Playtomic API to fetch real-time padel court availability data. No authentication is required for the public availability endpoints.

## License

MIT
