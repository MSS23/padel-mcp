/**
 * Checkout Wizard Widget
 *
 * 4-step interactive checkout flow for booking a padel court:
 * 1. Review - Slot details and summary
 * 2. Details - User information form
 * 3. Payment - Payment method selection (demo mode)
 * 4. Confirm - Final confirmation and booking
 */

import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { useChatGPTTool } from '../common/hooks.js';
import { injectAnimationStyles } from '../common/animations.js';
import { BookingConfirmationWidget } from '../BookingConfirmation/index.js';
import '../global.d.js';

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
  mode?: 'demo' | 'live';
  autoFillUser?: boolean;
  widgetSessionId?: string;
}

type Step = 1 | 2 | 3 | 4;

export function CheckoutWizardWidget(props: CheckoutWizardProps) {
  const { slot, mode = 'demo', autoFillUser = false } = props;
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { callTool } = useChatGPTTool();

  // User details form state
  const [userDetails, setUserDetails] = useState({
    name: autoFillUser ? 'Demo User' : '',
    email: autoFillUser ? 'demo@example.com' : '',
    phone: autoFillUser ? '+44 20 1234 5678' : '',
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  // Inject animation styles
  if (typeof document !== 'undefined') {
    injectAnimationStyles();
  }

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }, [currentStep]);

  const [bookingResult, setBookingResult] = useState<{
    id: string;
    venue_name: string;
    court_name: string;
    date: string;
    start_time: string;
    end_time: string;
    price: number;
    currency: string;
  } | null>(null);

  const handleCompleteBooking = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Calculate end time
      const startDate = new Date(slot.start_time);
      const endDate = new Date(startDate.getTime() + slot.duration_minutes * 60 * 1000);
      const dateStr = startDate.toISOString().split('T')[0];
      const startTimeStr = startDate.toTimeString().substring(0, 5);
      const endTimeStr = endDate.toTimeString().substring(0, 5);

      // In demo mode, simulate booking success
      if (mode === 'demo') {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create booking via track_booking tool
        try {
          const booking = await callTool('track_booking', {
            venue_id: slot.venue_id,
            venue_name: slot.venue_name,
            court_name: slot.court_name || 'Court 1',
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            price: slot.price,
            currency: slot.currency,
            players: [userDetails.name],
            notes: `Booked via Padel Finder demo. Contact: ${userDetails.email}, ${userDetails.phone}`,
          });

          // Extract booking ID from result (it might be in different formats)
          let bookingId = 'demo-' + Date.now();
          if (booking && typeof booking === 'object') {
            bookingId = (booking as any).id || bookingId;
          } else if (typeof booking === 'string') {
            // Try to extract ID from JSON string
            try {
              const parsed = JSON.parse(booking);
              bookingId = parsed.id || bookingId;
            } catch {
              // Use default
            }
          }

          // Store booking result for confirmation display
          setBookingResult({
            id: bookingId,
            venue_name: slot.venue_name,
            court_name: slot.court_name || 'Court 1',
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            price: slot.price,
            currency: slot.currency,
          });

          // Move to step 4 (confirmation)
          setCurrentStep(4);
        } catch (toolError) {
          console.error('Tool call error:', toolError);
          // Even if tool fails, show demo confirmation
          setBookingResult({
            id: 'demo-' + Date.now(),
            venue_name: slot.venue_name,
            court_name: slot.court_name || 'Court 1',
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            price: slot.price,
            currency: slot.currency,
          });
          setCurrentStep(4);
        }
      } else {
        // Live mode - would call actual booking API
        throw new Error('Live booking not implemented in demo');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [slot, mode, userDetails, callTool]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Complete Your Booking</h2>
        <div style={styles.progressBar}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div
                key={step}
                style={{
                  ...styles.progressStep,
                  ...(isActive ? styles.progressStepActive : {}),
                  ...(isCompleted ? styles.progressStepCompleted : {}),
                }}
              >
                <div
                  style={{
                    ...styles.progressStepNumber,
                    ...(isActive
                      ? { backgroundColor: '#2c5aa0', color: '#fff' }
                      : isCompleted
                      ? { backgroundColor: '#4caf50', color: '#fff' }
                      : {}),
                  }}
                >
                  {isCompleted ? '✓' : step}
                </div>
                <div
                  style={{
                    ...styles.progressStepLabel,
                    ...(isActive ? { color: '#2c5aa0', fontWeight: 'bold' } : {}),
                  }}
                >
                  {step === 1 && 'Review'}
                  {step === 2 && 'Details'}
                  {step === 3 && 'Payment'}
                  {step === 4 && 'Confirm'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.content}>
        {currentStep === 1 && (
          <ReviewStep slot={slot} formatDate={formatDate} formatTime={formatTime} onNext={handleNext} />
        )}

        {currentStep === 2 && (
          <DetailsStep
            userDetails={userDetails}
            setUserDetails={setUserDetails}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <PaymentStep
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cardDetails={cardDetails}
            setCardDetails={setCardDetails}
            slot={slot}
            onNext={handleNext}
            onBack={handleBack}
            mode={mode}
          />
        )}

        {currentStep === 4 && bookingResult ? (
          <BookingConfirmationWidget
            booking_id={bookingResult.id}
            venue_name={bookingResult.venue_name}
            court_name={bookingResult.court_name}
            date={bookingResult.date}
            start_time={bookingResult.start_time}
            end_time={bookingResult.end_time}
            price={bookingResult.price}
            currency={bookingResult.currency}
            widgetSessionId={props.widgetSessionId}
          />
        ) : currentStep === 4 ? (
          <ConfirmStep
            slot={slot}
            userDetails={userDetails}
            formatDate={formatDate}
            formatTime={formatTime}
            isProcessing={isProcessing}
            onComplete={handleCompleteBooking}
            mode={mode}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReviewStep({
  slot,
  formatDate,
  formatTime,
  onNext,
}: {
  slot: CheckoutWizardProps['slot'];
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onNext: () => void;
}) {
  const startDate = new Date(slot.start_time);
  const endDate = new Date(startDate.getTime() + slot.duration_minutes * 60 * 1000);

  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>Review Your Booking</h3>
      <div style={styles.reviewCard}>
        <div style={styles.reviewRow}>
          <span style={styles.reviewLabel}>Venue:</span>
          <span style={styles.reviewValue}>{slot.venue_name}</span>
        </div>
        <div style={styles.reviewRow}>
          <span style={styles.reviewLabel}>Court:</span>
          <span style={styles.reviewValue}>{slot.court_name || 'Court 1'}</span>
        </div>
        <div style={styles.reviewRow}>
          <span style={styles.reviewLabel}>Date:</span>
          <span style={styles.reviewValue}>{formatDate(slot.start_time)}</span>
        </div>
        <div style={styles.reviewRow}>
          <span style={styles.reviewLabel}>Time:</span>
          <span style={styles.reviewValue}>
            {formatTime(slot.start_time)} - {formatTime(endDate.toISOString())}
          </span>
        </div>
        <div style={styles.reviewRow}>
          <span style={styles.reviewLabel}>Duration:</span>
          <span style={styles.reviewValue}>{slot.duration_minutes} minutes</span>
        </div>
        <div style={{ ...styles.reviewRow, ...styles.reviewTotal }}>
          <span style={styles.reviewLabel}>Total:</span>
          <span style={styles.reviewPrice}>
            {slot.currency} {slot.price.toFixed(2)}
          </span>
        </div>
      </div>
      <button style={styles.primaryButton} onClick={onNext}>
        Continue to Details →
      </button>
    </div>
  );
}

function DetailsStep({
  userDetails,
  setUserDetails,
  onNext,
  onBack,
}: {
  userDetails: { name: string; email: string; phone: string };
  setUserDetails: (details: { name: string; email: string; phone: string }) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = userDetails.name && userDetails.email && userDetails.phone;

  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>Your Details</h3>
      <div style={styles.form}>
        <div style={styles.formField}>
          <label style={styles.label}>Full Name *</label>
          <input
            type="text"
            value={userDetails.name}
            onChange={(e) =>
              setUserDetails({ ...userDetails, name: (e.target as HTMLInputElement).value })
            }
            placeholder="John Doe"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formField}>
          <label style={styles.label}>Email *</label>
          <input
            type="email"
            value={userDetails.email}
            onChange={(e) =>
              setUserDetails({ ...userDetails, email: (e.target as HTMLInputElement).value })
            }
            placeholder="john@example.com"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formField}>
          <label style={styles.label}>Phone *</label>
          <input
            type="tel"
            value={userDetails.phone}
            onChange={(e) =>
              setUserDetails({ ...userDetails, phone: (e.target as HTMLInputElement).value })
            }
            placeholder="+44 20 1234 5678"
            style={styles.input}
            required
          />
        </div>
      </div>
      <div style={styles.buttonRow}>
        <button style={styles.secondaryButton} onClick={onBack}>
          ← Back
        </button>
        <button style={styles.primaryButton} onClick={onNext} disabled={!isValid}>
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}

function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  slot,
  onNext,
  onBack,
  mode,
}: {
  paymentMethod: 'card' | 'paypal' | null;
  setPaymentMethod: (method: 'card' | 'paypal') => void;
  cardDetails: { number: string; expiry: string; cvv: string; name: string };
  setCardDetails: (details: { number: string; expiry: string; cvv: string; name: string }) => void;
  slot: CheckoutWizardProps['slot'];
  onNext: () => void;
  onBack: () => void;
  mode: 'demo' | 'live';
}) {
  const isCardValid =
    paymentMethod === 'card' &&
    cardDetails.number.length >= 13 &&
    cardDetails.expiry.length === 5 &&
    cardDetails.cvv.length >= 3 &&
    cardDetails.name.length > 0;

  const isValid = paymentMethod === 'paypal' || (paymentMethod === 'card' && isCardValid);

  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>Payment Method</h3>
      {mode === 'demo' && (
        <div style={styles.demoBanner}>
          🎭 Demo Mode: Payment will be simulated
        </div>
      )}
      <div style={styles.paymentMethods}>
        <button
          style={{
            ...styles.paymentMethodButton,
            ...(paymentMethod === 'card' ? styles.paymentMethodButtonActive : {}),
          }}
          onClick={() => setPaymentMethod('card')}
        >
          <span style={styles.paymentIcon}>💳</span>
          <span>Credit/Debit Card</span>
        </button>
        <button
          style={{
            ...styles.paymentMethodButton,
            ...(paymentMethod === 'paypal' ? styles.paymentMethodButtonActive : {}),
          }}
          onClick={() => setPaymentMethod('paypal')}
        >
          <span style={styles.paymentIcon}>🅿️</span>
          <span>PayPal</span>
        </button>
      </div>

      {paymentMethod === 'card' && (
        <div style={styles.cardForm}>
          <div style={styles.formField}>
            <label style={styles.label}>Card Number</label>
            <input
              type="text"
              value={cardDetails.number}
              onChange={(e) =>
                setCardDetails({
                  ...cardDetails,
                  number: (e.target as HTMLInputElement).value.replace(/\s/g, ''),
                })
              }
              placeholder="1234 5678 9012 3456"
              maxLength={16}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.label}>Expiry</label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => {
                  let value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                  }
                  setCardDetails({ ...cardDetails, expiry: value });
                }}
                placeholder="MM/YY"
                maxLength={5}
                style={styles.input}
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>CVV</label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    cvv: (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 4),
                  })
                }
                placeholder="123"
                maxLength={4}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formField}>
            <label style={styles.label}>Cardholder Name</label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, name: (e.target as HTMLInputElement).value })
              }
              placeholder="John Doe"
              style={styles.input}
            />
          </div>
        </div>
      )}

      {paymentMethod === 'paypal' && (
        <div style={styles.paypalInfo}>
          <p>You'll be redirected to PayPal to complete payment.</p>
        </div>
      )}

      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}>
          <span>Subtotal:</span>
          <span>{slot.currency} {slot.price.toFixed(2)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span>Booking Fee:</span>
          <span>{slot.currency} 0.00</span>
        </div>
        <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
          <span>Total:</span>
          <span style={styles.totalPrice}>
            {slot.currency} {slot.price.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button style={styles.secondaryButton} onClick={onBack}>
          ← Back
        </button>
        <button style={styles.primaryButton} onClick={onNext} disabled={!isValid}>
          Continue to Confirmation →
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({
  slot,
  userDetails,
  formatDate,
  formatTime,
  isProcessing,
  onComplete,
  mode,
}: {
  slot: CheckoutWizardProps['slot'];
  userDetails: { name: string; email: string; phone: string };
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  isProcessing: boolean;
  onComplete: () => void;
  mode: 'demo' | 'live';
}) {
  const startDate = new Date(slot.start_time);
  const endDate = new Date(startDate.getTime() + slot.duration_minutes * 60 * 1000);

  return (
    <div style={styles.step}>
      <h3 style={styles.stepTitle}>Confirm & Book</h3>
      <div style={styles.confirmCard}>
        <div style={styles.confirmSection}>
          <h4 style={styles.confirmSectionTitle}>Booking Details</h4>
          <div style={styles.confirmRow}>
            <span>{slot.venue_name}</span>
            <span>{slot.court_name || 'Court 1'}</span>
          </div>
          <div style={styles.confirmRow}>
            <span>{formatDate(slot.start_time)}</span>
            <span>
              {formatTime(slot.start_time)} - {formatTime(endDate.toISOString())}
            </span>
          </div>
        </div>

        <div style={styles.confirmSection}>
          <h4 style={styles.confirmSectionTitle}>Contact Information</h4>
          <div style={styles.confirmRow}>
            <span>{userDetails.name}</span>
          </div>
          <div style={styles.confirmRow}>
            <span>{userDetails.email}</span>
          </div>
          <div style={styles.confirmRow}>
            <span>{userDetails.phone}</span>
          </div>
        </div>

        <div style={styles.confirmSection}>
          <h4 style={styles.confirmSectionTitle}>Payment</h4>
          <div style={styles.confirmRow}>
            <span>Total Amount</span>
            <span style={styles.confirmPrice}>
              {slot.currency} {slot.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {mode === 'demo' && (
        <div style={styles.demoBanner}>
          🎭 This is a demo booking. No actual payment will be processed.
        </div>
      )}

      <button
        style={{ ...styles.primaryButton, ...styles.confirmButton }}
        onClick={onComplete}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span style={styles.spinner}>⏳</span> Processing...
          </>
        ) : (
          'Complete Booking ✓'
        )}
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  progressStep: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    position: 'relative' as const,
  },
  progressStepActive: {
    opacity: 1,
  },
  progressStepCompleted: {
    opacity: 0.7,
  },
  progressStepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
  },
  progressStepLabel: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center' as const,
  },
  content: {
    minHeight: '400px',
  },
  step: {
    animation: 'fadeIn 0.3s ease-in',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  reviewTotal: {
    borderBottom: 'none',
    marginTop: '8px',
    paddingTop: '16px',
    borderTop: '2px solid #2c5aa0',
  },
  reviewLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '600',
  },
  reviewPrice: {
    fontSize: '20px',
    color: '#2c5aa0',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '24px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  paymentMethods: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  paymentMethodButton: {
    flex: 1,
    padding: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  paymentMethodButtonActive: {
    borderColor: '#2c5aa0',
    backgroundColor: '#f0f7ff',
  },
  paymentIcon: {
    fontSize: '32px',
  },
  cardForm: {
    marginBottom: '24px',
  },
  paypalInfo: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center' as const,
    color: '#666',
  },
  summaryBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  },
  summaryTotal: {
    borderTop: '2px solid #2c5aa0',
    marginTop: '8px',
    paddingTop: '12px',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: '18px',
    color: '#2c5aa0',
  },
  confirmCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  confirmSection: {
    marginBottom: '20px',
  },
  confirmSectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#666',
  },
  confirmPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  demoBanner: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '24px',
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#856404',
  },
  confirmButton: {
    width: '100%',
    fontSize: '18px',
    padding: '16px',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
};
