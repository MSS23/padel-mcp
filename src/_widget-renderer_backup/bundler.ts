/**
 * Widget Bundler
 *
 * Bundles React/Preact widgets into self-contained HTML with text/html+skybridge format
 * for ChatGPT Apps integration.
 */

import { render } from 'preact-render-to-string';
import type { EnhancedTimeSlot } from '../types/index.js';

export interface WidgetBundle {
  name: string;
  html: string;
  mimeType: 'text/html+skybridge';
}

/**
 * Generate a unique session ID for widget state
 */
export function generateSessionId(prefix: string = 'widget'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Bundle a widget component into self-contained HTML
 */
export async function bundleWidget(
  widgetName: string,
  props: Record<string, any>
): Promise<WidgetBundle> {
  // Import the widget component dynamically
  let WidgetComponent: any;
  
  try {
    switch (widgetName) {
      case 'SlotCards':
        const { SlotCardsWidget } = await import('../widgets/SlotCards/index.js');
        WidgetComponent = SlotCardsWidget;
        break;
      case 'SearchForm':
        const { SearchFormWidget } = await import('../widgets/SearchForm/index.js');
        WidgetComponent = SearchFormWidget;
        break;
      case 'WeeklyCalendar':
        const { WeeklyCalendarWidget } = await import('../widgets/WeeklyCalendar/index.js');
        WidgetComponent = WeeklyCalendarWidget;
        break;
      case 'PriceComparison':
        const { PriceComparisonWidget } = await import('../widgets/PriceComparison/index.js');
        WidgetComponent = PriceComparisonWidget;
        break;
      default:
        throw new Error(`Unknown widget: ${widgetName}`);
    }
  } catch (error) {
    console.error(`Failed to import widget ${widgetName}:`, error);
    throw error;
  }

  // Render widget to string
  const widgetHtml = render(WidgetComponent(props));

  // Create HTML wrapper with props injection and ChatGPT Apps integration
  const html = createWidgetHTML(widgetName, widgetHtml, props);

  return {
    name: widgetName,
    html,
    mimeType: 'text/html+skybridge',
  };
}

/**
 * Create self-contained HTML with ChatGPT Apps API integration
 */
function createWidgetHTML(
  widgetName: string,
  widgetContent: string,
  props: Record<string, any>
): string {
  const sessionId = props.widgetSessionId || generateSessionId(widgetName);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${widgetName} Widget</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    #widget-root {
      width: 100%;
      min-height: 100vh;
    }
  </style>
  <script type="module">
    // ChatGPT Apps API integration
    window.openai = window.openai || {
      callTool: async (params) => {
        console.log('ChatGPT tool call:', params);
        // This will be handled by ChatGPT Apps runtime
        return await window.parent?.postMessage({
          type: 'openai-tool-call',
          ...params
        }, '*');
      },
      requestDisplayMode: (mode) => {
        console.log('Request display mode:', mode);
        window.parent?.postMessage({
          type: 'openai-display-mode',
          mode
        }, '*');
      },
    };

    // Widget props injection
    window.__WIDGET_PROPS__ = ${JSON.stringify(props)};
    window.__WIDGET_SESSION_ID__ = '${sessionId}';
  </script>
</head>
<body>
  <div id="widget-root">
    ${widgetContent}
  </div>
  <script type="module">
    // Widget hydration script will be injected here in production build
    // For now, we use server-side rendering
  </script>
</body>
</html>`;
}

/**
 * Determine display mode based on content and interaction type
 */
export function determineDisplayMode(
  slots: EnhancedTimeSlot[],
  interactionType: 'search' | 'results' | 'alert' = 'results'
): 'inline' | 'fullscreen' | 'picture-in-picture' {
  if (interactionType === 'search') return 'fullscreen';
  if (slots.length > 15) return 'fullscreen';
  if (interactionType === 'alert') return 'picture-in-picture';
  return 'inline';
}
