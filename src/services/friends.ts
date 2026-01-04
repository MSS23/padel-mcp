/**
 * Friends Service
 *
 * Persistent storage for player/friend management.
 * Friends are stored in a JSON file for group game coordination.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type { Friend, SkillLevel } from '../types/index.js';

interface FriendsData {
  friends: Friend[];
}

const DEFAULT_DATA: FriendsData = {
  friends: [],
};

class FriendsService {
  private friendsPath: string;
  private data: FriendsData | null = null;

  constructor() {
    const baseDir = join(homedir(), '.padel-finder');
    this.friendsPath = join(baseDir, 'friends.json');
  }

  /**
   * Load friends from disk
   */
  async load(): Promise<FriendsData> {
    if (this.data) {
      return this.data;
    }

    try {
      const content = await readFile(this.friendsPath, 'utf-8');
      this.data = { ...DEFAULT_DATA, ...JSON.parse(content) };
    } catch {
      this.data = { ...DEFAULT_DATA };
    }

    return this.data!;
  }

  /**
   * Save friends to disk
   */
  async save(): Promise<void> {
    if (!this.data) {
      return;
    }

    try {
      await mkdir(dirname(this.friendsPath), { recursive: true });
      await writeFile(this.friendsPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save friends:', error);
    }
  }

  /**
   * Get all friends
   */
  async getFriends(): Promise<Friend[]> {
    const data = await this.load();
    return data.friends;
  }

  /**
   * Get a friend by ID
   */
  async getFriend(friendId: string): Promise<Friend | undefined> {
    const data = await this.load();
    return data.friends.find((f) => f.id === friendId);
  }

  /**
   * Find a friend by name (case-insensitive partial match)
   */
  async findFriendByName(name: string): Promise<Friend | undefined> {
    const data = await this.load();
    const lowerName = name.toLowerCase();
    return data.friends.find((f) =>
      f.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Add a new friend
   */
  async addFriend(params: {
    name: string;
    email?: string;
    phone?: string;
    skill_level?: SkillLevel;
    preferred_times?: ('morning' | 'afternoon' | 'evening' | 'weekend')[];
  }): Promise<Friend> {
    const data = await this.load();

    // Check for duplicate by name
    const existing = data.friends.find(
      (f) => f.name.toLowerCase() === params.name.toLowerCase()
    );

    if (existing) {
      // Update existing friend
      if (params.email) existing.email = params.email;
      if (params.phone) existing.phone = params.phone;
      if (params.skill_level) existing.skill_level = params.skill_level;
      if (params.preferred_times) existing.preferred_times = params.preferred_times;
      await this.save();
      return existing;
    }

    const friend: Friend = {
      id: randomUUID(),
      name: params.name,
      email: params.email,
      phone: params.phone,
      skill_level: params.skill_level,
      preferred_times: params.preferred_times,
      added_at: new Date().toISOString(),
    };

    data.friends.push(friend);
    await this.save();
    return friend;
  }

  /**
   * Update a friend
   */
  async updateFriend(
    friendId: string,
    updates: Partial<Omit<Friend, 'id' | 'added_at'>>
  ): Promise<Friend | undefined> {
    const data = await this.load();
    const friend = data.friends.find((f) => f.id === friendId);

    if (friend) {
      if (updates.name !== undefined) friend.name = updates.name;
      if (updates.email !== undefined) friend.email = updates.email;
      if (updates.phone !== undefined) friend.phone = updates.phone;
      if (updates.skill_level !== undefined) friend.skill_level = updates.skill_level;
      if (updates.preferred_times !== undefined) friend.preferred_times = updates.preferred_times;
      await this.save();
      return friend;
    }

    return undefined;
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<boolean> {
    const data = await this.load();
    const initialLength = data.friends.length;
    data.friends = data.friends.filter((f) => f.id !== friendId);

    if (data.friends.length < initialLength) {
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Find friends available for a given time
   */
  async findAvailableFriends(options: {
    time_preference?: 'morning' | 'afternoon' | 'evening' | 'weekend';
    skill_level?: SkillLevel;
  }): Promise<Friend[]> {
    const data = await this.load();
    let friends = [...data.friends];

    if (options.time_preference) {
      friends = friends.filter((f) =>
        f.preferred_times?.includes(options.time_preference!) ?? true
      );
    }

    if (options.skill_level) {
      friends = friends.filter((f) =>
        f.skill_level === options.skill_level || !f.skill_level
      );
    }

    return friends;
  }

  /**
   * Get friends by IDs
   */
  async getFriendsByIds(ids: string[]): Promise<Friend[]> {
    const data = await this.load();
    return data.friends.filter((f) => ids.includes(f.id));
  }

  /**
   * Get friend count
   */
  async getCount(): Promise<number> {
    const data = await this.load();
    return data.friends.length;
  }
}

// Export singleton instance
export const friends = new FriendsService();

// Export helper functions for tools
export async function getFriends(): Promise<Friend[]> {
  return friends.getFriends();
}

export async function addFriend(params: {
  name: string;
  email?: string;
  phone?: string;
  skill_level?: SkillLevel;
  preferred_times?: ('morning' | 'afternoon' | 'evening' | 'weekend')[];
}): Promise<Friend> {
  return friends.addFriend(params);
}

export async function removeFriend(friendId: string): Promise<boolean> {
  return friends.removeFriend(friendId);
}

export async function findAvailableFriends(options: {
  time_preference?: 'morning' | 'afternoon' | 'evening' | 'weekend';
  skill_level?: SkillLevel;
}): Promise<Friend[]> {
  return friends.findAvailableFriends(options);
}
