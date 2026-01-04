/**
 * Games Service
 *
 * Persistent storage for group game coordination.
 * Games are stored in a JSON file for tracking player confirmations.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type { GroupGame } from '../types/index.js';

interface GamesData {
  games: GroupGame[];
}

const DEFAULT_DATA: GamesData = {
  games: [],
};

class GamesService {
  private gamesPath: string;
  private data: GamesData | null = null;

  constructor() {
    const baseDir = join(homedir(), '.padel-finder');
    this.gamesPath = join(baseDir, 'games.json');
  }

  /**
   * Load games from disk
   */
  async load(): Promise<GamesData> {
    if (this.data) {
      return this.data;
    }

    try {
      const content = await readFile(this.gamesPath, 'utf-8');
      this.data = { ...DEFAULT_DATA, ...JSON.parse(content) };
    } catch {
      this.data = { ...DEFAULT_DATA };
    }

    return this.data!;
  }

  /**
   * Save games to disk
   */
  async save(): Promise<void> {
    if (!this.data) {
      return;
    }

    try {
      await mkdir(dirname(this.gamesPath), { recursive: true });
      await writeFile(this.gamesPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save games:', error);
    }
  }

  /**
   * Get all games
   */
  async getGames(): Promise<GroupGame[]> {
    const data = await this.load();
    return data.games;
  }

  /**
   * Get games with filters
   */
  async getFilteredGames(options: {
    status?: GroupGame['status'];
    upcoming_only?: boolean;
  }): Promise<GroupGame[]> {
    const data = await this.load();
    let games = [...data.games];
    const now = new Date();

    if (options.upcoming_only) {
      games = games.filter((g) => {
        const gameDateTime = `${g.date}T${g.start_time}`;
        return gameDateTime >= now.toISOString().substring(0, 16);
      });
    }

    if (options.status) {
      games = games.filter((g) => g.status === options.status);
    }

    // Sort by date
    games.sort((a, b) => {
      const dateA = `${a.date}T${a.start_time}`;
      const dateB = `${b.date}T${b.start_time}`;
      return dateA.localeCompare(dateB);
    });

    return games;
  }

  /**
   * Get a game by ID
   */
  async getGame(gameId: string): Promise<GroupGame | undefined> {
    const data = await this.load();
    return data.games.find((g) => g.id === gameId);
  }

  /**
   * Create a new group game
   */
  async createGame(params: {
    venue_id: string;
    venue_name: string;
    court_name?: string;
    date: string;
    start_time: string;
    end_time?: string;
    max_players: number;
    invited_friends?: string[];
    booking_url?: string;
    notes?: string;
  }): Promise<GroupGame> {
    const data = await this.load();

    const game: GroupGame = {
      id: randomUUID(),
      venue_id: params.venue_id,
      venue_name: params.venue_name,
      court_name: params.court_name,
      date: params.date,
      start_time: params.start_time,
      end_time: params.end_time,
      max_players: params.max_players,
      confirmed_players: ['me'], // Creator is always confirmed
      pending_invites: params.invited_friends ?? [],
      status: 'open',
      created_at: new Date().toISOString(),
      booking_url: params.booking_url,
      notes: params.notes,
    };

    // Auto-set to full if max players reached
    if (game.confirmed_players.length >= game.max_players) {
      game.status = 'full';
    }

    data.games.push(game);
    await this.save();
    return game;
  }

  /**
   * Confirm a player for a game
   */
  async confirmPlayer(gameId: string, playerName: string): Promise<GroupGame | undefined> {
    const data = await this.load();
    const game = data.games.find((g) => g.id === gameId);

    if (!game) {
      return undefined;
    }

    // Check if already confirmed
    if (game.confirmed_players.includes(playerName)) {
      return game;
    }

    // Check if game is full
    if (game.confirmed_players.length >= game.max_players) {
      return game;
    }

    // Add to confirmed, remove from pending
    game.confirmed_players.push(playerName);
    game.pending_invites = game.pending_invites.filter((p) => p !== playerName);

    // Update status
    if (game.confirmed_players.length >= game.max_players) {
      game.status = 'full';
    }

    await this.save();
    return game;
  }

  /**
   * Remove a player from a game
   */
  async removePlayer(gameId: string, playerName: string): Promise<GroupGame | undefined> {
    const data = await this.load();
    const game = data.games.find((g) => g.id === gameId);

    if (!game) {
      return undefined;
    }

    game.confirmed_players = game.confirmed_players.filter((p) => p !== playerName);
    game.pending_invites = game.pending_invites.filter((p) => p !== playerName);

    // Update status if was full
    if (game.status === 'full' && game.confirmed_players.length < game.max_players) {
      game.status = 'open';
    }

    await this.save();
    return game;
  }

  /**
   * Add invites to a game
   */
  async addInvites(gameId: string, playerNames: string[]): Promise<GroupGame | undefined> {
    const data = await this.load();
    const game = data.games.find((g) => g.id === gameId);

    if (!game) {
      return undefined;
    }

    for (const name of playerNames) {
      if (!game.confirmed_players.includes(name) && !game.pending_invites.includes(name)) {
        game.pending_invites.push(name);
      }
    }

    await this.save();
    return game;
  }

  /**
   * Update game status
   */
  async updateGameStatus(gameId: string, status: GroupGame['status']): Promise<boolean> {
    const data = await this.load();
    const game = data.games.find((g) => g.id === gameId);

    if (game) {
      game.status = status;
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Cancel a game
   */
  async cancelGame(gameId: string): Promise<boolean> {
    return this.updateGameStatus(gameId, 'cancelled');
  }

  /**
   * Delete a game permanently
   */
  async deleteGame(gameId: string): Promise<boolean> {
    const data = await this.load();
    const initialLength = data.games.length;
    data.games = data.games.filter((g) => g.id !== gameId);

    if (data.games.length < initialLength) {
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Auto-complete past games
   */
  async autoCompletePastGames(): Promise<number> {
    const data = await this.load();
    const now = new Date();
    let completed = 0;

    for (const game of data.games) {
      if (game.status === 'open' || game.status === 'full') {
        const endTime = game.end_time ?? game.start_time;
        const endDateTime = new Date(`${game.date}T${endTime}`);
        if (endDateTime < now) {
          game.status = 'completed';
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
export const games = new GamesService();

// Export helper functions for tools
export async function getGames(): Promise<GroupGame[]> {
  return games.getGames();
}

export async function getUpcomingGames(): Promise<GroupGame[]> {
  return games.getFilteredGames({ upcoming_only: true });
}

export async function createGame(params: {
  venue_id: string;
  venue_name: string;
  court_name?: string;
  date: string;
  start_time: string;
  end_time?: string;
  max_players: number;
  invited_friends?: string[];
  booking_url?: string;
  notes?: string;
}): Promise<GroupGame> {
  return games.createGame(params);
}

export async function confirmPlayer(gameId: string, playerName: string): Promise<GroupGame | undefined> {
  return games.confirmPlayer(gameId, playerName);
}

export async function cancelGame(gameId: string): Promise<boolean> {
  return games.cancelGame(gameId);
}
