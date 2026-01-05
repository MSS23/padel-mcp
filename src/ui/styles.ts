/**
 * Elite CSS Styles for MCP-UI Components
 *
 * Professional, animated design with dark mode support.
 * Features: CSS variables, animations, loading states, toasts, and more.
 */

export const BASE_STYLES = `
  /* ============================================
     CSS Custom Properties (Design Tokens)
     ============================================ */
  :root {
    /* Primary Colors */
    --color-primary: #0d9488;
    --color-primary-light: #14b8a6;
    --color-primary-dark: #0f766e;
    --color-primary-gradient: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);

    /* Status Colors */
    --color-success: #22c55e;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;

    /* Neutral Colors - Light Mode */
    --color-background: #fafbfc;
    --color-surface: #ffffff;
    --color-text-primary: #1a1a2e;
    --color-text-secondary: #64748b;
    --color-border: #e1e4e8;
    --color-border-light: #f0f0f0;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
    --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
    --shadow-glow: 0 0 20px rgba(13,148,136,0.3);

    /* Animation Timing */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);
    --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Dark Mode - Auto-detect system preference */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-background: #0f172a;
      --color-surface: #1e293b;
      --color-text-primary: #f1f5f9;
      --color-text-secondary: #94a3b8;
      --color-border: #334155;
      --color-border-light: #475569;
    }
  }

  /* ============================================
     Keyframe Animations
     ============================================ */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @keyframes ripple {
    to { transform: scale(4); opacity: 0; }
  }

  @keyframes checkmark {
    0% { stroke-dashoffset: 50; }
    100% { stroke-dashoffset: 0; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(13,148,136,0.3); }
    50% { box-shadow: 0 0 20px rgba(13,148,136,0.6); }
  }

  /* ============================================
     Base Styles
     ============================================ */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary);
    background: var(--color-background);
    padding: 12px;
  }

  /* Focus visible for accessibility */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* ============================================
     Loading States
     ============================================ */
  /* Skeleton Loading */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-border) 25%,
      var(--color-border-light) 50%,
      var(--color-border) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  .skeleton-text {
    height: 14px;
    margin: 8px 0;
    border-radius: 4px;
  }

  .skeleton-title {
    height: 20px;
    width: 60%;
    margin-bottom: 12px;
  }

  .skeleton-price {
    height: 28px;
    width: 80px;
    border-radius: 6px;
  }

  .skeleton-button {
    height: 44px;
    border-radius: 10px;
  }

  .skeleton-card {
    padding: 20px;
    pointer-events: none;
  }

  /* Spinner */
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner-sm {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  .spinner-lg {
    width: 40px;
    height: 40px;
    border-width: 4px;
  }

  /* Loading Overlay */
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--duration-normal), visibility var(--duration-normal);
    backdrop-filter: blur(4px);
    z-index: 10;
    border-radius: inherit;
  }

  @media (prefers-color-scheme: dark) {
    .loading-overlay {
      background: rgba(15,23,42,0.85);
    }
  }

  .loading-overlay.active {
    opacity: 1;
    visibility: visible;
  }

  .loading-text {
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  /* ============================================
     Toast Notifications
     ============================================ */
  .toast-container {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: var(--color-surface);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    animation: slideInRight var(--duration-normal) var(--ease-out-expo);
    pointer-events: auto;
    max-width: 320px;
    border: 1px solid var(--color-border);
  }

  .toast-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .toast-success .toast-icon {
    background: rgba(34,197,94,0.15);
    color: var(--color-success);
  }

  .toast-error .toast-icon {
    background: rgba(239,68,68,0.15);
    color: var(--color-error);
  }

  .toast-info .toast-icon {
    background: rgba(59,130,246,0.15);
    color: var(--color-info);
  }

  .toast-warning .toast-icon {
    background: rgba(245,158,11,0.15);
    color: var(--color-warning);
  }

  .toast-content {
    flex: 1;
  }

  .toast-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .toast-message {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .toast-close {
    padding: 4px;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--duration-fast);
    font-size: 18px;
    line-height: 1;
  }

  .toast-close:hover {
    opacity: 1;
  }

  .toast.hiding {
    animation: fadeOut var(--duration-fast) ease-out forwards;
  }

  @keyframes fadeOut {
    to { opacity: 0; transform: translateX(20px); }
  }

  /* ============================================
     Slot Cards
     ============================================ */
  .slot-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 20px;
    margin: 12px 0;
    box-shadow: var(--shadow-sm);
    transition: all var(--duration-normal) var(--ease-out-expo);
    position: relative;
    overflow: hidden;
    animation: fadeInUp var(--duration-normal) var(--ease-out-expo) backwards;
  }

  /* Staggered entrance animations */
  .venue-group .slot-card:nth-child(1) { animation-delay: 0ms; }
  .venue-group .slot-card:nth-child(2) { animation-delay: 50ms; }
  .venue-group .slot-card:nth-child(3) { animation-delay: 100ms; }
  .venue-group .slot-card:nth-child(4) { animation-delay: 150ms; }
  .venue-group .slot-card:nth-child(5) { animation-delay: 200ms; }

  .slot-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }

  /* Expandable Card */
  .slot-card.expandable {
    cursor: pointer;
  }

  .slot-card-main {
    position: relative;
  }

  .expand-indicator {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    transition: transform var(--duration-normal) var(--ease-out-expo);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .slot-card.expanded .expand-indicator {
    transform: translateY(-50%) rotate(180deg);
  }

  .slot-card-expanded {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--duration-slow) var(--ease-out-expo);
  }

  .slot-card.expanded .slot-card-expanded {
    max-height: 500px;
  }

  .expanded-content {
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    margin-top: 16px;
  }

  .expanded-content h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
  }

  /* Quick Actions Overlay */
  .quick-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transform: translateY(-4px);
    transition: all var(--duration-normal) var(--ease-out-expo);
    z-index: 5;
  }

  .slot-card:hover .quick-actions {
    opacity: 1;
    transform: translateY(0);
  }

  .quick-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);
  }

  .quick-action-btn:hover {
    background: var(--color-primary);
    color: white;
    transform: scale(1.1);
  }

  .quick-action-btn.active {
    background: var(--color-primary);
    color: white;
  }

  .quick-action-btn.favorite.active {
    background: #ef4444;
  }

  /* Slot Header */
  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border-light);
  }

  .slot-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    letter-spacing: -0.3px;
  }

  .price {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.5px;
  }

  /* Slot Details */
  .slot-details {
    margin-bottom: 16px;
  }

  .slot-details p {
    margin: 8px 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slot-details .time {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  /* Availability Badge */
  .availability-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .availability-badge.filling-fast {
    background: rgba(245,158,11,0.15);
    color: #b45309;
    animation: pulse 2s infinite;
  }

  .availability-badge.last-few {
    background: rgba(239,68,68,0.15);
    color: #dc2626;
    animation: pulse 1.5s infinite;
  }

  .availability-badge.just-opened {
    background: rgba(34,197,94,0.15);
    color: #16a34a;
  }

  .availability-badge.popular-time {
    background: rgba(59,130,246,0.15);
    color: #2563eb;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* Weather Info */
  .weather-info {
    background: linear-gradient(135deg, var(--color-background) 0%, var(--color-border-light) 100%);
    padding: 12px 16px;
    border-radius: 10px;
    margin: 16px 0;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .weather-info span {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .weather-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .weather-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--color-background);
    border-radius: 10px;
    text-align: center;
  }

  .weather-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .weather-value {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 14px;
  }

  .weather-label {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .playability {
    margin-left: auto;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
  }

  .playability.good {
    background: rgba(34,197,94,0.15);
    color: #166534;
  }

  .playability.warning {
    background: rgba(245,158,11,0.15);
    color: #92400e;
  }

  /* ============================================
     Buttons
     ============================================ */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--duration-normal) var(--ease-out-expo);
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary {
    background: var(--color-primary-gradient);
    color: white;
    flex: 1;
    padding: 14px 24px;
    font-size: 15px;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    padding: 12px 18px;
  }

  .btn-secondary:hover {
    background: rgba(13,148,136,0.1);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    padding: 8px 12px;
  }

  .btn-ghost:hover {
    background: var(--color-background);
    color: var(--color-text-primary);
  }

  /* Button States */
  .btn.loading {
    color: transparent;
    pointer-events: none;
  }

  .btn.loading::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-secondary.loading::after {
    border-color: rgba(13,148,136,0.3);
    border-top-color: var(--color-primary);
  }

  .btn.success {
    background: var(--color-success) !important;
    border-color: var(--color-success) !important;
    color: white !important;
  }

  .btn.error {
    background: var(--color-error) !important;
    border-color: var(--color-error) !important;
    color: white !important;
    animation: shake 0.3s ease;
  }

  /* Ripple Effect */
  .btn .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }

  .slot-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  /* ============================================
     Filter Chips & Sort
     ============================================ */
  .filter-sort-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .filter-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--duration-fast);
  }

  .filter-chip:hover {
    border-color: var(--color-primary);
    background: rgba(13,148,136,0.05);
  }

  .filter-chip.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .filter-chip.add-filter {
    border-style: dashed;
    color: var(--color-primary);
  }

  .chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    font-size: 12px;
    margin-left: 2px;
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sort-controls label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .sort-select {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    font-size: 13px;
    cursor: pointer;
    min-width: 140px;
    color: var(--color-text-primary);
  }

  .sort-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
  }

  /* ============================================
     Time Picker
     ============================================ */
  .time-picker {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
  }

  .time-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .time-picker-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .time-selected {
    background: var(--color-primary-gradient);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .time-slots-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  .time-slot {
    padding: 10px 8px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-background);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--duration-fast);
    text-align: center;
    color: var(--color-text-primary);
  }

  .time-slot:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: rgba(13,148,136,0.05);
  }

  .time-slot.selected {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .time-slot.unavailable {
    opacity: 0.4;
    cursor: not-allowed;
    text-decoration: line-through;
  }

  /* ============================================
     Modal
     ============================================ */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all var(--duration-normal);
    backdrop-filter: blur(4px);
  }

  .modal-overlay.active {
    opacity: 1;
    visibility: visible;
  }

  .modal {
    background: var(--color-surface);
    border-radius: 20px;
    width: 100%;
    max-width: 440px;
    margin: 16px;
    transform: scale(0.95) translateY(10px);
    transition: transform var(--duration-normal) var(--ease-out-expo);
    box-shadow: var(--shadow-xl);
    position: relative;
  }

  .modal-overlay.active .modal {
    transform: scale(1) translateY(0);
  }

  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border: none;
    background: var(--color-background);
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close:hover {
    background: var(--color-border);
  }

  .modal-header {
    padding: 24px 24px 0;
    text-align: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: 24px;
  }

  .modal-footer {
    padding: 0 24px 24px;
    display: flex;
    gap: 12px;
  }

  .modal-footer .btn {
    flex: 1;
  }

  .booking-summary {
    background: var(--color-background);
    border-radius: 12px;
    padding: 16px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row.total {
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid var(--color-border);
    border-bottom: none;
  }

  .summary-row .label {
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  .summary-row .value {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .summary-row.total .value {
    font-size: 18px;
    color: var(--color-primary);
  }

  /* ============================================
     Compare Bar
     ============================================ */
  .compare-bar {
    position: fixed;
    bottom: -80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-surface);
    padding: 16px 24px;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: bottom var(--duration-normal) var(--ease-out-expo);
    z-index: 100;
    border: 1px solid var(--color-border);
    border-bottom: none;
  }

  .compare-bar.active {
    bottom: 0;
  }

  .compare-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 14px;
  }

  .compare-bar .btn {
    padding: 10px 20px;
  }

  /* Compare mode selection */
  body.compare-mode-active .slot-card {
    cursor: pointer;
  }

  body.compare-mode-active .slot-card::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 12px;
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
    transition: all var(--duration-fast);
    z-index: 1;
  }

  body.compare-mode-active .slot-card.compare-selected::before {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  body.compare-mode-active .slot-card.compare-selected::after {
    content: '✓';
    position: absolute;
    top: 14px;
    left: 18px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    z-index: 2;
  }

  /* ============================================
     Venue Groups
     ============================================ */
  .venue-group {
    margin-bottom: 28px;
    animation: fadeIn var(--duration-normal) ease-out backwards;
  }

  .venue-group:nth-child(1) { animation-delay: 0ms; }
  .venue-group:nth-child(2) { animation-delay: 100ms; }
  .venue-group:nth-child(3) { animation-delay: 200ms; }

  .venue-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--color-border);
  }

  .venue-header h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .venue-header p {
    margin: 2px 0;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  /* ============================================
     Calendar Styles
     ============================================ */
  .weekly-calendar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .weekly-calendar h2 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
  }

  .calendar-day {
    background: var(--color-background);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 14px 10px;
    text-align: center;
    cursor: pointer;
    transition: all var(--duration-normal) var(--ease-out-expo);
  }

  .calendar-day:hover {
    background: var(--color-border-light);
    border-color: var(--color-border);
  }

  .calendar-day.has-slots {
    background: rgba(13,148,136,0.1);
    border-color: var(--color-primary);
  }

  .calendar-day.has-slots:hover {
    background: rgba(13,148,136,0.2);
  }

  .calendar-day.no-slots {
    opacity: 0.5;
    cursor: default;
  }

  .day-name {
    font-weight: 600;
    font-size: 11px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .day-date {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
    display: block;
    margin: 4px 0;
  }

  .day-weather {
    font-size: 13px;
    margin: 6px 0;
  }

  .slot-count {
    display: block;
    font-weight: 600;
    color: var(--color-primary);
    font-size: 12px;
  }

  .price-range {
    display: block;
    color: var(--color-text-secondary);
    font-size: 11px;
  }

  /* ============================================
     Search Form
     ============================================ */
  .search-form {
    background: var(--color-surface);
    padding: 24px;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  .form-group {
    margin-bottom: 20px;
    position: relative;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid var(--color-border);
    border-radius: 10px;
    font-size: 14px;
    transition: all var(--duration-normal);
    background: var(--color-background);
    color: var(--color-text-primary);
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    background: var(--color-surface);
  }

  /* Form Validation States */
  .form-group.valid input {
    border-color: var(--color-success);
  }

  .form-group.valid::after {
    content: '✓';
    position: absolute;
    right: 14px;
    bottom: 14px;
    color: var(--color-success);
    font-size: 16px;
    animation: fadeInScale var(--duration-fast) var(--spring);
  }

  .form-group.invalid input {
    border-color: var(--color-error);
    animation: shake var(--duration-normal) ease;
  }

  .error-message {
    display: block;
    color: var(--color-error);
    font-size: 12px;
    margin-top: 4px;
    animation: fadeIn var(--duration-fast);
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  /* ============================================
     Utility Classes
     ============================================ */
  .text-center { text-align: center; }
  .text-muted { color: var(--color-text-secondary); }
  .text-success { color: var(--color-success); }
  .text-error { color: var(--color-error); }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: var(--color-text-secondary);
  }

  .empty-state p {
    font-size: 16px;
    margin-bottom: 8px;
  }

  /* Results Counter */
  .results-count {
    animation: fadeInScale var(--duration-slow) var(--spring) backwards;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--color-primary-gradient);
    color: white;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 16px;
  }

  /* ============================================
     Mobile Optimizations
     ============================================ */
  @media (pointer: coarse) {
    .btn {
      min-height: 48px;
      padding: 14px 20px;
    }

    .filter-chip {
      min-height: 44px;
      padding: 12px 16px;
    }

    .time-slot {
      min-height: 44px;
      padding: 12px;
    }

    .quick-action-btn {
      width: 44px;
      height: 44px;
    }

    .calendar-day {
      min-height: 70px;
      padding: 16px 8px;
    }
  }

  @media (max-width: 600px) {
    .calendar-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 480px) {
    body {
      padding: 8px;
    }

    .slot-card {
      padding: 16px;
      border-radius: 12px;
    }

    .slot-header {
      flex-direction: column;
      gap: 8px;
    }

    .price {
      font-size: 20px;
    }

    .slot-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .form-row {
      flex-direction: column;
    }

    .filter-sort-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-chips {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 8px;
      -webkit-overflow-scrolling: touch;
    }

    .sort-controls {
      justify-content: space-between;
    }

    .weather-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .quick-actions {
      position: static;
      opacity: 1;
      transform: none;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border);
    }

    .time-slots-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Safe area insets for notched devices */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .compare-bar {
      padding-bottom: calc(16px + env(safe-area-inset-bottom));
    }

    .toast-container {
      top: calc(16px + env(safe-area-inset-top));
    }
  }
`;

/**
 * JavaScript for interactive UI
 * Enhanced with toast notifications, ripple effects, and compare mode
 */
export const UI_SCRIPTS = `
  // ============================================
  // Toast Notification System
  // ============================================
  const ToastSystem = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    },

    show(options) {
      this.init();
      const { type = 'info', title, message, duration = 4000 } = options;

      const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 01.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-9.5a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3A.75.75 0 008 5.5zm0 7a1 1 0 100-2 1 1 0 000 2z"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm.75-9.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 7a1 1 0 100-2 1 1 0 000 2z"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z"/></svg>'
      };

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.innerHTML =
        '<div class="toast-icon">' + icons[type] + '</div>' +
        '<div class="toast-content">' +
          (title ? '<div class="toast-title">' + title + '</div>' : '') +
          (message ? '<div class="toast-message">' + message + '</div>' : '') +
        '</div>' +
        '<button class="toast-close" onclick="this.parentElement.remove()">×</button>';

      this.container.appendChild(toast);

      setTimeout(function() {
        toast.classList.add('hiding');
        setTimeout(function() { toast.remove(); }, 200);
      }, duration);
    },

    success: function(message, title) { this.show({ type: 'success', message: message, title: title }); },
    error: function(message, title) { this.show({ type: 'error', message: message, title: title }); },
    info: function(message, title) { this.show({ type: 'info', message: message, title: title }); },
    warning: function(message, title) { this.show({ type: 'warning', message: message, title: title }); }
  };

  // ============================================
  // Button Loading & Ripple Effects
  // ============================================
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
    } else if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
    }
  }

  function setButtonSuccess(btn) {
    if (!btn) return;
    btn.classList.remove('loading');
    btn.classList.add('success');
    setTimeout(function() {
      btn.classList.remove('success');
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
      }
    }, 2000);
  }

  function setButtonError(btn) {
    if (!btn) return;
    btn.classList.remove('loading');
    btn.classList.add('error');
    setTimeout(function() {
      btn.classList.remove('error');
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
      }
    }, 2000);
  }

  function createRipple(event) {
    var button = event.currentTarget;
    var ripple = document.createElement('span');
    ripple.className = 'ripple';

    var rect = button.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

    button.appendChild(ripple);

    ripple.addEventListener('animationend', function() { ripple.remove(); });
  }

  // Attach ripple to buttons
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.btn');
    if (btn) createRipple(e);
  });

  // ============================================
  // Expandable Cards
  // ============================================
  function toggleSlotExpansion(card) {
    if (!card) return;
    card.classList.toggle('expanded');
    notifySize();
  }

  // ============================================
  // Quick Actions
  // ============================================
  function shareSlot(venueId, startTime) {
    var url = window.location.href + '?venue=' + venueId + '&time=' + startTime;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        ToastSystem.success('Link copied to clipboard!', 'Share');
      });
    }
  }

  function toggleFavorite(venueId, venueName) {
    var btn = event.target.closest('.quick-action-btn');
    if (btn) btn.classList.toggle('active');

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'save_favorite_venue',
        params: { venue_id: venueId, venue_name: venueName }
      }
    }, '*');

    ToastSystem.success('Added to favorites!', venueName);
  }

  // ============================================
  // Compare Mode
  // ============================================
  var CompareMode = {
    active: false,
    selected: new Set(),
    maxSelections: 4,

    toggle: function() {
      this.active = !this.active;
      document.body.classList.toggle('compare-mode-active', this.active);
      if (!this.active) this.clear();
      this.updateUI();
    },

    select: function(slotId) {
      if (this.selected.has(slotId)) {
        this.selected.delete(slotId);
      } else if (this.selected.size < this.maxSelections) {
        this.selected.add(slotId);
      } else {
        ToastSystem.info('Maximum ' + this.maxSelections + ' slots can be compared');
        return;
      }
      this.updateUI();
    },

    clear: function() {
      this.selected.clear();
      this.updateUI();
    },

    compare: function() {
      if (this.selected.size < 2) {
        ToastSystem.info('Select at least 2 slots to compare');
        return;
      }
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'compare_slots',
          params: { slot_ids: Array.from(this.selected) }
        }
      }, '*');
    },

    updateUI: function() {
      var self = this;
      document.querySelectorAll('.slot-card').forEach(function(card) {
        var slotId = card.dataset.slotId;
        card.classList.toggle('compare-selected', self.selected.has(slotId));
      });

      var bar = document.getElementById('compare-bar');
      if (bar) {
        bar.classList.toggle('active', this.selected.size > 0);
        var countEl = bar.querySelector('.compare-count');
        if (countEl) countEl.textContent = this.selected.size;
      }
    }
  };

  function toggleCompare(venueId, startTime) {
    event.stopPropagation();
    var slotId = venueId + '_' + startTime;
    CompareMode.select(slotId);
  }

  // ============================================
  // Modal System
  // ============================================
  function showModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(event) {
    if (event.target.classList.contains('modal-overlay')) {
      event.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function closeBookingModal() {
    var modal = document.getElementById('booking-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function confirmBooking(url) {
    var btn = event.target.closest('.btn');
    setButtonLoading(btn, true);

    setTimeout(function() {
      window.open(url, '_blank');
      setButtonSuccess(btn);
      closeBookingModal();
      ToastSystem.success('Redirecting to booking...', 'Book Now');
    }, 500);
  }

  function showBookingModal(venueId, startTime, bookingUrl) {
    event.stopPropagation();
    // For now, just open the booking URL directly
    window.open(bookingUrl, '_blank');
    ToastSystem.success('Opening booking page...', 'Book Now');
  }

  // ============================================
  // Filter & Sort Handlers
  // ============================================
  function toggleFilter(filterId, value) {
    var chip = event.target.closest('.filter-chip');
    if (chip) {
      chip.classList.toggle('active');
    }

    // Collect all active filters
    var activeFilters = [];
    document.querySelectorAll('.filter-chip.active').forEach(function(c) {
      activeFilters.push(c.dataset.filterId);
    });

    // Trigger search with filters
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'find_available_games',
        params: { filters: activeFilters }
      }
    }, '*');
  }

  function handleSort(sortValue) {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'find_available_games',
        params: { sortBy: sortValue }
      }
    }, '*');
  }

  // ============================================
  // Form Validation
  // ============================================
  var FormValidator = {
    rules: {
      location: { required: true, minLength: 2 },
      date: { required: true }
    },

    validate: function(field, value) {
      var rule = this.rules[field];
      if (!rule) return { valid: true };

      if (rule.required && (!value || !value.trim())) {
        return { valid: false, message: 'This field is required' };
      }

      if (rule.minLength && value.length < rule.minLength) {
        return { valid: false, message: 'Please enter at least ' + rule.minLength + ' characters' };
      }

      return { valid: true };
    },

    showFeedback: function(input, result) {
      var wrapper = input.closest('.form-group');
      if (!wrapper) return;

      wrapper.classList.remove('valid', 'invalid');

      var existingError = wrapper.querySelector('.error-message');
      if (existingError) existingError.remove();

      if (result.valid) {
        wrapper.classList.add('valid');
      } else {
        wrapper.classList.add('invalid');
        var errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = result.message;
        wrapper.appendChild(errorEl);
      }
    }
  };

  // ============================================
  // Core Functions
  // ============================================
  function bookSlot(url) {
    if (!url) return;
    try {
      var btn = event?.target?.closest('.btn');
      setButtonLoading(btn, true);
      window.open(url, '_blank');
      window.parent.postMessage({
        type: 'intent',
        payload: { action: 'book_slot', bookingUrl: url }
      }, '*');
      setTimeout(function() { setButtonSuccess(btn); }, 500);
      ToastSystem.success('Opening booking page...', 'Book Now');
    } catch (err) {
      console.error('Book slot error:', err);
      ToastSystem.error('Failed to open booking page');
    }
  }

  function addToCalendar(url) {
    if (!url) return;
    try {
      var btn = event?.target?.closest('.btn');
      setButtonLoading(btn, true);
      window.open(url, '_blank');
      window.parent.postMessage({
        type: 'intent',
        payload: { action: 'add_calendar', calendarUrl: url }
      }, '*');
      setTimeout(function() { setButtonSuccess(btn); }, 500);
      ToastSystem.success('Added to calendar!', 'Calendar');
    } catch (err) {
      console.error('Add to calendar error:', err);
      ToastSystem.error('Failed to add to calendar');
    }
  }

  function saveVenue(id, name) {
    if (!id) return;
    try {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'save_favorite_venue',
          params: { venue_id: id, venue_name: name }
        }
      }, '*');
      ToastSystem.success('Added to favorites!', name);
    } catch (err) {
      console.error('Save venue error:', err);
    }
  }

  function showDaySlots(date) {
    if (!date) return;
    try {
      var el = event?.target?.closest('.calendar-day');
      if (el) {
        el.style.opacity = '0.6';
        el.style.transform = 'scale(0.98)';
      }
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'check_availability',
          params: { date: date }
        }
      }, '*');
    } catch (err) {
      console.error('Show day slots error:', err);
    }
  }

  function submitSearch(e) {
    e.preventDefault();
    var form = e.target;
    var fd = new FormData(form);

    var location = fd.get('location')?.toString().trim();
    var locationResult = FormValidator.validate('location', location);
    var locationInput = form.querySelector('[name="location"]');
    FormValidator.showFeedback(locationInput, locationResult);

    if (!locationResult.valid) {
      locationInput.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'find_available_games',
          params: {
            location: location,
            date: fd.get('date'),
            preferred_time_start: fd.get('time_start') || undefined,
            preferred_time_end: fd.get('time_end') || undefined,
            max_distance_km: parseInt(fd.get('max_distance')) || 10
          }
        }
      }, '*');
    } catch (err) {
      console.error('Submit search error:', err);
      setButtonError(btn);
      ToastSystem.error('Failed to search. Please try again.');
    }
  }

  // Notify parent of size changes
  function notifySize() {
    window.parent.postMessage({
      type: 'ui-size-change',
      payload: { height: document.body.scrollHeight }
    }, '*');
  }

  // Use ResizeObserver for dynamic content changes
  window.addEventListener('load', function() {
    notifySize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(notifySize).observe(document.body);
    }

    // Add validation listeners to form inputs
    document.querySelectorAll('.form-group input, .form-group select').forEach(function(input) {
      input.addEventListener('blur', function() {
        var result = FormValidator.validate(input.name, input.value);
        FormValidator.showFeedback(input, result);
      });

      input.addEventListener('input', function() {
        var wrapper = input.closest('.form-group');
        if (wrapper && wrapper.classList.contains('invalid')) {
          var result = FormValidator.validate(input.name, input.value);
          if (result.valid) {
            FormValidator.showFeedback(input, result);
          }
        }
      });
    });
  });
`;

/**
 * Wrap content with styles
 */
export function wrapWithStyles(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${content}
  <script>${UI_SCRIPTS}</script>
</body>
</html>`;
}
