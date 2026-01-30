/**
 * test_hello_world MCP Tool
 *
 * Test widget rendering and interactivity with a simple Hello World widget.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { bundleWidget } from '../widget-renderer/bundler.js';

export function registerTestHelloWorld(server: McpServer): void {
  server.tool(
    'test_hello_world',
    'Test widget rendering and interactivity with a simple Hello World widget',
    {},
    async () => {
      const widgetHtml = await bundleWidget('HelloWorld', {
        widgetSessionId: `test-${Date.now()}`,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: 'Testing widget rendering...',
          },
          {
            type: 'resource' as const,
            resource: {
              uri: 'ui://widget/hello-world',
              mimeType: 'text/html+skybridge' as const,
              text: widgetHtml.html,
            },
          },
        ],
        _meta: {
          'openai/outputTemplate': 'ui://widget/hello-world',
        },
      };
    }
  );
}
