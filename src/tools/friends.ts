/**
 * Friends Management MCP Tools
 *
 * Add, list, update, and remove friends for group game coordination.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getFriends, addFriend, removeFriend, findAvailableFriends, friends } from '../services/friends.js';
import type { Friend, SkillLevel } from '../types/index.js';

export const addFriendSchema = {
  name: z
    .string()
    .min(1)
    .describe('Friend\'s name'),
  email: z
    .string()
    .email()
    .optional()
    .describe('Friend\'s email address'),
  phone: z
    .string()
    .optional()
    .describe('Friend\'s phone number'),
  skill_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Padel skill level'),
  preferred_times: z
    .array(z.enum(['morning', 'afternoon', 'evening', 'weekend']))
    .optional()
    .describe('Preferred playing times'),
};

export const listFriendsSchema = {
  skill_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Filter by skill level'),
};

export const removeFriendSchema = {
  friend_id: z
    .string()
    .optional()
    .describe('Friend ID to remove'),
  name: z
    .string()
    .optional()
    .describe('Friend name to remove (if ID not provided)'),
};

export const findPlayersSchema = {
  time_preference: z
    .enum(['morning', 'afternoon', 'evening', 'weekend'])
    .optional()
    .describe('Filter by time preference'),
  skill_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Filter by skill level'),
};

export const updateFriendSchema = {
  friend_id: z
    .string()
    .describe('Friend ID to update'),
  name: z
    .string()
    .optional()
    .describe('Updated name'),
  email: z
    .string()
    .email()
    .optional()
    .describe('Updated email'),
  phone: z
    .string()
    .optional()
    .describe('Updated phone'),
  skill_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .describe('Updated skill level'),
  preferred_times: z
    .array(z.enum(['morning', 'afternoon', 'evening', 'weekend']))
    .optional()
    .describe('Updated preferred times'),
};

export function registerFriendsTools(server: McpServer): void {
  // Add a friend
  server.tool(
    'add_friend',
    'Add a friend/player to your contacts for group game coordination.',
    addFriendSchema,
    async ({ name, email, phone, skill_level, preferred_times }) => {
      const friend = await addFriend({
        name,
        email,
        phone,
        skill_level: skill_level as SkillLevel | undefined,
        preferred_times,
      });

      const skillInfo = friend.skill_level ? `\n- 🎯 Skill: ${friend.skill_level}` : '';
      const timesInfo = friend.preferred_times?.length
        ? `\n- 🕐 Prefers: ${friend.preferred_times.join(', ')}`
        : '';
      const contactInfo = [
        friend.email ? `📧 ${friend.email}` : '',
        friend.phone ? `📱 ${friend.phone}` : '',
      ].filter(Boolean).join(' | ');

      const summary = `## ✅ Friend Added!

**${friend.name}**
- 🆔 ID: \`${friend.id}\`${skillInfo}${timesInfo}
${contactInfo ? `- ${contactInfo}` : ''}

Use \`list_friends\` to see all your padel contacts.`;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(friend, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // List friends
  server.tool(
    'list_friends',
    'List all your padel friends/contacts.',
    listFriendsSchema,
    async ({ skill_level }) => {
      let friendsList = await getFriends();

      if (skill_level) {
        friendsList = friendsList.filter((f) => f.skill_level === skill_level);
      }

      if (friendsList.length === 0) {
        const filterText = skill_level ? ` with skill level "${skill_level}"` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `📭 No friends found${filterText}. Use \`add_friend\` to add padel contacts.`,
            },
          ],
        };
      }

      let summary = `## 👥 Your Padel Friends (${friendsList.length})\n\n`;

      // Group by skill level
      const bySkill = new Map<string, Friend[]>();
      for (const friend of friendsList) {
        const level = friend.skill_level ?? 'unset';
        const group = bySkill.get(level) ?? [];
        group.push(friend);
        bySkill.set(level, group);
      }

      for (const [level, group] of bySkill) {
        const levelEmoji = level === 'advanced' ? '🏆' : level === 'intermediate' ? '🎾' : level === 'beginner' ? '🌱' : '❓';
        summary += `### ${levelEmoji} ${level.charAt(0).toUpperCase() + level.slice(1)} (${group.length})\n\n`;

        for (const friend of group) {
          summary += formatFriendCard(friend);
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n```json\n' + JSON.stringify(friendsList, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // Remove a friend
  server.tool(
    'remove_friend',
    'Remove a friend from your contacts.',
    removeFriendSchema,
    async ({ friend_id, name }) => {
      let friendToRemove: Friend | undefined;

      if (friend_id) {
        friendToRemove = await friends.getFriend(friend_id);
      } else if (name) {
        friendToRemove = await friends.findFriendByName(name);
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: '❌ Please provide either a friend_id or name to remove.',
            },
          ],
        };
      }

      if (!friendToRemove) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Friend not found: ${friend_id ?? name}`,
            },
          ],
        };
      }

      await removeFriend(friendToRemove.id);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Removed **${friendToRemove.name}** from your contacts.`,
          },
        ],
      };
    }
  );

  // Find available players
  server.tool(
    'find_players',
    'Find friends available to play based on time preference and skill level.',
    findPlayersSchema,
    async ({ time_preference, skill_level }) => {
      const availableFriends = await findAvailableFriends({
        time_preference,
        skill_level: skill_level as SkillLevel | undefined,
      });

      if (availableFriends.length === 0) {
        const filters: string[] = [];
        if (time_preference) filters.push(time_preference);
        if (skill_level) filters.push(skill_level);
        const filterText = filters.length > 0 ? ` matching: ${filters.join(', ')}` : '';

        return {
          content: [
            {
              type: 'text' as const,
              text: `📭 No players found${filterText}. Add more friends with \`add_friend\`.`,
            },
          ],
        };
      }

      let summary = `## 🎾 Available Players (${availableFriends.length})\n\n`;

      if (time_preference) {
        summary += `**Time preference:** ${time_preference}\n`;
      }
      if (skill_level) {
        summary += `**Skill level:** ${skill_level}\n`;
      }
      summary += '\n';

      for (const friend of availableFriends) {
        summary += formatFriendCard(friend);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary,
          },
        ],
      };
    }
  );

  // Update a friend
  server.tool(
    'update_friend',
    'Update a friend\'s information.',
    updateFriendSchema,
    async ({ friend_id, name, email, phone, skill_level, preferred_times }) => {
      const updated = await friends.updateFriend(friend_id, {
        name,
        email,
        phone,
        skill_level: skill_level as SkillLevel | undefined,
        preferred_times,
      });

      if (!updated) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Friend not found: \`${friend_id}\``,
            },
          ],
        };
      }

      const changes: string[] = [];
      if (name !== undefined) changes.push(`Name: ${name}`);
      if (email !== undefined) changes.push(`Email: ${email}`);
      if (phone !== undefined) changes.push(`Phone: ${phone}`);
      if (skill_level !== undefined) changes.push(`Skill: ${skill_level}`);
      if (preferred_times !== undefined) changes.push(`Times: ${preferred_times.join(', ')}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Updated **${updated.name}**

**Changes:**
${changes.map((c) => `- ${c}`).join('\n')}

\`\`\`json
${JSON.stringify(updated, null, 2)}
\`\`\``,
          },
        ],
      };
    }
  );
}

function formatFriendCard(friend: Friend): string {
  const skillEmoji = friend.skill_level === 'advanced' ? '🏆' : friend.skill_level === 'intermediate' ? '🎾' : friend.skill_level === 'beginner' ? '🌱' : '';

  let card = `**${friend.name}** ${skillEmoji}\n`;

  const contact: string[] = [];
  if (friend.email) contact.push(`📧 ${friend.email}`);
  if (friend.phone) contact.push(`📱 ${friend.phone}`);
  if (contact.length > 0) {
    card += `${contact.join(' | ')}\n`;
  }

  if (friend.preferred_times?.length) {
    card += `🕐 Prefers: ${friend.preferred_times.join(', ')}\n`;
  }

  card += `\`ID: ${friend.id.substring(0, 8)}...\`\n\n`;

  return card;
}
