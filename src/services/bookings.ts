/**
 * Bookings Service
 *
 * Persistent storage for booking history.
 * Bookings are stored in a JSON file and survive server restarts.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type { BookingRecord } from '../types/index.js';

interface BookingsData {
  bookings: BookingRecord[];
}

const DEFAULT_DATA: BookingsData = {
  bookings: [],
};

class BookingsService {
  private bookingsPath: string;
  private data: BookingsData | null = null;

  constructor() {
    const baseDir = join(homedir(), '.padel-finder');
    this.bookingsPath = join(baseDir, 'bookings.json');
  }

  /**
   * Load bookings from disk
   */
  async load(): Promise<BookingsData> {
    if (this.data) {
      return this.data;
    }

    try {
      const content = await readFile(this.bookingsPath, 'utf-8');
      this.data = { ...DEFAULT_DATA, ...JSON.parse(content) };
    } catch {
      this.data = { ...DEFAULT_DATA };
    }

    return this.data!;
  }

  /**
   * Save bookings to disk
   */
  async save(): Promise<void> {
    if (!this.data) {
      return;
    }

    try {
      await mkdir(dirname(this.bookingsPath), { recursive: true });
      await writeFile(this.bookingsPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save bookings:', error);
    }
  }

  /**
   * Get all bookings
   */
  async getBookings(): Promise<BookingRecord[]> {
    const data = await this.load();
    return data.bookings;
  }

  /**
   * Get bookings with filters
   */
  async getFilteredBookings(options: {
    filter?: 'upcoming' | 'past' | 'all';
    venue_id?: string;
    status?: BookingRecord['status'];
    limit?: number;
  }): Promise<BookingRecord[]> {
    const data = await this.load();
    let bookings = [...data.bookings];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Filter by time
    if (options.filter === 'upcoming') {
      bookings = bookings.filter((b) => {
        const bookingDateTime = `${b.date}T${b.start_time}`;
        return bookingDateTime >= now.toISOString().substring(0, 16);
      });
    } else if (options.filter === 'past') {
      bookings = bookings.filter((b) => {
        const bookingDateTime = `${b.date}T${b.end_time}`;
        return bookingDateTime < now.toISOString().substring(0, 16);
      });
    }

    // Filter by venue
    if (options.venue_id) {
      bookings = bookings.filter((b) => b.venue_id === options.venue_id);
    }

    // Filter by status
    if (options.status) {
      bookings = bookings.filter((b) => b.status === options.status);
    }

    // Sort by date (newest first for past, oldest first for upcoming)
    bookings.sort((a, b) => {
      const dateA = `${a.date}T${a.start_time}`;
      const dateB = `${b.date}T${b.start_time}`;
      return options.filter === 'past'
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

    // Apply limit
    if (options.limit && options.limit > 0) {
      bookings = bookings.slice(0, options.limit);
    }

    return bookings;
  }

  /**
   * Get a specific booking by ID
   */
  async getBooking(bookingId: string): Promise<BookingRecord | undefined> {
    const data = await this.load();
    return data.bookings.find((b) => b.id === bookingId);
  }

  /**
   * Create a new booking record
   */
  async createBooking(params: {
    venue_id: string;
    venue_name: string;
    court_name: string;
    date: string;
    start_time: string;
    end_time: string;
    price: number;
    currency: string;
    booking_url?: string;
    calendar_link?: string;
    players?: string[];
    notes?: string;
  }): Promise<BookingRecord> {
    const data = await this.load();

    // Check for duplicate
    const existing = data.bookings.find(
      (b) =>
        b.venue_id === params.venue_id &&
        b.date === params.date &&
        b.start_time === params.start_time &&
        b.court_name === params.court_name &&
        b.status !== 'cancelled'
    );

    if (existing) {
      return existing;
    }

    const booking: BookingRecord = {
      id: randomUUID(),
      venue_id: params.venue_id,
      venue_name: params.venue_name,
      court_name: params.court_name,
      date: params.date,
      start_time: params.start_time,
      end_time: params.end_time,
      price: params.price,
      currency: params.currency,
      booking_url: params.booking_url,
      calendar_link: params.calendar_link,
      booked_at: new Date().toISOString(),
      status: 'confirmed',
      players: params.players ?? [],
      notes: params.notes,
    };

    data.bookings.push(booking);
    await this.save();
    return booking;
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingRecord['status']
  ): Promise<boolean> {
    const data = await this.load();
    const booking = data.bookings.find((b) => b.id === bookingId);

    if (booking) {
      booking.status = status;
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Update booking details
   */
  async updateBooking(
    bookingId: string,
    updates: Partial<Pick<BookingRecord, 'players' | 'notes' | 'status'>>
  ): Promise<BookingRecord | undefined> {
    const data = await this.load();
    const booking = data.bookings.find((b) => b.id === bookingId);

    if (booking) {
      if (updates.players !== undefined) booking.players = updates.players;
      if (updates.notes !== undefined) booking.notes = updates.notes;
      if (updates.status !== undefined) booking.status = updates.status;
      await this.save();
      return booking;
    }

    return undefined;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<boolean> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  }

  /**
   * Mark a booking as completed
   */
  async completeBooking(bookingId: string): Promise<boolean> {
    return this.updateBookingStatus(bookingId, 'completed');
  }

  /**
   * Delete a booking permanently
   */
  async deleteBooking(bookingId: string): Promise<boolean> {
    const data = await this.load();
    const initialLength = data.bookings.length;
    data.bookings = data.bookings.filter((b) => b.id !== bookingId);

    if (data.bookings.length < initialLength) {
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Get booking statistics
   */
  async getStats(): Promise<{
    total_bookings: number;
    total_spent: { [currency: string]: number };
    venues_played: number;
    upcoming_count: number;
  }> {
    const data = await this.load();
    const now = new Date();

    const confirmedBookings = data.bookings.filter(
      (b) => b.status !== 'cancelled'
    );

    const totalSpent: { [currency: string]: number } = {};
    for (const booking of confirmedBookings) {
      totalSpent[booking.currency] =
        (totalSpent[booking.currency] ?? 0) + booking.price;
    }

    const venueIds = new Set(confirmedBookings.map((b) => b.venue_id));

    const upcoming = confirmedBookings.filter((b) => {
      const bookingDateTime = `${b.date}T${b.start_time}`;
      return bookingDateTime >= now.toISOString().substring(0, 16);
    });

    return {
      total_bookings: confirmedBookings.length,
      total_spent: totalSpent,
      venues_played: venueIds.size,
      upcoming_count: upcoming.length,
    };
  }

  /**
   * Auto-complete past bookings
   */
  async autoCompletePastBookings(): Promise<number> {
    const data = await this.load();
    const now = new Date();
    let completed = 0;

    for (const booking of data.bookings) {
      if (booking.status === 'confirmed') {
        const endDateTime = new Date(`${booking.date}T${booking.end_time}`);
        if (endDateTime < now) {
          booking.status = 'completed';
          completed++;
        }
      }
    }

    if (completed > 0) {
      await this.save();
    }

    return completed;
  }
}

// Export singleton instance
export const bookings = new BookingsService();

// Export helper functions for tools
export async function getBookings(): Promise<BookingRecord[]> {
  return bookings.getBookings();
}

export async function getFilteredBookings(options: {
  filter?: 'upcoming' | 'past' | 'all';
  venue_id?: string;
  status?: BookingRecord['status'];
  limit?: number;
}): Promise<BookingRecord[]> {
  return bookings.getFilteredBookings(options);
}

export async function createBooking(params: {
  venue_id: string;
  venue_name: string;
  court_name: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  currency: string;
  booking_url?: string;
  calendar_link?: string;
  players?: string[];
  notes?: string;
}): Promise<BookingRecord> {
  return bookings.createBooking(params);
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  return bookings.cancelBooking(bookingId);
}

export async function getBookingStats(): Promise<{
  total_bookings: number;
  total_spent: { [currency: string]: number };
  venues_played: number;
  upcoming_count: number;
}> {
  return bookings.getStats();
}
