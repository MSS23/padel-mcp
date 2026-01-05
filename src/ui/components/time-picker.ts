/**
 * Visual Time Picker Component
 *
 * Interactive grid-based time picker for selecting time ranges.
 * Shows availability status and allows range selection.
 */

import { wrapWithStyles } from '../styles.js';

export interface TimeSlotAvailability {
  hour: number;
  available: boolean;
  count?: number;
}

export interface TimePickerConfig {
  startHour?: number;
  endHour?: number;
  selectedStart?: string;
  selectedEnd?: string;
  availability?: TimeSlotAvailability[];
  onTimeSelect?: string;
}

/**
 * Generate HTML for the visual time picker
 */
export function generateTimePickerHTML(config: TimePickerConfig = {}): string {
  const {
    startHour = 6,
    endHour = 23,
    selectedStart,
    selectedEnd,
    availability = [],
  } = config;

  // Create availability map
  const availabilityMap = new Map<number, TimeSlotAvailability>();
  for (const slot of availability) {
    availabilityMap.set(slot.hour, slot);
  }

  // Parse selected times
  const selectedStartHour = selectedStart ? parseInt(selectedStart.split(':')[0], 10) : null;
  const selectedEndHour = selectedEnd ? parseInt(selectedEnd.split(':')[0], 10) : null;

  // Generate time slots
  let slotsHtml = '';
  for (let hour = startHour; hour <= endHour; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const slotInfo = availabilityMap.get(hour);
    const isAvailable = slotInfo?.available ?? true;
    const slotCount = slotInfo?.count;

    let classes = 'time-slot';
    if (!isAvailable) classes += ' unavailable';
    if (selectedStartHour !== null && selectedEndHour !== null) {
      if (hour >= selectedStartHour && hour <= selectedEndHour) {
        classes += ' selected';
      }
      if (hour === selectedStartHour) classes += ' range-start';
      if (hour === selectedEndHour) classes += ' range-end';
    } else if (selectedStartHour !== null && hour === selectedStartHour) {
      classes += ' selected range-start';
    }

    const countBadge = slotCount !== undefined && slotCount > 0
      ? `<span class="slot-count">${slotCount}</span>`
      : '';

    slotsHtml += `
      <button
        class="${classes}"
        data-hour="${hour}"
        data-time="${timeStr}"
        onclick="selectTime(this)"
        ${!isAvailable ? 'disabled' : ''}
      >
        <span class="time-label">${timeStr}</span>
        ${countBadge}
      </button>
    `;
  }

  const content = `
    <div class="time-picker">
      <div class="time-picker-header">
        <h4>Select Time Range</h4>
        <button class="clear-time-btn" onclick="clearTimeSelection()">Clear</button>
      </div>

      <div class="time-picker-legend">
        <span class="legend-item">
          <span class="legend-dot available"></span>
          Available
        </span>
        <span class="legend-item">
          <span class="legend-dot selected"></span>
          Selected
        </span>
        <span class="legend-item">
          <span class="legend-dot unavailable"></span>
          Unavailable
        </span>
      </div>

      <div class="time-slots-grid">
        ${slotsHtml}
      </div>

      <div class="time-picker-selection">
        <div class="selection-display">
          <span class="selection-label">Selected:</span>
          <span id="time-selection-text" class="selection-value">
            ${selectedStart && selectedEnd ? `${selectedStart} - ${selectedEnd}` : 'Click to select'}
          </span>
        </div>
        <button class="btn btn-primary apply-time-btn" onclick="applyTimeSelection()">
          Apply
        </button>
      </div>
    </div>
  `;

  return content;
}

/**
 * Generate standalone time picker with full styling and scripts
 */
export function generateTimePickerComponentHTML(config: TimePickerConfig = {}): string {
  const pickerHtml = generateTimePickerHTML(config);

  const script = `
    <script>
      var timePickerState = {
        startHour: null,
        endHour: null,
        isSelectingEnd: false
      };

      function selectTime(btn) {
        if (btn.disabled) return;

        var hour = parseInt(btn.dataset.hour, 10);

        // If nothing selected or selecting end and clicking before start
        if (timePickerState.startHour === null ||
            (timePickerState.isSelectingEnd && hour < timePickerState.startHour)) {
          // Start new selection
          clearTimeHighlights();
          timePickerState.startHour = hour;
          timePickerState.endHour = null;
          timePickerState.isSelectingEnd = true;
          btn.classList.add('selected', 'range-start');
        } else if (timePickerState.isSelectingEnd) {
          // Complete selection
          timePickerState.endHour = hour;
          timePickerState.isSelectingEnd = false;
          highlightRange();
        } else {
          // Start new selection
          clearTimeHighlights();
          timePickerState.startHour = hour;
          timePickerState.endHour = null;
          timePickerState.isSelectingEnd = true;
          btn.classList.add('selected', 'range-start');
        }

        updateSelectionDisplay();
      }

      function clearTimeHighlights() {
        document.querySelectorAll('.time-slot').forEach(function(slot) {
          slot.classList.remove('selected', 'range-start', 'range-end', 'in-range');
        });
      }

      function highlightRange() {
        document.querySelectorAll('.time-slot').forEach(function(slot) {
          var hour = parseInt(slot.dataset.hour, 10);
          slot.classList.remove('selected', 'range-start', 'range-end', 'in-range');

          if (hour >= timePickerState.startHour && hour <= timePickerState.endHour) {
            slot.classList.add('selected');
            if (hour === timePickerState.startHour) slot.classList.add('range-start');
            if (hour === timePickerState.endHour) slot.classList.add('range-end');
            if (hour > timePickerState.startHour && hour < timePickerState.endHour) {
              slot.classList.add('in-range');
            }
          }
        });
      }

      function clearTimeSelection() {
        timePickerState.startHour = null;
        timePickerState.endHour = null;
        timePickerState.isSelectingEnd = false;
        clearTimeHighlights();
        updateSelectionDisplay();
      }

      function updateSelectionDisplay() {
        var display = document.getElementById('time-selection-text');
        if (!display) return;

        if (timePickerState.startHour !== null && timePickerState.endHour !== null) {
          var startStr = timePickerState.startHour.toString().padStart(2, '0') + ':00';
          var endStr = timePickerState.endHour.toString().padStart(2, '0') + ':00';
          display.textContent = startStr + ' - ' + endStr;
        } else if (timePickerState.startHour !== null) {
          var startStr = timePickerState.startHour.toString().padStart(2, '0') + ':00';
          display.textContent = startStr + ' - Select end time';
        } else {
          display.textContent = 'Click to select';
        }
      }

      function applyTimeSelection() {
        if (timePickerState.startHour === null) {
          ToastSystem.warning('Please select a time range first');
          return;
        }

        var startStr = timePickerState.startHour.toString().padStart(2, '0') + ':00';
        var endStr = timePickerState.endHour
          ? timePickerState.endHour.toString().padStart(2, '0') + ':00'
          : '23:00';

        // Send to parent via postMessage
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'time_selection',
            payload: {
              timeStart: startStr,
              timeEnd: endStr
            }
          }, '*');
        }

        // Trigger callback if defined
        if (typeof onTimeSelect === 'function') {
          onTimeSelect(startStr, endStr);
        }

        ToastSystem.success('Time range applied: ' + startStr + ' - ' + endStr);
      }

      // Handle hover for range preview
      document.querySelectorAll('.time-slot').forEach(function(slot) {
        slot.addEventListener('mouseenter', function() {
          if (!timePickerState.isSelectingEnd || this.disabled) return;

          var hour = parseInt(this.dataset.hour, 10);
          if (hour < timePickerState.startHour) return;

          // Preview the range
          document.querySelectorAll('.time-slot').forEach(function(s) {
            var h = parseInt(s.dataset.hour, 10);
            s.classList.remove('preview');
            if (h > timePickerState.startHour && h <= hour) {
              s.classList.add('preview');
            }
          });
        });

        slot.addEventListener('mouseleave', function() {
          document.querySelectorAll('.time-slot.preview').forEach(function(s) {
            s.classList.remove('preview');
          });
        });
      });
    </script>
  `;

  return wrapWithStyles(pickerHtml + script);
}

/**
 * Generate compact time range selector
 */
export function generateCompactTimeRangeHTML(options?: {
  selectedStart?: string;
  selectedEnd?: string;
}): string {
  const { selectedStart = '', selectedEnd = '' } = options ?? {};

  return `
    <div class="compact-time-range">
      <div class="time-input-group">
        <label for="time-start-input">From</label>
        <input
          type="time"
          id="time-start-input"
          class="time-input"
          value="${selectedStart}"
          onchange="handleTimeInputChange()"
        />
      </div>
      <span class="time-range-separator">to</span>
      <div class="time-input-group">
        <label for="time-end-input">To</label>
        <input
          type="time"
          id="time-end-input"
          class="time-input"
          value="${selectedEnd}"
          onchange="handleTimeInputChange()"
        />
      </div>
    </div>
  `;
}
