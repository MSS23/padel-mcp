/**
 * Weekly Calendar Widget
 *
 * Visualizes availability across 7 days with heat map style indicators.
 */

import { h } from 'preact';
import type { EnhancedTimeSlot } from '../../types/index.js';

export interface WeeklyCalendarWidgetProps {
  slots: EnhancedTimeSlot[];
  startDate: string; // YYYY-MM-DD
  widgetSessionId?: string;
}

export function WeeklyCalendarWidget(props: WeeklyCalendarWidgetProps) {
  const { slots, startDate } = props;

  // Group slots by date
  const slotsByDate = new Map<string, EnhancedTimeSlot[]>();
  for (const slot of slots) {
    const date = slot.start_time.split('T')[0];
    const dateSlots = slotsByDate.get(date) || [];
    dateSlots.push(slot);
    slotsByDate.set(date, dateSlots);
  }

  // Generate 7 days starting from startDate
  const days = generateWeekDays(startDate);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Weekly Availability</h2>
      <div style={styles.calendar}>
        {days.map(day => {
          const daySlots = slotsByDate.get(day.date) || [];
          const slotCount = daySlots.length;
          const avgPrice = slotCount > 0
            ? daySlots.reduce((sum, s) => sum + s.price, 0) / slotCount
            : 0;

          return (
            <DayCell
              key={day.date}
              day={day}
              slotCount={slotCount}
              avgPrice={avgPrice}
              slots={daySlots}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  slotCount,
  avgPrice,
  slots,
}: {
  day: { date: string; dayName: string; dayNum: number };
  slotCount: number;
  avgPrice: number;
  slots: EnhancedTimeSlot[];
}) {
  // Heat map intensity based on slot count
  const intensity = Math.min(slotCount / 20, 1); // Max 20 slots = full intensity
  const backgroundColor = `rgba(44, 90, 160, ${intensity * 0.3})`;

  return (
    <div style={{ ...styles.dayCell, backgroundColor }}>
      <div style={styles.dayHeader}>
        <div style={styles.dayName}>{day.dayName}</div>
        <div style={styles.dayNum}>{day.dayNum}</div>
      </div>
      <div style={styles.dayStats}>
        <div style={styles.slotCount}>{slotCount} slots</div>
        {avgPrice > 0 && (
          <div style={styles.avgPrice}>£{avgPrice.toFixed(0)} avg</div>
        )}
      </div>
      {slots.length > 0 && (
        <div style={styles.sampleSlots}>
          {slots.slice(0, 3).map(slot => {
            const time = slot.start_time.split('T')[1]?.substring(0, 5) || '';
            return (
              <div key={slot.start_time} style={styles.sampleSlot}>
                {time} - £{slot.price}
              </div>
            );
          })}
          {slots.length > 3 && (
            <div style={styles.moreSlots}>+{slots.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}

function generateWeekDays(startDate: string): Array<{ date: string; dayName: string; dayNum: number }> {
  const days: Array<{ date: string; dayName: string; dayNum: number }> = [];
  const start = new Date(startDate);
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      dayNum: date.getDate(),
    });
  }
  
  return days;
}

const styles = {
  container: {
    padding: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  calendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '12px',
  },
  dayCell: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px',
    minHeight: '120px',
    backgroundColor: '#f9f9f9',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  dayName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
  },
  dayNum: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  dayStats: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  slotCount: {
    fontWeight: 'bold',
  },
  avgPrice: {
    marginTop: '4px',
  },
  sampleSlots: {
    fontSize: '11px',
    color: '#333',
  },
  sampleSlot: {
    marginTop: '4px',
    padding: '2px 0',
  },
  moreSlots: {
    marginTop: '4px',
    fontStyle: 'italic',
    color: '#666',
  },
};
