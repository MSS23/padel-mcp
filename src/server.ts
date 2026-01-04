#!/usr/bin/env node
/**
 * Padel Finder MCP Server - HTTP/SSE Transport
 *
 * This version runs as a web service using Server-Sent Events (SSE) transport
 * for deployment on platforms like Render.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerTools } from './tools/index.js';
import { createServer } from 'http';
import { parse } from 'url';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main(): Promise<void> {
  // Create MCP server instance
  const server = new McpServer({
    name: 'padel-finder',
    version: '2.0.0',
  });

  // Register all tools
  registerTools(server);

  // Store active transports
  const transports = new Map<string, SSEServerTransport>();

  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    const url = parse(req.url || '', true);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        server: 'padel-finder',
        version: '2.0.0',
        endpoints: {
          sse: '/sse',
          messages: '/messages'
        }
      }));
      return;
    }

    // SSE endpoint - client connects here
    if (url.pathname === '/sse') {
      console.log('New SSE connection');

      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      transports.set(sessionId, transport);

      // Clean up on disconnect
      res.on('close', () => {
        console.log('SSE connection closed:', sessionId);
        transports.delete(sessionId);
      });

      await server.connect(transport);
      return;
    }

    // Messages endpoint - client sends messages here
    if (url.pathname === '/messages' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        // Find the transport for this session (from query param or header)
        const sessionId = url.query.sessionId as string;
        const transport = transports.get(sessionId);

        if (!transport) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No active session' }));
          return;
        }

        try {
          await transport.handlePostMessage(req, res, body);
        } catch (error) {
          console.error('Error handling message:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  httpServer.listen(PORT, () => {
    console.log(`Padel Finder MCP Server v2.0 (HTTP/SSE)`);
    console.log(`Listening on port ${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  GET  /        - Health check`);
    console.log(`  GET  /sse     - SSE connection`);
    console.log(`  POST /messages - Send messages`);
  });
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
