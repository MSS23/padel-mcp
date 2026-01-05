/**
 * Skeleton Loading Components
 *
 * Provides skeleton placeholder UI while content is loading.
 * Creates a professional loading experience.
 */

import { wrapWithStyles } from '../styles.js';

/**
 * Generate a single skeleton card HTML
 */
export function generateSkeletonCardHTML(): string {
  return `
    <div class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-header-text">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
        </div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
      <div class="skeleton-footer">
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button small"></div>
      </div>
    </div>
  `;
}

/**
 * Generate multiple skeleton cards for loading state
 */
export function generateSkeletonCardsHTML(count: number = 3): string {
  let cards = '';
  for (let i = 0; i < count; i++) {
    cards += generateSkeletonCardHTML();
  }

  const content = `
    <div class="skeleton-container">
      <div class="skeleton-loading-text">
        <div class="spinner"></div>
        <span>Finding available courts...</span>
      </div>
      <div class="skeleton-cards">
        ${cards}
      </div>
    </div>

    <style>
      .skeleton-container {
        padding: 16px;
      }

      .skeleton-loading-text {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 24px;
        font-size: 15px;
        color: var(--color-text-secondary, #64748b);
      }

      .skeleton-cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .skeleton-card {
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-border, #e1e4e8);
        border-radius: 16px;
        padding: 20px;
        animation: fadeIn 0.3s ease-out;
      }

      .skeleton-card:nth-child(1) { animation-delay: 0ms; }
      .skeleton-card:nth-child(2) { animation-delay: 100ms; }
      .skeleton-card:nth-child(3) { animation-delay: 200ms; }

      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
      }

      .skeleton-header-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-title {
        height: 20px;
        width: 70%;
        border-radius: 4px;
      }

      .skeleton-subtitle {
        height: 14px;
        width: 50%;
        border-radius: 4px;
      }

      .skeleton-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
      }

      .skeleton-line {
        height: 16px;
        width: 100%;
        border-radius: 4px;
      }

      .skeleton-line.short {
        width: 60%;
      }

      .skeleton-footer {
        display: flex;
        gap: 12px;
      }

      .skeleton-button {
        height: 40px;
        width: 120px;
        border-radius: 10px;
      }

      .skeleton-button.small {
        width: 80px;
      }
    </style>
  `;

  return wrapWithStyles(content);
}

/**
 * Generate a skeleton for venue details
 */
export function generateVenueSkeletonHTML(): string {
  const content = `
    <div class="venue-skeleton">
      <div class="skeleton-hero">
        <div class="skeleton skeleton-image"></div>
      </div>
      <div class="skeleton-info">
        <div class="skeleton skeleton-venue-name"></div>
        <div class="skeleton skeleton-venue-address"></div>
        <div class="skeleton-stats">
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
        </div>
      </div>
      <div class="skeleton-slots">
        <div class="skeleton skeleton-section-title"></div>
        <div class="skeleton-slot-grid">
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
          <div class="skeleton skeleton-slot"></div>
        </div>
      </div>
    </div>

    <style>
      .venue-skeleton {
        padding: 16px;
      }

      .skeleton-hero {
        margin-bottom: 20px;
      }

      .skeleton-image {
        width: 100%;
        height: 180px;
        border-radius: 16px;
      }

      .skeleton-info {
        margin-bottom: 24px;
      }

      .skeleton-venue-name {
        height: 28px;
        width: 60%;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .skeleton-venue-address {
        height: 16px;
        width: 80%;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .skeleton-stats {
        display: flex;
        gap: 12px;
      }

      .skeleton-stat {
        height: 60px;
        flex: 1;
        border-radius: 12px;
      }

      .skeleton-slots {
        margin-top: 24px;
      }

      .skeleton-section-title {
        height: 20px;
        width: 150px;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .skeleton-slot-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .skeleton-slot {
        height: 70px;
        border-radius: 12px;
      }

      @media (max-width: 480px) {
        .skeleton-slot-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `;

  return wrapWithStyles(content);
}

/**
 * Generate inline skeleton for text content
 */
export function generateTextSkeletonHTML(lines: number = 3): string {
  let linesHtml = '';
  for (let i = 0; i < lines; i++) {
    const width = i === lines - 1 ? '60%' : '100%';
    linesHtml += `<div class="skeleton skeleton-text-line" style="width: ${width}"></div>`;
  }

  return `
    <div class="text-skeleton">
      ${linesHtml}
    </div>
    <style>
      .text-skeleton {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .skeleton-text-line {
        height: 14px;
        border-radius: 4px;
      }
    </style>
  `;
}

/**
 * Generate a loading overlay for existing content
 */
export function generateLoadingOverlayHTML(message: string = 'Loading...'): string {
  return `
    <div class="loading-overlay">
      <div class="loading-overlay-content">
        <div class="spinner large"></div>
        <span class="loading-overlay-text">${escapeHtml(message)}</span>
      </div>
    </div>
    <style>
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        animation: fadeIn 0.2s ease-out;
      }

      @media (prefers-color-scheme: dark) {
        .loading-overlay {
          background: rgba(15, 23, 42, 0.9);
        }
      }

      .loading-overlay-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .spinner.large {
        width: 40px;
        height: 40px;
        border-width: 4px;
      }

      .loading-overlay-text {
        font-size: 15px;
        color: var(--color-text-secondary, #64748b);
        font-weight: 500;
      }
    </style>
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
