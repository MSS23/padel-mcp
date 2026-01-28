/**
 * Search Form Widget
 *
 * Interactive search form for finding padel courts with filters.
 */

import { h } from 'preact';
import { useState, useCallback, FormEvent } from 'preact/hooks';
import { useChatGPTTool } from '../common/hooks.js';

export interface SearchFormWidgetProps {
  initialLocation?: string;
  initialDate?: string;
  initialTimeStart?: string;
  initialTimeEnd?: string;
  widgetSessionId?: string;
}

export function SearchFormWidget(props: SearchFormWidgetProps) {
  const [location, setLocation] = useState(props.initialLocation || '');
  const [date, setDate] = useState(props.initialDate || getTomorrowDate());
  const [timeStart, setTimeStart] = useState(props.initialTimeStart || '');
  const [timeEnd, setTimeEnd] = useState(props.initialTimeEnd || '');
  const [maxDistance, setMaxDistance] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { callTool, requestDisplayMode } = useChatGPTTool();

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Request fullscreen for results display
      requestDisplayMode('fullscreen');

      // Call find_available_games tool
      const result = await callTool('find_available_games', {
        location,
        date,
        preferred_time_start: timeStart || undefined,
        preferred_time_end: timeEnd || undefined,
        max_distance_km: maxDistance,
        include_weather: true,
      });

      console.log('Search results:', result);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [location, date, timeStart, timeEnd, maxDistance, callTool, requestDisplayMode]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Find Padel Courts</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation((e.target as HTMLInputElement).value)}
            placeholder="City, address, or coordinates"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate((e.target as HTMLInputElement).value)}
            min={getTodayDate()}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Start Time (optional)</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart((e.target as HTMLInputElement).value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>End Time (optional)</label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd((e.target as HTMLInputElement).value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Max Distance: {maxDistance}km</label>
          <input
            type="range"
            min="1"
            max="50"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt((e.target as HTMLInputElement).value, 10))}
            style={styles.range}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...styles.submitButton, opacity: isSubmitting ? 0.6 : 1 }}
        >
          {isSubmitting ? 'Searching...' : 'Search Courts'}
        </button>
      </form>
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  range: {
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
