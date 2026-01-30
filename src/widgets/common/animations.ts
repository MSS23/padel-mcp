/**
 * Shared Animation Styles
 *
 * CSS keyframe animations for widgets (checkmark, confetti, star sparkle, etc.)
 * All animations respect prefers-reduced-motion
 */

export const animationStyles = `
  /* Checkmark Animation */
  @keyframes checkmarkDraw {
    0% {
      stroke-dashoffset: 50;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes checkmarkCircleFill {
    0% {
      stroke-dashoffset: 157;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes scaleIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Confetti Animation */
  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  @keyframes confettiBurst {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 1;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(360deg);
      opacity: 0;
    }
  }

  /* Star Sparkle Animation */
  @keyframes starScale {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes starGlow {
    0%, 100% {
      filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));
    }
    50% {
      filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.9));
    }
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

  /* Slide In Animation */
  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Pulse Animation */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  @keyframes pulseButton {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(44, 90, 160, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(44, 90, 160, 0);
    }
  }

  /* Shimmer Loading */
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes shimmerLoading {
    0% {
      background: linear-gradient(
        90deg,
        #f0f0f0 0%,
        #e0e0e0 50%,
        #f0f0f0 100%
      );
      background-size: 200% 100%;
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Fade In */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Spin */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

/**
 * Inject animation styles into document head
 */
export function injectAnimationStyles(): void {
  if (typeof document === 'undefined') return;

  // Check if styles already injected
  if (document.getElementById('padel-animations')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'padel-animations';
  styleEl.textContent = animationStyles;
  document.head.appendChild(styleEl);
}

/**
 * CSS class names for common animations
 */
export const animationClasses = {
  checkmarkDraw: 'checkmark-draw',
  checkmarkCircleFill: 'checkmark-circle-fill',
  scaleIn: 'scale-in',
  confettiFall: 'confetti-fall',
  confettiBurst: 'confetti-burst',
  starScale: 'star-scale',
  starGlow: 'star-glow',
  sparkleFade: 'sparkle-fade',
  slideInUp: 'slide-in-up',
  slideInDown: 'slide-in-down',
  slideInLeft: 'slide-in-left',
  slideInRight: 'slide-in-right',
  pulse: 'pulse',
  pulseButton: 'pulse-button',
  shimmer: 'shimmer',
  shimmerLoading: 'shimmer-loading',
  fadeIn: 'fade-in',
  fadeInScale: 'fade-in-scale',
  spin: 'spin',
};
