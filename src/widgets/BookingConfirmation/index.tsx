/**
 * Booking Confirmation Widget
 *
 * Success screen shown after completing a booking with booking details,
 * calendar link, and next actions.
 */

import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useChatGPTTool } from '../common/hooks.js';
import { injectAnimationStyles } from '../common/animations.js';
import '../global.d.js';

export interface BookingConfirmationProps {
  booking_id: string;
  venue_name: string;
  court_name: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  currency: string;
  widgetSessionId?: string;
}

export function BookingConfirmationWidget(props: BookingConfirmationProps) {
  const {
    booking_id,
    venue_name,
    court_name,
    date,
    start_time,
    end_time,
    price,
    currency,
  } = props;

  const [showConfetti, setShowConfetti] = useState(true);
  const [showCheckmark, setShowCheckmark] = useState(true);
  const { callTool } = useChatGPTTool();

  // Inject animation styles
  if (typeof document !== 'undefined') {
    injectAnimationStyles();
  }

  useEffect(() => {
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
    // Keep checkmark visible
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    // Handle both "HH:mm" and full datetime formats
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return timeStr;
  };

  const handleAddToCalendar = async () => {
    try {
      // Generate calendar link
      const startDateTime = new Date(`${date}T${start_time}`);
      const endDateTime = new Date(`${date}T${end_time}`);
      
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Padel at ${encodeURIComponent(venue_name)}&dates=${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(venue_name)}`;
      
      window.open(calendarLink, '_blank');
    } catch (error) {
      console.error('Calendar error:', error);
    }
  };

  const handleViewBookings = async () => {
    try {
      await callTool('get_booking_history', {
        filter: 'upcoming',
        limit: 10,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  return (
    <div style={styles.container}>
      {showConfetti && <ConfettiEffect />}
      
      <div style={styles.animationContainer}>
        {showCheckmark && (
          <div style={styles.checkmarkContainer}>
            <svg
              style={styles.checkmarkSvg}
              viewBox="0 0 52 52"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                style={styles.checkmarkCircle}
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="#4caf50"
                strokeWidth="2"
              />
              <path
                style={styles.checkmarkCheck}
                fill="none"
                stroke="#4caf50"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>
        )}
      </div>

      <h2 style={styles.title}>Booking Confirmed! 🎾</h2>
      <p style={styles.subtitle}>Your court is reserved</p>

      <div style={styles.bookingCard}>
        <div style={styles.bookingHeader}>
          <div style={styles.bookingIcon}>🎾</div>
          <div>
            <h3 style={styles.venueName}>{venue_name}</h3>
            <p style={styles.courtName}>{court_name}</p>
          </div>
        </div>

        <div style={styles.bookingDetails}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📅 Date:</span>
            <span style={styles.detailValue}>{formatDate(date)}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>🕐 Time:</span>
            <span style={styles.detailValue}>
              {formatTime(start_time)} - {formatTime(end_time)}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>💰 Price:</span>
            <span style={styles.detailValue}>
              {currency} {price.toFixed(2)}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>🆔 Booking ID:</span>
            <span style={styles.detailValue}>{booking_id}</span>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.primaryButton} onClick={handleAddToCalendar}>
          📅 Add to Calendar
        </button>
        <button style={styles.secondaryButton} onClick={handleViewBookings}>
          View My Bookings
        </button>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          A confirmation email has been sent. See you on the court! 🎾
        </p>
      </div>
    </div>
  );
}

function ConfettiEffect() {
  return (
    <div style={styles.confettiContainer}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.confetti,
            left: `${(i * 5)}%`,
            animationDelay: `${i * 0.1}s`,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][i % 5],
          }}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: '500px',
    margin: '0 auto',
    textAlign: 'center' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  confettiContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute' as const,
    width: '10px',
    height: '10px',
    animation: 'confettiFall 3s ease-out forwards',
  },
  animationContainer: {
    position: 'relative' as const,
    marginBottom: '24px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkmarkContainer: {
    animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  checkmarkSvg: {
    width: '80px',
    height: '80px',
  },
  checkmarkCircle: {
    strokeDasharray: 157,
    strokeDashoffset: 157,
    animation: 'checkmarkCircleFill 0.6s ease-out 0.3s forwards',
  },
  checkmarkCheck: {
    strokeDasharray: 22,
    strokeDashoffset: 22,
    animation: 'checkmarkDraw 0.5s ease-out 0.8s forwards',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1a1a1a',
    zIndex: 2,
    position: 'relative' as const,
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px',
    zIndex: 2,
    position: 'relative' as const,
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'left' as const,
    zIndex: 2,
    position: 'relative' as const,
  },
  bookingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
  },
  bookingIcon: {
    fontSize: '48px',
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
    margin: '4px 0 0 0',
  },
  bookingDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
    zIndex: 2,
    position: 'relative' as const,
  },
  primaryButton: {
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#2c5aa0',
    border: '2px solid #2c5aa0',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  footer: {
    zIndex: 2,
    position: 'relative' as const,
  },
  footerText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
};

// Add CSS animations
const animationStyles = `
  @keyframes checkmarkDraw {
    0% {
      stroke-dashoffset: 22;
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
  
  @keyframes confettiFall {
    0% {
      transform: translateY(-100px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(600px) rotate(720deg);
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
