/**
 * Group Games MCP Tools
 *
 * Create and manage group padel games with player coordination.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createGame, getUpcomingGames, confirmPlayer, cancelGame, games } from '../services/games.js';
import { friends } from '../services/friends.js';
import { generateSlotBookingUrl } from '../utils/booking.js';
import type { GroupGame } from '../types/index.js';

export const createGroupGameSchema = {
  venue_id: z
    .string()
    .describe('The venue ID'),
  venue_name: z
    .string()
    .describe('Name of the venue'),
  court_name: z
    .string()
    .optional()
    .describe('Name of the court (if known)'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Date of the game (YYYY-MM-DD)'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe('Start time (HH:mm)'),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .describe('End time (HH:mm)'),
  max_players: z
    .number()
    .int()
    .min(2)
    .max(8)
    .optional()
    .default(4)
    .describe('Maximum players (default: 4 for padel doubles)'),
  invite_friends: z
    .array(z.string())
    .optional()
    .describe('Friend names or IDs to invite'),
  notes: z
    .string()
    .optional()
    .describe('Additional notes'),
};

export const listGamesSchema = {
  include_past: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include past/completed games (default: false)'),
};

export const gameStatusSchema = {
  game_id: z
    .string()
    .describe('The game ID'),
};

export const confirmPlayerSchema = {
  game_id: z
    .string()
    .describe('The game ID'),
  player_name: z
    .string()
    .describe('Name of the player confirming'),
};

export const cancelGameSchema = {
  game_id: z
    .string()
    .describe('The game ID to cancel'),
};

export const addPlayersSchema = {
  game_id: z
    .string()
    .describe('The game ID'),
  player_names: z
    .array(z.string())
    .describe('Names of players to invite'),
};

export function registerGroupGames(server: McpServer): void {
  // Create a group game
  server.tool(
    'create_group_game',
    'Create a new group padel game and invite friends. You\'re automatically confirmed as a player.',
    createGroupGameSchema,
    async ({ venue_id, venue_name, court_name, date, start_time, end_time, max_players, invite_friends, notes }) => {
      const maxPlayerCount = max_players ?? 4;

      // Resolve friend names to actual names
      let invitedFriends: string[] = [];
      if (invite_friends && invite_friends.length > 0) {
        for (const nameOrId of invite_friends) {
          const friend = await friends.getFriend(nameOrId) ?? await friends.findFriendByName(nameOrId);
          if (friend) {
            invitedFriends.push(friend.name);
          } else {
            // Use the name as-is if not found in friends
            invitedFriends.push(nameOrId);
          }
        }
      }

      // Generate booking URL
      const bookingUrl = generateSlotBookingUrl({
        venueId: venue_id,
        startTime: `${date}T${start_time}:00`,
        platform: 'playtomic',
      });

      const game = await createGame({
        venue_id,
        venue_name,
        court_name,
        date,
        start_time,
        end_time,
        max_players: maxPlayerCount,
        invited_friends: invitedFriends,
        booking_url: bookingUrl ?? undefined,
        notes,
      });

      const spotsLeft = game.max_players - game.confirmed_players.length;
      const pendingList = game.pending_invites.length > 0
        ? `\n- 📨 Pending invites: ${game.pending_invites.join(', ')}`
        : '';

      const summary = `## 🎾 Group Game Created!

**Game Details:**
- 🆔 ID: \`${game.id}\`
- 🏢 Venue: ${game.venue_name}${game.court_name ? ` (${game.court_name})` : ''}
- 📅 Date: ${game.date}
- 🕐 Time: ${game.start_time}${game.end_time ? ` - ${game.end_time}` : ''}
- 👥 Players: ${game.confirmed_players.length}/${game.max_players} (${spotsLeft} spots left)
- ✅ Confirmed: ${game.confirmed_players.join(', ')}${pendingList}

${game.booking_url ? `[🎾 Book on Playtomic](${game.booking_url})` : ''}

**Next steps:**
- Share the game ID with friends: \`${game.id}\`
- They can confirm with: \`confirm_for_game\`
- Check status with: \`game_status\``;

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n\n```json\n' + JSON.stringify(game, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // List games
  server.tool(
    'list_games',
    'List your group padel games.',
    listGamesSchema,
    async ({ include_past }) => {
      const includePast = include_past ?? false;

      // Auto-complete past games
      await games.autoCompletePastGames();

      const gamesList = includePast
        ? await games.getGames()
        : await getUpcomingGames();

      if (gamesList.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `📭 No ${includePast ? '' : 'upcoming '}games found. Use \`create_group_game\` to organize one!`,
            },
          ],
        };
      }

      let summary = `## 🎾 Your Group Games\n\n`;

      // Group by status
      const open = gamesList.filter((g) => g.status === 'open');
      const full = gamesList.filter((g) => g.status === 'full');
      const completed = gamesList.filter((g) => g.status === 'completed');
      const cancelled = gamesList.filter((g) => g.status === 'cancelled');

      if (open.length > 0) {
        summary += `### 🟢 Open (${open.length})\n\n`;
        for (const game of open) {
          summary += formatGameCard(game);
        }
      }

      if (full.length > 0) {
        summary += `### 🟡 Full (${full.length})\n\n`;
        for (const game of full) {
          summary += formatGameCard(game);
        }
      }

      if (includePast && completed.length > 0) {
        summary += `### ✅ Completed (${completed.length})\n\n`;
        for (const game of completed) {
          summary += formatGameCard(game);
        }
      }

      if (includePast && cancelled.length > 0) {
        summary += `### ❌ Cancelled (${cancelled.length})\n\n`;
        for (const game of cancelled) {
          summary += formatGameCard(game);
        }
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

  // Get game status
  server.tool(
    'game_status',
    'Get the current status of a group game.',
    gameStatusSchema,
    async ({ game_id }) => {
      const game = await games.getGame(game_id);

      if (!game) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Game not found: \`${game_id}\``,
            },
          ],
        };
      }

      const spotsLeft = game.max_players - game.confirmed_players.length;
      const statusEmoji = game.status === 'open' ? '🟢' : game.status === 'full' ? '🟡' : game.status === 'completed' ? '✅' : '❌';

      let summary = `## ${statusEmoji} Game Status: ${game.status.toUpperCase()}\n\n`;
      summary += `**${game.venue_name}**${game.court_name ? ` - ${game.court_name}` : ''}\n`;
      summary += `📅 ${game.date} at ${game.start_time}${game.end_time ? ` - ${game.end_time}` : ''}\n\n`;

      summary += `### 👥 Players (${game.confirmed_players.length}/${game.max_players})\n\n`;

      if (game.confirmed_players.length > 0) {
        summary += `**Confirmed:**\n`;
        for (const player of game.confirmed_players) {
          summary += `- ✅ ${player}\n`;
        }
      }

      if (game.pending_invites.length > 0) {
        summary += `\n**Pending:**\n`;
        for (const player of game.pending_invites) {
          summary += `- ⏳ ${player}\n`;
        }
      }

      if (spotsLeft > 0 && game.status === 'open') {
        summary += `\n🆓 **${spotsLeft} spot(s) available!**\n`;
      }

      if (game.notes) {
        summary += `\n📝 Notes: ${game.notes}\n`;
      }

      if (game.booking_url) {
        summary += `\n[🎾 View on Playtomic](${game.booking_url})\n`;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: summary + '\n```json\n' + JSON.stringify(game, null, 2) + '\n```',
          },
        ],
      };
    }
  );

  // Confirm a player
  server.tool(
    'confirm_for_game',
    'Confirm a player for a group game.',
    confirmPlayerSchema,
    async ({ game_id, player_name }) => {
      const game = await games.getGame(game_id);

      if (!game) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Game not found: \`${game_id}\``,
            },
          ],
        };
      }

      if (game.status === 'cancelled') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ This game has been cancelled.`,
            },
          ],
        };
      }

      if (game.confirmed_players.includes(player_name)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ **${player_name}** is already confirmed for this game.`,
            },
          ],
        };
      }

      if (game.confirmed_players.length >= game.max_players) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ This game is full (${game.max_players} players). No more spots available.`,
            },
          ],
        };
      }

      const updated = await confirmPlayer(game_id, player_name);

      if (!updated) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Failed to confirm player.`,
            },
          ],
        };
      }

      const spotsLeft = updated.max_players - updated.confirmed_players.length;

      return {
        content: [
          {
            type: 'text' as const,
            text: `## ✅ ${player_name} Confirmed!

**${updated.venue_name}** on ${updated.date} at ${updated.start_time}

**Players (${updated.confirmed_players.length}/${updated.max_players}):**
${updated.confirmed_players.map((p) => `- ✅ ${p}`).join('\n')}

${spotsLeft > 0 ? `🆓 ${spotsLeft} spot(s) remaining` : '🎉 Game is now full!'}`,
          },
        ],
      };
    }
  );

  // Cancel a game
  server.tool(
    'cancel_game',
    'Cancel a group game.',
    cancelGameSchema,
    async ({ game_id }) => {
      const game = await games.getGame(game_id);

      if (!game) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Game not found: \`${game_id}\``,
            },
          ],
        };
      }

      if (game.status === 'cancelled') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ This game is already cancelled.`,
            },
          ],
        };
      }

      await cancelGame(game_id);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Game cancelled: **${game.venue_name}** on ${game.date} at ${game.start_time}

Players who were confirmed: ${game.confirmed_players.join(', ')}

⚠️ **Note:** Remember to cancel any actual booking on Playtomic separately.`,
          },
        ],
      };
    }
  );

  // Add players to a game
  server.tool(
    'invite_to_game',
    'Add more players to a group game\'s invite list.',
    addPlayersSchema,
    async ({ game_id, player_names }) => {
      const game = await games.getGame(game_id);

      if (!game) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Game not found: \`${game_id}\``,
            },
          ],
        };
      }

      if (game.status === 'cancelled') {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ This game has been cancelled.`,
            },
          ],
        };
      }

      // Resolve friend names
      const resolvedNames: string[] = [];
      for (const nameOrId of player_names) {
        const friend = await friends.getFriend(nameOrId) ?? await friends.findFriendByName(nameOrId);
        if (friend) {
          resolvedNames.push(friend.name);
        } else {
          resolvedNames.push(nameOrId);
        }
      }

      const updated = await games.addInvites(game_id, resolvedNames);

      if (!updated) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Failed to add players.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Invited ${resolvedNames.length} player(s) to the game!

**Pending invites:** ${updated.pending_invites.join(', ')}

Share the game ID with them: \`${game_id}\``,
          },
        ],
      };
    }
  );
}

function formatGameCard(game: GroupGame): string {
  const spotsLeft = game.max_players - game.confirmed_players.length;
  const statusEmoji = game.status === 'open' ? '🟢' : game.status === 'full' ? '🟡' : game.status === 'completed' ? '✅' : '❌';

  let card = `${statusEmoji} **${game.venue_name}**\n`;
  card += `📅 ${game.date} at ${game.start_time}${game.end_time ? ` - ${game.end_time}` : ''}\n`;
  card += `👥 ${game.confirmed_players.length}/${game.max_players} players`;

  if (spotsLeft > 0 && game.status === 'open') {
    card += ` (${spotsLeft} spots left)`;
  }
  card += '\n';

  card += `✅ ${game.confirmed_players.join(', ')}\n`;

  if (game.pending_invites.length > 0) {
    card += `⏳ Pending: ${game.pending_invites.join(', ')}\n`;
  }

  card += `\`ID: ${game.id.substring(0, 8)}...\`\n\n`;

  return card;
}
