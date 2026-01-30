/**
 * Widget Bundler
 *
 * Server-side renders Preact widgets and bundles them for ChatGPT Apps.
 * Uses preact-render-to-string for SSR and includes hydration for interactivity.
 */

import { render } from 'preact-render-to-string';
import { h } from 'preact';

export type DisplayMode = 'inline' | 'fullscreen' | 'picture-in-picture';

export function determineDisplayMode(slots?: any[], interactionType?: string): DisplayMode {
  if (interactionType === 'checkout' || interactionType === 'confirmation') {
    return 'fullscreen';
  }
  if (slots && slots.length > 10) {
    return 'fullscreen';
  }
  return 'inline';
}

export interface WidgetBundle {
  html: string;
  name: string;
  mimeType: 'text/html+skybridge';
}

/**
 * Convert inline style objects to CSS string
 */
function stylesToCSS(styles: Record<string, any>): string {
  const cssRules: string[] = [];
  
  function processStyles(obj: Record<string, any>, selector: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - create a class
        const className = selector ? `${selector}-${key}` : key;
        processStyles(value, className);
      } else if (typeof value === 'string' || typeof value === 'number') {
        // CSS property
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssRules.push(`  ${cssKey}: ${value}${typeof value === 'number' && !cssKey.includes('opacity') && !cssKey.includes('z-index') ? 'px' : ''};`);
      }
    }
  }
  
  processStyles(styles);
  return cssRules.join('\n');
}

/**
 * Generate hydration script for ChatGPT Apps widgets
 * Widgets run in an iframe and communicate via postMessage
 */
function generateHydrationScript(widgetName: string, props: Record<string, any>): string {
  // Props are injected as JSON in a script tag
  const propsJson = JSON.stringify(props).replace(/</g, '\\u003c');
  
  return `
    <script>
      // Inject props
      window.__WIDGET_PROPS__ = ${propsJson};
      window.__WIDGET_NAME__ = ${JSON.stringify(widgetName)};
      
      // ChatGPT Apps API shim
      window.openai = window.openai || {};
      
      // Tool calling via postMessage
      window.openai.callTool = async function({ toolName, params }) {
        return new Promise((resolve, reject) => {
          const messageId = 'tool-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          
          // Send message to parent (ChatGPT)
          window.parent.postMessage({
            type: 'tool',
            toolName,
            params,
            messageId
          }, '*');
          
          // Listen for response
          const handler = (event) => {
            if (event.data && event.data.messageId === messageId) {
              window.removeEventListener('message', handler);
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data.result);
              }
            }
          };
          
          window.addEventListener('message', handler);
          
          // Timeout after 30s
          setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error('Tool call timeout'));
          }, 30000);
        });
      };
      
      // Display mode helper
      window.openai.requestDisplayMode = function(mode) {
        window.parent.postMessage({
          type: 'display-mode',
          mode
        }, '*');
      };
      
      // Notify parent of widget size changes
      function notifySize() {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({
          type: 'resize',
          height
        }, '*');
      }
      
      // Initial size notification
      setTimeout(notifySize, 100);
      
      // Watch for size changes
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(notifySize);
        resizeObserver.observe(document.body);
      }
    </script>
    <script type="module">
      // Load Preact from CDN
      import { h, render } from 'https://esm.sh/preact@10.19.0';
      import { useState, useEffect, useCallback } from 'https://esm.sh/preact@10.19.0/hooks';
      
      // Make Preact available globally for widgets
      window.preact = { h, render, useState, useEffect, useCallback };
      
      // Widget component loaders - these will be dynamically imported
      // For now, widgets are SSR'd and we'll add minimal interactivity
      // Full hydration would require bundling widget code separately
      
      // Add click handlers to SSR'd HTML for basic interactivity
      function addInteractivity() {
        const container = document.getElementById('widget-root');
        if (!container) return;
        
        // Find all buttons and add click handlers
        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => {
          const onclick = btn.getAttribute('data-onclick');
          if (onclick) {
            btn.addEventListener('click', () => {
              try {
                eval(onclick);
              } catch (e) {
                console.error('Button click error:', e);
              }
            });
          }
        });
        
        // Notify size after interactivity is added
        setTimeout(() => {
          if (window.notifySize) window.notifySize();
        }, 100);
      }
      
      // Start interactivity setup
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addInteractivity);
      } else {
        addInteractivity();
      }
    </script>
  `;
}

/**
 * Generate HTML template wrapper
 */
function generateHTMLTemplate(
  widgetName: string,
  ssrHTML: string,
  css: string,
  hydrationScript: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${widgetName}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #fff;
    }
    
    #widget-root {
      width: 100%;
      min-height: 100px;
    }
    
    /* Widget-specific styles */
    ${css}
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div id="widget-root">${ssrHTML}</div>
  ${hydrationScript}
</body>
</html>`;
}

/**
 * Bundle a widget for ChatGPT Apps
 */
export async function bundleWidget(
  name: string,
  props: Record<string, any>
): Promise<WidgetBundle> {
  try {
    // Dynamically import the widget component
    let WidgetComponent: any;
    
    switch (name) {
      case 'SlotCards': {
        const slotCardsModule = await import('../widgets/SlotCards/index.js');
        WidgetComponent = slotCardsModule.SlotCardsWidget;
        break;
      }
      case 'SearchForm': {
        const searchFormModule = await import('../widgets/SearchForm/index.js');
        WidgetComponent = searchFormModule.SearchFormWidget;
        break;
      }
      case 'WeeklyCalendar': {
        const weeklyCalendarModule = await import('../widgets/WeeklyCalendar/index.js');
        WidgetComponent = weeklyCalendarModule.WeeklyCalendarWidget;
        break;
      }
      case 'PriceComparison': {
        const priceComparisonModule = await import('../widgets/PriceComparison/index.js');
        WidgetComponent = priceComparisonModule.PriceComparisonWidget;
        break;
      }
      case 'CheckoutWizard': {
        const checkoutModule = await import('../widgets/CheckoutWizard/index.js');
        WidgetComponent = checkoutModule.CheckoutWizardWidget;
        break;
      }
      case 'BookingConfirmation': {
        const bookingConfModule = await import('../widgets/BookingConfirmation/index.js');
        WidgetComponent = bookingConfModule.BookingConfirmationWidget;
        break;
      }
      case 'FavoriteConfirmation': {
        const favoriteConfModule = await import('../widgets/FavoriteConfirmation/index.js');
        WidgetComponent = favoriteConfModule.FavoriteConfirmationWidget;
        break;
      }
      default:
        throw new Error(`Unknown widget: ${name}`);
    }
    
    if (!WidgetComponent) {
      throw new Error(`Widget component not found: ${name}`);
    }
    
    // Server-side render the widget
    const ssrHTML = render(h(WidgetComponent, props));
    
    // Extract CSS from component styles (simplified - widgets use inline styles)
    // For now, we'll include common widget styles
    const css = `
      /* Common widget styles */
      .widget-container {
        padding: 16px;
        max-width: 100%;
      }
    `;
    
    // Generate hydration script
    const hydrationScript = generateHydrationScript(name, props);
    
    // Generate complete HTML
    const html = generateHTMLTemplate(name, ssrHTML, css, hydrationScript);
    
    return {
      html,
      name,
      mimeType: 'text/html+skybridge',
    };
  } catch (error) {
    console.error(`Error bundling widget ${name}:`, error);
    // Return error widget
    return {
      html: `<div style="padding: 20px; color: #d32f2f;">
        <h3>Widget Error</h3>
        <p>Failed to load widget: ${name}</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>`,
      name,
      mimeType: 'text/html+skybridge',
    };
  }
}
