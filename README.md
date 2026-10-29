# Padel Finder MCP Server

An MCP server that lets Claude (or any MCP client) find, compare and watch padel court slots near you: "can I play near Chiswick tonight between 18:00 and 21:00?", "cheapest court this weekend", "tell me if a 19:00 slot opens at my club on Friday". It also returns MCP-UI widgets (Goose) and ChatGPT Apps widgets (`text/html+skybridge`).

> **Data is simulated.** There is no live Playtomic integration. The server ships 38 fictional venues across 13 UK cities with generated prices and availability. The original client called `api.playtomic.io/v1`, but that host no longer resolves (checked 2026-10-10). The tools, alerts and widgets all work end-to-end against the simulated data, and the server tells the model it is demo data. `book_court` is a demo checkout: it never books or charges anything. See [docs/REVIEW-2026-10-10.md](docs/REVIEW-2026-10-10.md).

## Quick start

```bash
npm ci
npm test          # builds the server, starts it over stdio, runs a smoke test
```

Requires Node 18+ (developed on Node 22).

### Claude Code

```bash
npm run build:server
claude mcp add padel-finder -- node /absolute/path/to/padel-mcp/dist/index.js
```

### Claude Desktop / Goose

Add this to `claude_desktop_config.json` (Goose uses the same command):

```json
{
  "mcpServers": {
    "padel-finder": {
      "command": "node",
      "args": ["/absolute/path/to/padel-mcp/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Use it for |
|---|---|
| `quick_search` | Presets: `tonight` (17:00+), `tomorrow`, `weekend`, `next_week`, `cheapest_today`. If `location` is omitted, uses the location saved with `set_default_location`. |
| `find_available_games` | Main search: slots near a location on a date (defaults to today), with an optional start-time window. |
| `find_nearby_courts` | Venues near a place, with distance. |
| `check_availability` | Slots at one venue (needs a `venue_id` from a search). |
| `get_venue_details` | Courts, amenities and address for one venue. |
| `search_by_duration` | Slots of one exact length (60, 90 or 120 minutes). |
| `get_weekly_availability` | Multi-day overview. |
| `find_cheapest_time`, `compare_prices` | Price-sorted slots and per-venue price ranges. |
| `get_peak_hours` | Busy and quiet hours at a venue. |
| `save_favorite_venue`, `remove_favorite_venue`, `list_favorite_venues`, `quick_book_check` | Favourites, and "can I play tonight at any of my clubs?" |
| `set_default_location` | Saves the location `quick_search` uses when none is given. |
| `set_availability_alert`, `list_availability_alerts`, `cancel_availability_alert`, `check_alerts` | Watch a venue and time window. See below. |
| `book_court` | Demo checkout widget only. No real booking. |

Locations accept a place name or postcode (geocoded through OpenStreetMap Nominatim) or `"lat,lon"`. Weather comes from Open-Meteo. Neither needs an API key.

### Favourites and alerts

- Stored as JSON in `~/.padel-finder/` (`preferences.json`, `alerts.json`), so they survive restarts. On a hosted server that directory is ephemeral.
- **Alerts are evaluated when `check_alerts` runs, or when you run `node dist/index.js --check-alerts`.** The CLI mode checks every active alert once, prints each fired alert as a JSON line and exits, so you can schedule it:
  ```bash
  # crontab: every 15 minutes
  */15 * * * * cd /path/to/padel-mcp && node dist/index.js --check-alerts >> ~/.padel-finder/cron.log 2>&1
  ```
  On Windows, point a Task Scheduler task at the same command. A matching alert fires once, using one of these methods:
  - `log`: appends to `~/.padel-finder/notifications.log`
  - `webhook`: POSTs JSON to your URL. An [ntfy](https://ntfy.sh) topic URL (`https://ntfy.sh/<your-topic>`) works as is and pushes to your phone. Telegram's Bot API needs its own `{chat_id, text}` body, so put a relay (n8n, a small function) in front of it.
  - `callback`: the slots are only returned in the `check_alerts` response

## HTTP server (Streamable HTTP)

```bash
npm run build && npm start      # PORT defaults to 3000
```

- `GET /` and `GET /health` return a health check.
- `POST /mcp` is the MCP endpoint (Streamable HTTP, stateless). The old SSE endpoints (`/sse`, `/messages`) are gone; SSE is deprecated in the MCP spec.

Each request gets its own MCP server instance. `render.yaml` deploys this to Render's free plan as the `padel-mcp` service (`padel-mcp.onrender.com`), which is currently suspended. If hosted, `~/.padel-finder` is shared by every user and wiped on redeploy.

The only environment variable is `PORT`, and only the HTTP server reads it (see `.env.example`).

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Builds the widgets (Vite, to `dist/widgets`) and the server (tsc, to `dist/`) |
| `npm run build:server` | Builds the server only. This is all the MCP server needs at runtime. |
| `npm run typecheck` | `tsc --noEmit` over all of `src/`, widgets included |
| `npm test` | `build:server` followed by `scripts/smoke.mjs`. The smoke test checks the tool list, a search, input validation, set → check alert firing, `set_default_location`, `--check-alerts`, and a tool list over HTTP `/mcp`. It uses a temporary HOME. |
| `npm run dev` | HTTP server with hot reload (tsx) |
| `npm run start:stdio` | stdio server |
| `npm run demo:widgets` | Writes standalone widget HTML files to `demo/output/` (see `demo/README.md`) |

## Architecture

```
src/
  index.ts / server.ts      stdio (+ `--check-alerts`) / Streamable HTTP entry points; both use createPadelServer()
  tools/index.ts            server factory, LLM instructions, tool registration
  tools/*.ts                one file per tool (zod schemas = input validation)
  services/playtomic.ts     simulated venue + slot source; `CourtDataSource` + `setCourtDataSource()` is the swap point for a real API
  services/geocoding.ts     Nominatim + hardcoded UK city fallback, cached
  services/weather.ts       Open-Meteo forecast per slot
  services/alerts.ts        alert persistence + notification delivery
  services/preferences.ts   favourites persistence
  utils/ui-adapter.ts       picks Goose MCP-UI (text/html) or ChatGPT Apps (text/html+skybridge)
  widget-renderer/          server-side Preact rendering for ChatGPT widgets
  widgets/                  Preact widget components
  ui/                       HTML/CSS components for Goose MCP-UI
```

### Adding a widget

1. Create `src/widgets/YourWidget/index.tsx` (Preact).
2. Add a `case 'YourWidget'` to `src/widget-renderer/bundler.ts`.
3. Return it from a tool through `getUIAdapter(detectClientType())`.

## License

MIT
