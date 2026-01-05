/**
 * Toast Notification Component
 *
 * Provides toast notifications for user feedback.
 * Includes success, error, info, and warning variants.
 */

export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: string; // JavaScript function name to call
  };
}

/**
 * Generate HTML for a toast notification
 */
export function generateToastHTML(options: ToastOptions): string {
  const { type, title, message, duration = 4000, action } = options;

  const icons: Record<string, string> = {
    success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
    </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill="currentColor" clip-rule="evenodd"/>
    </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fill="currentColor" clip-rule="evenodd"/>
    </svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fill="currentColor" clip-rule="evenodd"/>
    </svg>`,
  };

  const actionHtml = action
    ? `<button class="toast-action" onclick="${action.handler}">${action.label}</button>`
    : '';

  return `
    <div class="toast toast-${type}" data-duration="${duration}">
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      ${actionHtml}
      <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="toast-progress"></div>
    </div>
  `;
}

/**
 * Generate the toast container HTML (should be added to page once)
 */
export function generateToastContainerHTML(): string {
  return `<div id="toast-container" class="toast-container"></div>`;
}

/**
 * Generate JavaScript for the toast system
 */
export function generateToastSystemScript(): string {
  return `
    // Toast System - Already included in styles.ts
    // This script is for reference or standalone use

    if (typeof ToastSystem === 'undefined') {
      window.ToastSystem = {
        container: null,

        init: function() {
          if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
              this.container = document.createElement('div');
              this.container.id = 'toast-container';
              this.container.className = 'toast-container';
              document.body.appendChild(this.container);
            }
          }
        },

        show: function(options) {
          this.init();

          var type = options.type || 'info';
          var title = options.title || '';
          var message = options.message || '';
          var duration = options.duration || 4000;

          var toast = document.createElement('div');
          toast.className = 'toast toast-' + type;

          var icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill="currentColor" clip-rule="evenodd"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fill="currentColor" clip-rule="evenodd"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fill="currentColor" clip-rule="evenodd"/></svg>'
          };

          toast.innerHTML =
            '<div class="toast-icon">' + icons[type] + '</div>' +
            '<div class="toast-content">' +
            (title ? '<div class="toast-title">' + title + '</div>' : '') +
            '<div class="toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="toast-close" aria-label="Close">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</button>' +
            '<div class="toast-progress" style="animation-duration: ' + duration + 'ms"></div>';

          toast.querySelector('.toast-close').addEventListener('click', function() {
            toast.classList.add('toast-exit');
            setTimeout(function() { toast.remove(); }, 300);
          });

          this.container.appendChild(toast);

          if (duration > 0) {
            setTimeout(function() {
              if (toast.parentElement) {
                toast.classList.add('toast-exit');
                setTimeout(function() { toast.remove(); }, 300);
              }
            }, duration);
          }

          return toast;
        },

        success: function(message, title) {
          return this.show({ type: 'success', message: message, title: title });
        },

        error: function(message, title) {
          return this.show({ type: 'error', message: message, title: title });
        },

        info: function(message, title) {
          return this.show({ type: 'info', message: message, title: title });
        },

        warning: function(message, title) {
          return this.show({ type: 'warning', message: message, title: title });
        }
      };
    }
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
