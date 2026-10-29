// Smoke test: start dist/index.js over stdio, list tools, call read-only tools,
// and run the alert loop (set -> check -> fires). Uses a throwaway HOME so the
// real ~/.padel-finder is untouched. No network needed (coords + weather off).
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'padel-smoke-'));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/index.js'],
  env: { ...process.env, HOME: home, USERPROFILE: home },
  stderr: 'ignore',
});
const client = new Client({ name: 'smoke', version: '0.0.0' });
const text = (r) => r.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
let http;
const tomorrow = new Date(Date.now() + 864e5).toLocaleDateString('en-CA');

try {
  await client.connect(transport);
  assert.match(client.getInstructions() ?? '', /SIMULATED/, 'server instructions must disclose demo data');

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  for (const n of ['find_available_games', 'quick_search', 'set_availability_alert', 'check_alerts', 'set_default_location']) {
    assert.ok(names.includes(n), `missing tool ${n}`);
  }
  assert.ok(!names.some((n) => n.startsWith('test_')), 'test tools should not be exposed');

  // Chiswick (lat,lon so no geocoding call), tomorrow
  const games = await client.callTool({
    name: 'find_available_games',
    arguments: { location: '51.4927,-0.2661', date: tomorrow, preferred_time_start: '06:00', preferred_time_end: '22:00', include_weather: false },
  });
  assert.ok(!games.isError, text(games));
  const json = JSON.parse(text(games).match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.ok(json.total_found > 0, 'expected slots near Chiswick');
  assert.equal(json.results[0].venue_id.startsWith('london-'), true);

  const noDate = await client.callTool({ name: 'find_available_games', arguments: { location: '51.4927,-0.2661', include_weather: false } });
  assert.ok(!noDate.isError, 'date should be optional');

  const badVenue = await client.callTool({ name: 'set_availability_alert', arguments: { venue_id: 'nope', date: tomorrow, preferred_time_start: '18:00', preferred_time_end: '21:00' } });
  assert.equal(badVenue.isError, true, 'unknown venue must be rejected');

  const alert = await client.callTool({
    name: 'set_availability_alert',
    arguments: { venue_id: 'london-chiswick', date: tomorrow, preferred_time_start: '06:00', preferred_time_end: '22:00', notification_method: 'callback' },
  });
  assert.ok(!alert.isError, text(alert));
  const check = await client.callTool({ name: 'check_alerts', arguments: {} });
  assert.match(text(check), /"slots_found": 1/, 'alert should fire');

  const def = await client.callTool({ name: 'set_default_location', arguments: { location: '51.4927,-0.2661' } });
  assert.ok(!def.isError, text(def));
  const tonight = await client.callTool({ name: 'quick_search', arguments: { preset: 'tomorrow' } });
  assert.ok(!tonight.isError, 'quick_search should use the default location: ' + text(tonight));

  // --check-alerts: one scheduled pass over a fresh alert, printed as a JSON line
  await client.callTool({
    name: 'set_availability_alert',
    arguments: { venue_id: 'london-chiswick', date: tomorrow, preferred_time_start: '06:00', preferred_time_end: '21:00', notification_method: 'log' },
  });
  const cron = execFileSync(process.execPath, ['dist/index.js', '--check-alerts'], { env: { ...process.env, HOME: home, USERPROFILE: home }, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  assert.match(cron, /"venue":"/, '--check-alerts should fire the pending alert');

  // Streamable HTTP entry point
  const port = 3900 + Math.floor(Math.random() * 90);
  http = spawn(process.execPath, ['dist/server.js'], { env: { ...process.env, PORT: String(port), HOME: home, USERPROFILE: home }, stdio: 'ignore' });
  let httpClient;
  for (let i = 0; i < 50 && !httpClient; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const c = new Client({ name: 'smoke-http', version: '0.0.0' });
    try { await c.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`))); httpClient = c; } catch {}
  }
  assert.ok(httpClient, 'HTTP server did not accept /mcp');
  assert.equal((await httpClient.listTools()).tools.length, names.length, 'HTTP and stdio expose the same tools');
  await httpClient.close();

  console.log(`smoke OK: ${names.length} tools, ${json.total_found} slots, alert fired, --check-alerts + HTTP ok`);
} finally {
  http?.kill();
  await client.close().catch(() => {});
  rmSync(home, { recursive: true, force: true });
}
