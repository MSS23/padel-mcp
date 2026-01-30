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
      import { h, hydrate } from 'https://esm.sh/preact@10.19.0';
      import { useState, useEffect, useCallback } from 'https://esm.sh/preact@10.19.0/hooks';

      const props = window.__WIDGET_PROPS__;
      const widgetName = window.__WIDGET_NAME__;

      // Widget-specific hydration
      if (widgetName === 'HelloWorld') {
        const root = document.getElementById('widget-root');
        const button = root?.querySelector('[data-action="increment"]');
        const counterSpan = root?.querySelector('[data-counter]');

        if (button && counterSpan) {
          let count = 0;
          button.addEventListener('click', () => {
            count++;
            counterSpan.textContent = count;
            alert('Button clicked! Count is now: ' + count);
            
            // Update status text
            const statusText = root.querySelector('p[style*="marginTop"]');
            if (statusText) {
              statusText.textContent = '✅ Hydration works!';
            }
          });
          console.log('✅ HelloWorld hydrated');
        }
      } else if (widgetName === 'SlotCards') {
        const buttons = document.querySelectorAll('[data-action="book"]');
        buttons.forEach((button) => {
          button.addEventListener('click', async () => {
            const venueId = button.getAttribute('data-venue-id');
            const venueName = button.getAttribute('data-venue-name');
            const startTime = button.getAttribute('data-start-time');
            const durationMinutes = button.getAttribute('data-duration-minutes');
            const price = button.getAttribute('data-price');
            const currency = button.getAttribute('data-currency');
            const courtName = button.getAttribute('data-court-name');

            if (window.openai?.callTool) {
              try {
                await window.openai.callTool({
                  toolName: 'book_court',
                  params: {
                    venue_id: venueId,
                    venue_name: venueName,
                    start_time: startTime,
                    duration_minutes: parseInt(durationMinutes || '90', 10),
                    price: parseFloat(price || '0'),
                    currency: currency || 'GBP',
                    court_name: courtName,
                  },
                });
              } catch (error) {
                console.error('Booking error:', error);
                alert('Booking failed: ' + (error instanceof Error ? error.message : String(error)));
              }
            }
          });
        });
        console.log('✅ SlotCards hydrated (' + buttons.length + ' buttons)');
      } else if (widgetName === 'CheckoutWizard') {
        // Multi-step wizard hydration will be handled by widget-specific code
        console.log('✅ CheckoutWizard rendered (hydration handled by widget)');
      }

      // Notify parent of size
      function notifySize() {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
      }

      setTimeout(notifySize, 100);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(notifySize).observe(document.body);
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

    /* Checkmark Animation */
    @keyframes checkmarkDraw {
      0% { stroke-dashoffset: 22; }
      100% { stroke-dashoffset: 0; }
    }

    @keyframes checkmarkCircleFill {
      0% { stroke-dashoffset: 157; }
      100% { stroke-dashoffset: 0; }
    }

    @keyframes confettiFall {
      0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
    }

    @keyframes starScale {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes starGlow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5)); }
      50% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.9)); }
    }

    @keyframes sparkleFade {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(40px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(60px) scale(0);
      }
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
      case 'HelloWorld': {
        const helloModule = await import('../widgets/HelloWorld/index.js');
        WidgetComponent = helloModule.HelloWorldWidget;
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
