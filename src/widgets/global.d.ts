/**
 * Global type declarations for widgets
 */

import type { OpenAIWindow } from './common/types.js';

declare global {
  interface Window {
    openai?: OpenAIWindow;
    __WIDGET_PROPS__?: Record<string, any>;
    __WIDGET_SESSION_ID__?: string;
    notifySize?: () => void;
  }
}

export {};
