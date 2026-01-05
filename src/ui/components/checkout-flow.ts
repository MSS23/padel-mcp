/**
 * Checkout Flow Component
 *
 * Multi-step booking wizard with fake payment simulation.
 * Steps: Review → Details → Payment → Confirmation
 */

export interface BookingSlot {
  venueId: string;
  venueName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  currency: string;
  bookingUrl?: string;
}

export interface CheckoutConfig {
  slot: BookingSlot;
  step?: 'review' | 'details' | 'payment' | 'confirmation';
  bookingRef?: string;
}

/**
 * Generate booking reference: PF-YYYYMMDD-XXXX
 */
function generateBookingRef(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PF-${date}-${code}`;
}

/**
 * Format time for display (9:00 AM style)
 */
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format date for display
 */
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate step indicator
 */
function generateStepIndicator(currentStep: number): string {
  const steps = ['Review', 'Details', 'Payment', 'Done'];
  return `
    <div class="checkout-steps">
      ${steps.map((label, i) => `
        <div class="checkout-step ${i < currentStep ? 'completed' : ''} ${i === currentStep ? 'active' : ''}">
          <div class="step-circle">${i < currentStep ? '✓' : i + 1}</div>
          <span class="step-label">${label}</span>
        </div>
        ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
      `).join('')}
    </div>
  `;
}

/**
 * Generate Review Step
 */
function generateReviewStep(slot: BookingSlot): string {
  const startDisplay = formatTimeDisplay(slot.startTime);
  const endDisplay = formatTimeDisplay(slot.endTime);
  const dateDisplay = formatDateDisplay(slot.date);
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  return `
    <div class="checkout-content">
      <div class="booking-card">
        <div class="booking-venue">
          <div class="venue-icon">🎾</div>
          <div class="venue-info">
            <h3>${escapeHtml(slot.venueName)}</h3>
            <p>${escapeHtml(slot.courtName)}</p>
          </div>
        </div>

        <div class="booking-details-grid">
          <div class="detail-item">
            <span class="detail-icon">📅</span>
            <span class="detail-label">Date</span>
            <span class="detail-value">${dateDisplay}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">⏰</span>
            <span class="detail-label">Time</span>
            <span class="detail-value">${startDisplay} - ${endDisplay}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">⏱️</span>
            <span class="detail-label">Duration</span>
            <span class="detail-value">${slot.duration} minutes</span>
          </div>
        </div>
      </div>

      <div class="price-summary">
        <div class="price-row">
          <span>Court rental</span>
          <span>${slot.currency}${priceDisplay}</span>
        </div>
        <div class="price-row">
          <span>Booking fee</span>
          <span>Free</span>
        </div>
        <div class="price-row total">
          <span>Total</span>
          <span>${slot.currency}${priceDisplay}</span>
        </div>
      </div>
    </div>

    <div class="checkout-actions">
      <button class="btn btn-secondary" onclick="closeCheckout()">Cancel</button>
      <button class="btn btn-primary" onclick="goToStep('details')">Continue</button>
    </div>
  `;
}

/**
 * Generate Details Step
 */
function generateDetailsStep(slot: BookingSlot): string {
  return `
    <div class="checkout-content">
      <div class="form-section">
        <h4>Player Information</h4>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="player-name" placeholder="John Smith" value="Demo Player" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="player-email" placeholder="john@example.com" value="demo@example.com" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="player-phone" placeholder="+34 612 345 678" value="+34 612 345 678" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4>Additional Players (Optional)</h4>
        <div class="players-note">
          <span class="note-icon">ℹ️</span>
          <span>You can add other players to the booking or invite them later</span>
        </div>
        <div class="form-group">
          <input type="text" id="player2" placeholder="Player 2 name or email" />
        </div>
        <div class="form-group">
          <input type="text" id="player3" placeholder="Player 3 name or email" />
        </div>
        <div class="form-group">
          <input type="text" id="player4" placeholder="Player 4 name or email" />
        </div>
      </div>
    </div>

    <div class="checkout-actions">
      <button class="btn btn-secondary" onclick="goToStep('review')">Back</button>
      <button class="btn btn-primary" onclick="goToStep('payment')">Continue to Payment</button>
    </div>
  `;
}

/**
 * Generate Payment Step
 */
function generatePaymentStep(slot: BookingSlot): string {
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  return `
    <div class="checkout-content">
      <div class="payment-amount">
        <span class="amount-label">Amount to pay</span>
        <span class="amount-value">${slot.currency}${priceDisplay}</span>
      </div>

      <div class="payment-form">
        <div class="card-preview">
          <div class="card-type" id="card-type-icon">💳</div>
          <div class="card-number-display" id="card-display">•••• •••• •••• ••••</div>
        </div>

        <div class="form-group">
          <label>Card Number</label>
          <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19"
                 oninput="formatCardNumber(this)" />
          <span class="input-hint">Any 16 digits work for demo</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Expiry Date</label>
            <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5"
                   oninput="formatExpiry(this)" />
          </div>
          <div class="form-group">
            <label>CVV</label>
            <input type="text" id="card-cvv" placeholder="123" maxlength="3" />
          </div>
        </div>

        <div class="form-group">
          <label>Name on Card</label>
          <input type="text" id="card-name" placeholder="JOHN SMITH" value="DEMO USER" style="text-transform: uppercase;" />
        </div>
      </div>

      <div class="secure-badge">
        <span class="lock-icon">🔒</span>
        <span>Secure payment (Demo Mode)</span>
      </div>
    </div>

    <div class="checkout-actions">
      <button class="btn btn-secondary" onclick="goToStep('details')">Back</button>
      <button class="btn btn-primary" id="pay-btn" onclick="processPayment()">
        Pay ${slot.currency}${priceDisplay}
      </button>
    </div>
  `;
}

/**
 * Generate Confirmation Step
 */
function generateConfirmationStep(slot: BookingSlot, bookingRef: string): string {
  const startDisplay = formatTimeDisplay(slot.startTime);
  const endDisplay = formatTimeDisplay(slot.endTime);
  const dateDisplay = formatDateDisplay(slot.date);
  const priceDisplay = slot.price % 1 === 0 ? slot.price.toFixed(0) : slot.price.toFixed(2);

  return `
    <div class="checkout-content confirmation-content">
      <div class="success-animation">
        <div class="success-circle">
          <svg class="checkmark" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
      </div>

      <h2 class="confirmation-title">Booking Confirmed!</h2>
      <p class="booking-ref">Reference: <strong>${bookingRef}</strong></p>

      <div class="confirmation-card">
        <div class="confirmation-venue">
          <span class="venue-emoji">🎾</span>
          <div>
            <h4>${escapeHtml(slot.venueName)}</h4>
            <p>${escapeHtml(slot.courtName)}</p>
          </div>
        </div>

        <div class="confirmation-details">
          <div class="conf-detail">
            <span class="conf-icon">📅</span>
            <span>${dateDisplay}</span>
          </div>
          <div class="conf-detail">
            <span class="conf-icon">⏰</span>
            <span>${startDisplay} - ${endDisplay}</span>
          </div>
          <div class="conf-detail">
            <span class="conf-icon">💰</span>
            <span>${slot.currency}${priceDisplay} paid</span>
          </div>
        </div>
      </div>

      <div class="confirmation-actions">
        <button class="btn btn-secondary" onclick="addToCalendarFromCheckout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Add to Calendar
        </button>
        <button class="btn btn-secondary" onclick="shareBooking('${bookingRef}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
      </div>
    </div>

    <div class="checkout-actions">
      <button class="btn btn-primary full-width" onclick="closeCheckout(); searchAgain();">
        Book Another Court
      </button>
    </div>
  `;
}

/**
 * Generate checkout scripts
 */
function generateCheckoutScripts(slot: BookingSlot): string {
  const slotJson = JSON.stringify(slot);
  const bookingRef = generateBookingRef();

  return `
    <script>
      var currentSlot = ${slotJson};
      var bookingRef = '${bookingRef}';
      var currentStep = 'review';

      function goToStep(step) {
        currentStep = step;
        renderStep();
      }

      function renderStep() {
        var container = document.getElementById('checkout-container');
        var stepIdx = {review: 0, details: 1, payment: 2, confirmation: 3}[currentStep];

        // Update step indicator
        document.querySelectorAll('.checkout-step').forEach(function(el, i) {
          el.classList.remove('active', 'completed');
          if (i < stepIdx) el.classList.add('completed');
          if (i === stepIdx) el.classList.add('active');
        });

        // Animate content change
        var content = document.querySelector('.checkout-content');
        if (content) {
          content.style.opacity = '0';
          content.style.transform = 'translateX(20px)';
        }

        setTimeout(function() {
          updateStepContent();
          notifySize();
        }, 150);
      }

      function updateStepContent() {
        // Re-render happens via postMessage to parent
        window.parent.postMessage({
          type: 'checkout-step',
          payload: { step: currentStep, slot: currentSlot, bookingRef: bookingRef }
        }, '*');
      }

      function formatCardNumber(input) {
        var v = input.value.replace(/\\s+/g, '').replace(/[^0-9]/gi, '');
        var matches = v.match(/\\d{4,16}/g);
        var match = matches && matches[0] || '';
        var parts = [];
        for (var i = 0, len = match.length; i < len; i += 4) {
          parts.push(match.substring(i, i + 4));
        }
        input.value = parts.length ? parts.join(' ') : v;

        // Update display
        var display = document.getElementById('card-display');
        if (display) {
          var displayVal = input.value || '•••• •••• •••• ••••';
          display.textContent = displayVal.padEnd(19, ' ').replace(/\\d(?=.{4})/g, function(m, i) {
            return i < 15 ? '•' : m;
          });
        }

        // Detect card type
        var typeIcon = document.getElementById('card-type-icon');
        if (typeIcon && v.length > 0) {
          if (v[0] === '4') typeIcon.textContent = '💳 Visa';
          else if (v[0] === '5') typeIcon.textContent = '💳 Mastercard';
          else if (v[0] === '3') typeIcon.textContent = '💳 Amex';
          else typeIcon.textContent = '💳';
        }
      }

      function formatExpiry(input) {
        var v = input.value.replace(/\\D/g, '');
        if (v.length >= 2) {
          input.value = v.substring(0, 2) + '/' + v.substring(2, 4);
        } else {
          input.value = v;
        }
      }

      function processPayment() {
        var cardNum = document.getElementById('card-number').value.replace(/\\s/g, '');
        var expiry = document.getElementById('card-expiry').value;
        var cvv = document.getElementById('card-cvv').value;

        // Basic validation
        if (cardNum.length < 16) {
          ToastSystem.error('Please enter a valid card number');
          return;
        }
        if (!expiry || expiry.length < 5) {
          ToastSystem.error('Please enter expiry date');
          return;
        }
        if (!cvv || cvv.length < 3) {
          ToastSystem.error('Please enter CVV');
          return;
        }

        var btn = document.getElementById('pay-btn');
        setButtonLoading(btn, true);

        // Simulate payment processing
        setTimeout(function() {
          setButtonSuccess(btn);
          ToastSystem.success('Payment successful!', 'Booking Confirmed');

          setTimeout(function() {
            goToStep('confirmation');
          }, 800);
        }, 1500);
      }

      function closeCheckout() {
        var modal = document.getElementById('checkout-modal');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
        window.parent.postMessage({ type: 'checkout-close' }, '*');
      }

      function addToCalendarFromCheckout() {
        var slot = currentSlot;
        var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
          '&text=' + encodeURIComponent('Padel - ' + slot.venueName) +
          '&dates=' + slot.date.replace(/-/g, '') + 'T' + slot.startTime.replace(/:/g, '') + '00/' +
          slot.date.replace(/-/g, '') + 'T' + slot.endTime.replace(/:/g, '') + '00' +
          '&details=' + encodeURIComponent('Court: ' + slot.courtName + '\\nRef: ' + bookingRef);
        window.open(url, '_blank');
        ToastSystem.success('Opening calendar...', 'Add Event');
      }

      function shareBooking(ref) {
        var text = 'Padel booked! ' + currentSlot.venueName + ' on ' + currentSlot.date + ' at ' + currentSlot.startTime + '. Ref: ' + ref;
        if (navigator.share) {
          navigator.share({ title: 'Padel Booking', text: text });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          ToastSystem.success('Copied to clipboard!', 'Share');
        }
      }

      function searchAgain() {
        window.parent.postMessage({
          type: 'tool',
          payload: { toolName: 'find_available_games', params: {} }
        }, '*');
      }
    </script>
  `;
}

/**
 * Generate full checkout wizard HTML
 */
export function generateCheckoutWizardHTML(config: CheckoutConfig): string {
  const { slot, step = 'review', bookingRef } = config;
  const stepIndex = { review: 0, details: 1, payment: 2, confirmation: 3 }[step];
  const finalBookingRef = bookingRef || generateBookingRef();

  let stepContent: string;
  switch (step) {
    case 'details':
      stepContent = generateDetailsStep(slot);
      break;
    case 'payment':
      stepContent = generatePaymentStep(slot);
      break;
    case 'confirmation':
      stepContent = generateConfirmationStep(slot, finalBookingRef);
      break;
    default:
      stepContent = generateReviewStep(slot);
  }

  return `
    <div class="checkout-modal-overlay active" id="checkout-modal" onclick="if(event.target===this)closeCheckout()">
      <div class="checkout-modal">
        <button class="checkout-close" onclick="closeCheckout()">×</button>

        <div class="checkout-header">
          <h2>${step === 'confirmation' ? 'Booking Complete' : 'Book Your Court'}</h2>
          ${generateStepIndicator(stepIndex)}
        </div>

        <div id="checkout-container">
          ${stepContent}
        </div>
      </div>
    </div>
    ${generateCheckoutScripts(slot)}
  `;
}

/**
 * Generate inline checkout styles
 */
export function getCheckoutStyles(): string {
  return `.checkout-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;opacity:0;visibility:hidden;transition:all var(--duration-normal);backdrop-filter:blur(8px)}.checkout-modal-overlay.active{opacity:1;visibility:visible}.checkout-modal{background:var(--color-surface);border-radius:24px;width:100%;max-width:480px;margin:16px;box-shadow:var(--shadow-xl);position:relative;animation:fadeInScale var(--duration-normal) var(--ease-out-expo)}.checkout-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:var(--color-background);border-radius:50%;font-size:24px;cursor:pointer;color:var(--color-text-secondary);transition:all var(--duration-fast);display:flex;align-items:center;justify-content:center;z-index:10}.checkout-close:hover{background:var(--color-border);transform:scale(1.1)}.checkout-header{padding:24px 24px 0;text-align:center}.checkout-header h2{margin:0 0 20px 0;font-size:22px;font-weight:700}.checkout-steps{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:8px}.checkout-step{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative}.step-circle{width:32px;height:32px;border-radius:50%;background:var(--color-background);border:2px solid var(--color-border);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--color-text-secondary);transition:all var(--duration-normal)}.checkout-step.active .step-circle{background:var(--color-primary);border-color:var(--color-primary);color:#fff;box-shadow:0 0 0 4px rgba(13,148,136,.2)}.checkout-step.completed .step-circle{background:var(--color-success);border-color:var(--color-success);color:#fff}.step-label{font-size:11px;color:var(--color-text-secondary);font-weight:500}.checkout-step.active .step-label{color:var(--color-primary);font-weight:600}.step-line{width:40px;height:2px;background:var(--color-border);margin:0 4px 20px 4px}.checkout-step.completed+.step-line{background:var(--color-success)}.checkout-content{padding:24px;animation:fadeInUp var(--duration-normal) var(--ease-out-expo)}.booking-card{background:var(--color-background);border-radius:16px;padding:20px;margin-bottom:20px}.booking-venue{display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--color-border)}.venue-icon{font-size:32px}.venue-info h3{margin:0;font-size:18px;font-weight:600}.venue-info p{margin:4px 0 0;color:var(--color-text-secondary);font-size:14px}.booking-details-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.detail-item{text-align:center;padding:12px 8px;background:var(--color-surface);border-radius:10px}.detail-icon{display:block;font-size:20px;margin-bottom:4px}.detail-label{display:block;font-size:11px;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.5px}.detail-value{display:block;font-size:13px;font-weight:600;margin-top:4px}.price-summary{background:var(--color-background);border-radius:12px;padding:16px}.price-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border);font-size:14px;color:var(--color-text-secondary)}.price-row:last-child{border-bottom:none}.price-row.total{border-top:2px solid var(--color-border);border-bottom:none;margin-top:8px;padding-top:16px;font-size:18px;font-weight:700;color:var(--color-text-primary)}.price-row.total span:last-child{color:var(--color-primary)}.checkout-actions{display:flex;gap:12px;padding:0 24px 24px}.checkout-actions .btn{flex:1}.checkout-actions .btn.full-width{width:100%}.form-section{margin-bottom:24px}.form-section h4{margin:0 0 16px;font-size:15px;font-weight:600;color:var(--color-text-primary)}.players-note{display:flex;align-items:center;gap:8px;padding:12px;background:rgba(59,130,246,.1);border-radius:8px;margin-bottom:16px;font-size:13px;color:var(--color-info)}.note-icon{font-size:16px}.payment-amount{text-align:center;padding:20px;background:var(--color-primary-gradient);border-radius:16px;margin-bottom:20px;color:#fff}.amount-label{display:block;font-size:13px;opacity:.9;margin-bottom:4px}.amount-value{font-size:36px;font-weight:700}.payment-form{margin-bottom:20px}.card-preview{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:12px;padding:20px;margin-bottom:20px;color:#fff}.card-type{font-size:14px;margin-bottom:12px;opacity:.8}.card-number-display{font-size:20px;font-family:monospace;letter-spacing:2px}.input-hint{display:block;font-size:11px;color:var(--color-text-secondary);margin-top:4px}.secure-badge{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:rgba(34,197,94,.1);border-radius:8px;font-size:13px;color:var(--color-success)}.lock-icon{font-size:16px}.confirmation-content{text-align:center}.success-animation{margin-bottom:24px}.success-circle{width:80px;height:80px;margin:0 auto;background:var(--color-success);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:scaleIn .5s var(--spring)}.checkmark{width:40px;height:40px}.checkmark-circle{stroke:var(--color-success);stroke-width:2;animation:none}.checkmark-check{stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;stroke-dashoffset:50;animation:checkmark .4s .3s ease-out forwards}@keyframes scaleIn{0%{transform:scale(0)}100%{transform:scale(1)}}.confirmation-title{margin:0 0 8px;font-size:24px;font-weight:700;color:var(--color-text-primary)}.booking-ref{color:var(--color-text-secondary);margin-bottom:24px;font-size:14px}.booking-ref strong{color:var(--color-primary);font-size:16px}.confirmation-card{background:var(--color-background);border-radius:16px;padding:20px;margin-bottom:20px;text-align:left}.confirmation-venue{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--color-border)}.venue-emoji{font-size:28px}.confirmation-venue h4{margin:0;font-size:16px}.confirmation-venue p{margin:4px 0 0;font-size:13px;color:var(--color-text-secondary)}.confirmation-details{display:flex;flex-direction:column;gap:10px}.conf-detail{display:flex;align-items:center;gap:10px;font-size:14px}.conf-icon{font-size:16px}.confirmation-actions{display:flex;gap:12px;margin-bottom:8px}.confirmation-actions .btn{flex:1;padding:12px 16px;font-size:13px}@media(max-width:480px){.checkout-modal{margin:8px;border-radius:20px}.booking-details-grid{grid-template-columns:1fr}.checkout-steps{transform:scale(.9)}.payment-amount{padding:16px}.amount-value{font-size:28px}}`;
}
