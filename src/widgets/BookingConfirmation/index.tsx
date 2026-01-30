/**
 * Booking Confirmation Widget
 *
 * Success screen shown after booking completion with confetti animation,
 * booking reference, and action buttons.
 */

import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export interface BookingConfirmationProps {
  bookingRef: string;
  venue: {
    name: string;
    court_name?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  widgetSessionId?: string;
}

export function BookingConfirmationWidget(props: BookingConfirmationProps) {
  const { bookingRef, venue, date, startTime, endTime, price, currency } = props;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Confetti is handled by ConfettiAnimation component
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const addToCalendar = () => {
    const dateStr = date.replace(/-/g, '');
    const start = startTime.replace(/:/g, '').substring(0, 4);
    const end = endTime.replace(/:/g, '').substring(0, 4);
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent('Padel - ' + venue.name)}` +
      `&dates=${dateStr}T${start}00/${dateStr}T${end}00` +
      `&details=${encodeURIComponent('Court: ' + (venue.court_name || 'Court 1') + '\\nRef: ' + bookingRef)}`;
    window.open(url, '_blank');
  };

  const shareBooking = () => {
    const text = `Padel booked! ${venue.name} on ${date} at ${startTime}. Ref: ${bookingRef}`;
    if (navigator.share) {
      navigator.share({ title: 'Padel Booking', text });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const priceDisplay = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);

  return (
    <div style={styles.container}>
      {showConfetti && <ConfettiAnimation />}
      
      <div style={styles.successAnimation}>
        <div style={styles.successCircle}>
          <svg style={styles.checkmark} viewBox="0 0 52 52">
            <circle style={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
            <path style={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>

      <h2 style={styles.title}>Booking Confirmed!</h2>
      <p style={styles.bookingRef}>
        Reference: <strong style={styles.refStrong}>{bookingRef}</strong>
      </p>

      <div style={styles.bookingCard}>
        <div style={styles.venueHeader}>
          <span style={styles.venueIcon}>🎾</span>
          <div>
            <h3 style={styles.venueName}>{venue.name}</h3>
            <p style={styles.courtName}>{venue.court_name || 'Court 1'}</p>
          </div>
        </div>

        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailIcon}>📅</span>
            <span>{date}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailIcon}>⏰</span>
            <span>{startTime} - {endTime}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailIcon}>💰</span>
            <span>{currency}{priceDisplay} paid</span>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.buttonSecondary} onClick={addToCalendar}>
          📅 Add to Calendar
        </button>
        <button style={styles.buttonSecondary} onClick={shareBooking}>
          🔗 Share Booking
        </button>
      </div>
    </div>
  );
}

function ConfettiAnimation() {
  useEffect(() => {
    // Create confetti particles
    const colors = ['#2c5aa0', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
    const container = document.getElementById('confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = '-10px';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      
      const angle = Math.random() * 360;
      const velocity = 50 + Math.random() * 50;
      const rotation = Math.random() * 720 - 360;
      
      particle.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
      particle.style.setProperty('--angle', `${angle}deg`);
      particle.style.setProperty('--velocity', `${velocity}px`);
      particle.style.setProperty('--rotation', `${rotation}deg`);
      
      container.appendChild(particle);
      
      setTimeout(() => particle.remove(), 4000);
    }
  }, []);

  return <div id="confetti-container" style={styles.confettiContainer} />;
}

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: '480px',
    margin: '0 auto',
    textAlign: 'center' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative' as const,
  },
  confettiContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 9999,
  },
  successAnimation: {
    marginBottom: '24px',
  },
  successCircle: {
    width: '100px',
    height: '100px',
    margin: '0 auto',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  checkmark: {
    width: '50px',
    height: '50px',
  },
  checkmarkCircle: {
    stroke: '#22c55e',
    strokeWidth: 2,
  },
  checkmarkCheck: {
    stroke: '#fff',
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: 50,
    strokeDashoffset: 50,
    animation: 'checkmarkDraw 0.5s 0.3s ease-out forwards',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#1a1a1a',
  },
  bookingRef: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px',
  },
  refStrong: {
    color: '#2c5aa0',
    fontSize: '18px',
  },
  bookingCard: {
    background: '#f9f9f9',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'left' as const,
  },
  venueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0',
  },
  venueIcon: {
    fontSize: '40px',
  },
  venueName: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1a1a1a',
  },
  courtName: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0',
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    color: '#333',
  },
  detailIcon: {
    fontSize: '20px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add CSS animations
const animationStyles = `
  @keyframes scaleIn {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes checkmarkDraw {
    0% { stroke-dashoffset: 50; }
    100% { stroke-dashoffset: 0; }
  }
  
  @keyframes confetti-fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(calc(100vh + 100px)) rotate(var(--rotation));
      opacity: 0;
    }
  }
`;

// Inject styles into document if in browser
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = animationStyles;
  document.head.appendChild(styleEl);
}
