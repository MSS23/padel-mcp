/**
 * Checkout Wizard Widget
 *
 * Multi-step booking wizard with fake payment simulation.
 * Steps: Review → Details → Payment → Confirmation
 */

import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { useChatGPTTool } from '../common/hooks.js';

export interface CheckoutWizardProps {
  slot: {
    venue_id: string;
    venue_name: string;
    start_time: string;
    duration_minutes: number;
    price: number;
    currency: string;
    court_name?: string;
  };
  mode?: 'demo' | 'real';
  autoFillUser?: boolean;
  widgetSessionId?: string;
}

type CheckoutStep = 'review' | 'details' | 'payment' | 'confirmation';

export function CheckoutWizardWidget(props: CheckoutWizardProps) {
  const { slot, mode = 'demo', autoFillUser = true } = props;
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [bookingRef, setBookingRef] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { callTool } = useChatGPTTool();

  // Generate booking reference
  const generateBookingRef = useCallback(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PF-${date}-${code}`;
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 'review') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('payment');
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 'details') {
      setCurrentStep('review');
    } else if (currentStep === 'payment') {
      setCurrentStep('details');
    }
  }, [currentStep]);

  const handlePayment = useCallback(async () => {
    setIsProcessing(true);
    
    // Simulate payment processing (1.5s delay)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate booking reference
    const ref = generateBookingRef();
    setBookingRef(ref);
    
    // Auto-track booking
    try {
      await callTool('track_booking', {
        venue_id: slot.venue_id,
        venue_name: slot.venue_name,
        court_name: slot.court_name || 'Court 1',
        date: slot.start_time.split('T')[0],
        start_time: slot.start_time.split('T')[1]?.substring(0, 5) || '00:00',
        end_time: new Date(new Date(slot.start_time).getTime() + slot.duration_minutes * 60000)
          .toISOString().split('T')[1]?.substring(0, 5) || '00:00',
        price: slot.price,
        currency: slot.currency,
      });
    } catch (error) {
      console.error('Failed to track booking:', error);
    }
    
    setIsProcessing(false);
    setCurrentStep('confirmation');
    
    // Trigger confetti animation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('booking-confirmed', { detail: { bookingRef: ref } }));
    }
  }, [slot, callTool, generateBookingRef]);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const startTime = formatTime(slot.start_time);
  const endTime = formatTime(new Date(new Date(slot.start_time).getTime() + slot.duration_minutes * 60000).toISOString());
  const dateDisplay = formatDate(slot.start_time);
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {currentStep === 'confirmation' ? 'Booking Complete!' : 'Book Your Court'}
        </h2>
        <StepIndicator currentStep={currentStep} />
      </div>

      <div style={styles.content}>
        {currentStep === 'review' && (
          <ReviewStep slot={slot} dateDisplay={dateDisplay} startTime={startTime} endTime={endTime} priceDisplay={priceDisplay} />
        )}
        {currentStep === 'details' && (
          <DetailsStep autoFillUser={autoFillUser} />
        )}
        {currentStep === 'payment' && (
          <PaymentStep slot={slot} priceDisplay={priceDisplay} isProcessing={isProcessing} onPayment={handlePayment} />
        )}
        {currentStep === 'confirmation' && (
          <ConfirmationStep
            slot={slot}
            bookingRef={bookingRef}
            dateDisplay={dateDisplay}
            startTime={startTime}
            endTime={endTime}
            priceDisplay={priceDisplay}
          />
        )}
      </div>

      <div style={styles.actions}>
        {currentStep !== 'review' && currentStep !== 'confirmation' && (
          <button style={styles.buttonSecondary} onClick={handleBack}>
            Back
          </button>
        )}
        {currentStep === 'review' && (
          <button style={styles.buttonPrimary} onClick={handleNext}>
            Continue
          </button>
        )}
        {currentStep === 'details' && (
          <button style={styles.buttonPrimary} onClick={handleNext}>
            Continue to Payment
          </button>
        )}
        {currentStep === 'payment' && (
          <button
            style={{ ...styles.buttonPrimary, opacity: isProcessing ? 0.6 : 1 }}
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay ${slot.currency}${priceDisplay}`}
          </button>
        )}
        {currentStep === 'confirmation' && (
          <button style={styles.buttonPrimary} onClick={() => window.parent.postMessage({ type: 'checkout-close' }, '*')}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: CheckoutStep }) {
  const steps = [
    { key: 'review', label: 'Review' },
    { key: 'details', label: 'Details' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirmation', label: 'Done' },
  ];
  
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  
  return (
    <div style={styles.steps}>
      {steps.map((step, i) => (
        <div key={step.key} style={styles.stepContainer}>
          <div
            style={{
              ...styles.stepCircle,
              ...(i < currentIndex ? styles.stepCompleted : {}),
              ...(i === currentIndex ? styles.stepActive : {}),
            }}
          >
            {i < currentIndex ? '✓' : i + 1}
          </div>
          <span style={{ ...styles.stepLabel, ...(i === currentIndex ? styles.stepLabelActive : {}) }}>
            {step.label}
          </span>
          {i < steps.length - 1 && <div style={styles.stepLine} />}
        </div>
      ))}
    </div>
  );
}

function ReviewStep({ slot, dateDisplay, startTime, endTime, priceDisplay }: any) {
  return (
    <div>
      <div style={styles.bookingCard}>
        <div style={styles.venueHeader}>
          <span style={styles.venueIcon}>🎾</span>
          <div>
            <h3 style={styles.venueName}>{slot.venue_name}</h3>
            <p style={styles.courtName}>{slot.court_name || 'Court 1'}</p>
          </div>
        </div>
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>📅</span>
            <span style={styles.detailLabel}>Date</span>
            <span style={styles.detailValue}>{dateDisplay}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>⏰</span>
            <span style={styles.detailLabel}>Time</span>
            <span style={styles.detailValue}>{startTime} - {endTime}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>⏱️</span>
            <span style={styles.detailLabel}>Duration</span>
            <span style={styles.detailValue}>{slot.duration_minutes} min</span>
          </div>
        </div>
      </div>
      <div style={styles.priceSummary}>
        <div style={styles.priceRow}>
          <span>Court rental</span>
          <span>{slot.currency}{priceDisplay}</span>
        </div>
        <div style={styles.priceRow}>
          <span>Booking fee</span>
          <span>Free</span>
        </div>
        <div style={{ ...styles.priceRow, ...styles.priceRowTotal }}>
          <span>Total</span>
          <span>{slot.currency}{priceDisplay}</span>
        </div>
      </div>
    </div>
  );
}

function DetailsStep({ autoFillUser }: { autoFillUser: boolean }) {
  // Pre-filled demo user data
  const defaultUser = {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+44 7700 900123',
  };

  return (
    <div>
      <div style={styles.formSection}>
        <h4 style={styles.sectionTitle}>Player Information</h4>
        <div style={styles.formGroup}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            style={styles.input}
            defaultValue={autoFillUser ? defaultUser.name : ''}
            placeholder="John Smith"
          />
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              defaultValue={autoFillUser ? defaultUser.email : ''}
              placeholder="john@example.com"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              style={styles.input}
              defaultValue={autoFillUser ? defaultUser.phone : ''}
              placeholder="+44 7700 900123"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ slot, priceDisplay, isProcessing, onPayment }: any) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div>
      <div style={styles.paymentAmount}>
        <span style={styles.amountLabel}>Amount to pay</span>
        <span style={styles.amountValue}>{slot.currency}{priceDisplay}</span>
      </div>
      <div style={styles.paymentForm}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Card Number</label>
          <input
            type="text"
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            value={cardNumber}
            onChange={(e: any) => setCardNumber(formatCardNumber(e.target.value))}
          />
          <span style={styles.inputHint}>Any 16 digits work for demo</span>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry Date</label>
            <input
              type="text"
              style={styles.input}
              placeholder="MM/YY"
              maxLength={5}
              value={expiry}
              onChange={(e: any) => setExpiry(formatExpiry(e.target.value))}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>CVV</label>
            <input
              type="text"
              style={styles.input}
              placeholder="123"
              maxLength={3}
              value={cvv}
              onChange={(e: any) => setCvv(e.target.value)}
            />
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name on Card</label>
          <input type="text" style={styles.input} defaultValue="DEMO USER" placeholder="JOHN SMITH" />
        </div>
      </div>
      <div style={styles.secureBadge}>
        <span>🔒</span>
        <span>Secure payment (Demo Mode)</span>
      </div>
    </div>
  );
}

function ConfirmationStep({ slot, bookingRef, dateDisplay, startTime, endTime, priceDisplay }: any) {
  const addToCalendar = () => {
    const date = slot.start_time.split('T')[0].replace(/-/g, '');
    const start = slot.start_time.split('T')[1]?.replace(/:/g, '').substring(0, 4) || '0000';
    const endTime = new Date(new Date(slot.start_time).getTime() + slot.duration_minutes * 60000)
      .toISOString().split('T')[1]?.replace(/:/g, '').substring(0, 4) || '0000';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent('Padel - ' + slot.venue_name)}` +
      `&dates=${date}T${start}00/${date}T${endTime}00` +
      `&details=${encodeURIComponent('Court: ' + (slot.court_name || 'Court 1') + '\\nRef: ' + bookingRef)}`;
    window.open(url, '_blank');
  };

  const shareBooking = () => {
    const text = `Padel booked! ${slot.venue_name} on ${dateDisplay} at ${startTime}. Ref: ${bookingRef}`;
    if (navigator.share) {
      navigator.share({ title: 'Padel Booking', text });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div style={styles.confirmationContent}>
      <div style={styles.successAnimation}>
        <div style={styles.successCircle}>
          <svg style={styles.checkmark} viewBox="0 0 52 52">
            <circle style={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
            <path style={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>
      <h2 style={styles.confirmationTitle}>Booking Confirmed!</h2>
      <p style={styles.bookingRef}>Reference: <strong>{bookingRef}</strong></p>
      <div style={styles.confirmationCard}>
        <div style={styles.confirmationVenue}>
          <span style={styles.venueEmoji}>🎾</span>
          <div>
            <h4 style={styles.confirmationVenueName}>{slot.venue_name}</h4>
            <p style={styles.confirmationCourtName}>{slot.court_name || 'Court 1'}</p>
          </div>
        </div>
        <div style={styles.confirmationDetails}>
          <div style={styles.confDetail}>
            <span style={styles.confIcon}>📅</span>
            <span>{dateDisplay}</span>
          </div>
          <div style={styles.confDetail}>
            <span style={styles.confIcon}>⏰</span>
            <span>{startTime} - {endTime}</span>
          </div>
          <div style={styles.confDetail}>
            <span style={styles.confIcon}>💰</span>
            <span>{slot.currency}{priceDisplay} paid</span>
          </div>
        </div>
      </div>
      <div style={styles.confirmationActions}>
        <button style={styles.buttonSecondary} onClick={addToCalendar}>
          📅 Add to Calendar
        </button>
        <button style={styles.buttonSecondary} onClick={shareBooking}>
          🔗 Share
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '480px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    position: 'relative' as const,
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f0f0f0',
    border: '2px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#999',
  },
  stepActive: {
    background: '#2c5aa0',
    borderColor: '#2c5aa0',
    color: '#fff',
  },
  stepCompleted: {
    background: '#22c55e',
    borderColor: '#22c55e',
    color: '#fff',
  },
  stepLabel: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px',
  },
  stepLabelActive: {
    color: '#2c5aa0',
    fontWeight: 'bold',
  },
  stepLine: {
    width: '40px',
    height: '2px',
    background: '#ddd',
    margin: '0 4px 20px 4px',
  },
  content: {
    marginBottom: '24px',
  },
  bookingCard: {
    background: '#f9f9f9',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  venueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e0e0e0',
  },
  venueIcon: {
    fontSize: '32px',
  },
  venueName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  courtName: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  detailItem: {
    textAlign: 'center' as const,
    padding: '12px 8px',
    background: '#fff',
    borderRadius: '10px',
  },
  detailIcon: {
    display: 'block',
    fontSize: '20px',
    marginBottom: '4px',
  },
  detailLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  detailValue: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  priceSummary: {
    background: '#f9f9f9',
    borderRadius: '12px',
    padding: '16px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    color: '#666',
  },
  priceRowTotal: {
    borderTop: '2px solid #e0e0e0',
    borderBottom: 'none',
    marginTop: '8px',
    paddingTop: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  formSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  inputHint: {
    display: 'block',
    fontSize: '11px',
    color: '#999',
    marginTop: '4px',
  },
  paymentAmount: {
    textAlign: 'center' as const,
    padding: '20px',
    background: 'linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%)',
    borderRadius: '16px',
    marginBottom: '20px',
    color: '#fff',
  },
  amountLabel: {
    display: 'block',
    fontSize: '13px',
    opacity: 0.9,
    marginBottom: '4px',
  },
  amountValue: {
    fontSize: '36px',
    fontWeight: 'bold',
  },
  paymentForm: {
    marginBottom: '20px',
  },
  secureBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#22c55e',
  },
  confirmationContent: {
    textAlign: 'center' as const,
  },
  successAnimation: {
    marginBottom: '24px',
  },
  successCircle: {
    width: '80px',
    height: '80px',
    margin: '0 auto',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: '40px',
    height: '40px',
  },
  checkmarkCircle: {
    stroke: '#22c55e',
    strokeWidth: 2,
  },
  checkmarkCheck: {
    stroke: '#fff',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: 50,
    strokeDashoffset: 50,
    animation: 'checkmark 0.4s 0.3s ease-out forwards',
  },
  confirmationTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  bookingRef: {
    color: '#666',
    marginBottom: '24px',
    fontSize: '14px',
  },
  confirmationCard: {
    background: '#f9f9f9',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'left' as const,
  },
  confirmationVenue: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e0e0e0',
  },
  venueEmoji: {
    fontSize: '28px',
  },
  confirmationVenueName: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
  },
  confirmationCourtName: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0 0',
  },
  confirmationDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  confDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  confIcon: {
    fontSize: '16px',
  },
  confirmationActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
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
  },
};
