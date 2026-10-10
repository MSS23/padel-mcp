#!/usr/bin/env node
/**
 * Padel Finder MCP Server - stdio transport (Claude Desktop, Claude Code, Goose).
 * stdout is reserved for MCP messages: log to stderr only.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPadelServer } from './tools/index.js';

async function main(): Promise<void> {
  const server = createPadelServer();
  await server.connect(new StdioServerTransport());
  console.error('Padel Finder MCP Server started (stdio, demo data)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
