/**
 * Empty State Component
 *
 * Shows a helpful UI when no results are found, with suggestions and quick actions.
 * Now includes an interactive search panel so users can modify their search.
 */

import { wrapWithStyles } from '../styles.js';
import { generateInteractiveSearchHTML } from './interactive-search.js';

export interface EmptyStateParams {
  title?: string;
  message: string;
  suggestions?: string[];
  searchLocation?: string;
  searchDate?: string;
  showSearchPanel?: boolean;
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

/**
 * Generate HTML for empty state / no results view
 */
export function generateEmptyStateHTML(params: EmptyStateParams): string {
  const {
    title = 'No Results Found',
    message,
    suggestions = [],
    searchLocation,
    searchDate,
    showSearchPanel = true
  } = params;

  const suggestionsHtml = suggestions.length > 0
    ? `
      <div class="suggestions">
        <p class="suggestions-title">Try:</p>
        <ul>
          ${suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  // Generate interactive search panel if enabled
  let searchPanelHtml = '';
  if (showSearchPanel) {
    // Extract just the inner HTML from the interactive search (without full HTML wrapper)
    const fullSearchHtml = generateInteractiveSearchHTML({
      location: searchLocation ?? '',
      date: searchDate,
      collapsed: false,
    });
    // Extract content between <body> tags
    const bodyMatch = fullSearchHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    searchPanelHtml = bodyMatch ? bodyMatch[1] : '';
  }

  const content = `
    <div class="empty-state-card">
      <div class="empty-icon">&#x1F3BE;</div>
      <h2>${escapeHtml(title)}</h2>
      <p class="message">${escapeHtml(message)}</p>
      ${suggestionsHtml}
    </div>

    ${searchPanelHtml ? `
      <div class="search-panel-wrapper" style="margin-top: 20px;">
        <p style="text-align: center; color: #64748b; margin-bottom: 12px; font-size: 14px;">
          Modify your search below:
        </p>
        ${searchPanelHtml}
      </div>
    ` : ''}

    <style>
      .empty-state-card {
        background: #ffffff;
        border: 1px solid #e1e4e8;
        border-radius: 16px;
        padding: 32px 24px;
        text-align: center;
        max-width: 400px;
        margin: 16px auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }

      .empty-state-card h2 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a2e;
      }

      .empty-state-card .message {
        color: #64748b;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .suggestions {
        background: #f8fafc;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 20px;
        text-align: left;
      }

      .suggestions-title {
        font-weight: 600;
        color: #374151;
        margin: 0 0 8px 0;
        font-size: 13px;
      }

      .suggestions ul {
        margin: 0;
        padding-left: 20px;
        color: #4a5568;
      }

      .suggestions li {
        margin: 6px 0;
        font-size: 14px;
      }

      .quick-actions {
        border-top: 1px solid #e1e4e8;
        padding-top: 20px;
        margin-top: 20px;
      }

      .actions-title {
        font-weight: 600;
        color: #374151;
        margin: 0 0 12px 0;
        font-size: 13px;
      }

      .action-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .action-buttons .btn {
        flex: 1;
        min-width: 120px;
        max-width: 160px;
      }

      .search-panel-wrapper {
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }
    </style>
  `;

  return wrapWithStyles(content);
}
