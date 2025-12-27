/**
 * Unit tests for match generation utilities
 */

import { generateRoundRobinMatches } from './match-generation';

describe('Match Generation', () => {
  describe('generateRoundRobinMatches', () => {
    it('should return empty array for empty input', () => {
      const result = generateRoundRobinMatches([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for single player', () => {
      const result = generateRoundRobinMatches(['player-1']);
      expect(result).toEqual([]);
    });

    it('should generate one match for two players', () => {
      const result = generateRoundRobinMatches(['player-1', 'player-2']);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        playerA: 'player-1',
        playerB: 'player-2',
      });
    });

    it('should generate 3 matches for 3 players', () => {
      const result = generateRoundRobinMatches(['player-1', 'player-2', 'player-3']);
      expect(result).toHaveLength(3);
      
      // Verify all unique pairs
      const pairs = result.map((m) => `${m.playerA}-${m.playerB}`).sort();
      expect(pairs).toEqual(['player-1-player-2', 'player-1-player-3', 'player-2-player-3']);
    });

    it('should generate 6 matches for 4 players', () => {
      const result = generateRoundRobinMatches(['player-1', 'player-2', 'player-3', 'player-4']);
      expect(result).toHaveLength(6);
      
      // Verify all unique pairs
      const pairs = result.map((m) => `${m.playerA}-${m.playerB}`).sort();
      expect(pairs).toEqual([
        'player-1-player-2',
        'player-1-player-3',
        'player-1-player-4',
        'player-2-player-3',
        'player-2-player-4',
        'player-3-player-4',
      ]);
    });

    it('should generate 10 matches for 5 players', () => {
      const result = generateRoundRobinMatches([
        'player-1',
        'player-2',
        'player-3',
        'player-4',
        'player-5',
      ]);
      expect(result).toHaveLength(10);
      
      // Verify formula: n*(n-1)/2 = 5*4/2 = 10
      expect(result.length).toBe(10);
    });

    it('should ensure no duplicate matches', () => {
      const result = generateRoundRobinMatches(['player-1', 'player-2', 'player-3', 'player-4']);
      
      // Check for duplicates
      const pairs = result.map((m) => `${m.playerA}-${m.playerB}`).sort();
      const uniquePairs = [...new Set(pairs)];
      expect(pairs).toEqual(uniquePairs);
    });

    it('should ensure each player plays every other player exactly once', () => {
      const players = ['player-1', 'player-2', 'player-3', 'player-4'];
      const result = generateRoundRobinMatches(players);
      
      // For each player, count how many matches they're in
      players.forEach((player) => {
        const matchesForPlayer = result.filter(
          (m) => m.playerA === player || m.playerB === player
        );
        // Each player should play (n-1) matches
        expect(matchesForPlayer.length).toBe(players.length - 1);
      });
    });

    it('should handle players in different order', () => {
      const result1 = generateRoundRobinMatches(['player-1', 'player-2', 'player-3']);
      const result2 = generateRoundRobinMatches(['player-3', 'player-1', 'player-2']);
      
      // Should generate same number of matches
      expect(result1.length).toBe(result2.length);
      
      // Should have same pairs (order may differ)
      const pairs1 = result1.map((m) => [m.playerA, m.playerB].sort().join('-')).sort();
      const pairs2 = result2.map((m) => [m.playerA, m.playerB].sort().join('-')).sort();
      expect(pairs1).toEqual(pairs2);
    });

    it('should ensure playerA < playerB lexicographically', () => {
      const result = generateRoundRobinMatches(['player-1', 'player-2', 'player-3']);
      
      result.forEach((match) => {
        expect(match.playerA < match.playerB).toBe(true);
      });
    });

    it('should handle large number of players', () => {
      const players = Array.from({ length: 10 }, (_, i) => `player-${i + 1}`);
      const result = generateRoundRobinMatches(players);
      
      // Formula: n*(n-1)/2 = 10*9/2 = 45
      expect(result.length).toBe(45);
      
      // Verify no duplicates
      const pairs = result.map((m) => `${m.playerA}-${m.playerB}`).sort();
      const uniquePairs = [...new Set(pairs)];
      expect(pairs).toEqual(uniquePairs);
    });
  });
});

