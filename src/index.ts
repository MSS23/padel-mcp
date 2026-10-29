#!/usr/bin/env node
/**
 * Padel Finder MCP Server - stdio transport (Claude Desktop, Claude Code, Goose).
 * stdout is reserved for MCP messages: log to stderr only.
 *
 * `padel-finder-mcp --check-alerts` instead checks every active alert once and
 * exits, so cron / Task Scheduler can deliver alerts without a model polling.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPadelServer } from './tools/index.js';
import { checkAllAlerts } from './services/alerts.js';

async function main(): Promise<void> {
  const server = createPadelServer();
  await server.connect(new StdioServerTransport());
  console.error('Padel Finder MCP Server started (stdio, demo data)');
}

// One pass: webhook/log alerts notify themselves; fired alerts are also printed as JSON lines.
async function checkAlertsOnce(): Promise<void> {
  const results = await checkAllAlerts();
  const fired = results.filter((r) => r.notified);
  for (const r of fired) {
    console.log(JSON.stringify({ alert_id: r.alert.id, venue: r.alert.venue_name, date: r.alert.date, slots: r.available_slots.length }));
  }
  console.error(`check-alerts: ${results.length} active, ${fired.length} fired`);
}

(process.argv.includes('--check-alerts') ? checkAlertsOnce() : main()).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
