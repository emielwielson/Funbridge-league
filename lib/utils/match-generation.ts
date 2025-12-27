/**
 * Match generation utilities
 * Round-robin algorithm to generate matches where each player plays every other player exactly once
 */

export interface MatchPair {
  playerA: string;
  playerB: string;
}

/**
 * Generate round-robin matches for a list of players
 * Each player plays every other player exactly once
 * @param playerIds Array of player IDs in a division
 * @returns Array of unique player pairs
 */
export function generateRoundRobinMatches(playerIds: string[]): MatchPair[] {
  // Edge cases
  if (playerIds.length < 2) {
    return [];
  }

  // If only 2 players, return one match
  if (playerIds.length === 2) {
    return [{ playerA: playerIds[0], playerB: playerIds[1] }];
  }

  // Generate all combinations where playerA < playerB (lexicographically)
  // This ensures no duplicate matches and each pair appears exactly once
  const matches: MatchPair[] = [];

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      // Sort IDs to ensure consistent ordering (playerA < playerB)
      const [playerA, playerB] = [playerIds[i], playerIds[j]].sort();
      matches.push({ playerA, playerB });
    }
  }

  return matches;
}

