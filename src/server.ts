#!/usr/bin/env node
/**
 * Padel Finder MCP Server - Streamable HTTP transport
 *
 * Web-service entry point (Render etc.). Stateless: each POST /mcp gets its own
 * McpServer + transport, so concurrent clients never share state.
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createPadelServer } from './tools/index.js';
import { createServer } from 'http';

const PORT = parseInt(process.env.PORT || '3000', 10);

function json(res: import('http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const httpServer = createServer(async (req, res) => {
  const { pathname } = new URL(req.url || '/', 'http://localhost');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/' || pathname === '/health') {
    json(res, 200, { status: 'ok', server: 'padel-finder', version: '2.1.0', endpoints: { mcp: '/mcp' } });
    return;
  }

  if (pathname === '/mcp') {
    // Stateless mode has no server-initiated stream or session to delete.
    if (req.method !== 'POST') {
      json(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
      return;
    }
    const server = createPadelServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        json(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
    return;
  }

  json(res, 404, { error: 'Not found' });
});

httpServer.listen(PORT, () => {
  console.log(`Padel Finder MCP Server v2.1 (Streamable HTTP) on port ${PORT}`);
  console.log('  GET  /     - health check');
  console.log('  POST /mcp  - MCP endpoint');
});
