/**
 * Unit tests for rankings calculation utilities
 */

import {
  calculatePlayerStats,
  calculateRankingsForDivision,
  sortRankings,
} from './rankings';
import type { MatchWithResult } from '@/lib/types/match';

describe('calculatePlayerStats', () => {
  it('should calculate stats for a player with wins, losses, and ties', () => {
    const matches: MatchWithResult[] = [
      {
        id: '1',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player1',
        player_b_id: 'player2',
        created_at: '2024-01-01',
        player_a_name: 'Player 1',
        player_b_name: 'Player 2',
        player_a_handicap: 5,
        player_b_handicap: 0,
        result: {
          id: 'r1',
          match_id: '1',
          player_a_imp_score: 10,
          player_b_imp_score: 5,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
      {
        id: '2',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player1',
        player_b_id: 'player3',
        created_at: '2024-01-01',
        player_a_name: 'Player 1',
        player_b_name: 'Player 3',
        player_a_handicap: 5,
        player_b_handicap: 3,
        result: {
          id: 'r2',
          match_id: '2',
          player_a_imp_score: 5,
          player_b_imp_score: 10,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
      {
        id: '3',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player2',
        player_b_id: 'player1',
        created_at: '2024-01-01',
        player_a_name: 'Player 2',
        player_b_name: 'Player 1',
        player_a_handicap: 0,
        player_b_handicap: 5,
        result: {
          id: 'r3',
          match_id: '3',
          player_a_imp_score: 10,
          player_b_imp_score: 10,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
    ];

    const stats = calculatePlayerStats(matches, 'player1', 5);

    // Player 1:
    // Match 1: wins (10+5 = 15 vs 5+0 = 5) -> +1 point, +10 difference
    // Match 2: loses (5+5 = 10 vs 10+3 = 13) -> +0 points, -3 difference
    // Match 3: ties (10+5 = 15 vs 10+0 = 10) -> +0.5 points, +5 difference
    // Total: 1.5 points, 12 difference (15-3+5 = 17? Let me recalculate)
    // Actually: won = 15 + 13 + 15 = 43, lost = 5 + 10 + 10 = 25, diff = 18
    expect(stats.matchesPlayed).toBe(3);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.ties).toBe(1);
    expect(stats.matchPoints).toBe(1.5);
    // Final score difference: (15 + 13 + 15) - (5 + 10 + 10) = 43 - 25 = 18
    expect(stats.finalScoreDifference).toBe(18);
  });

  it('should return zeros for a player with no matches', () => {
    const matches: MatchWithResult[] = [];
    const stats = calculatePlayerStats(matches, 'player1', 5);

    expect(stats.matchesPlayed).toBe(0);
    expect(stats.wins).toBe(0);
    expect(stats.losses).toBe(0);
    expect(stats.ties).toBe(0);
    expect(stats.matchPoints).toBe(0);
    expect(stats.finalScoreDifference).toBe(0);
  });

  it('should only count matches with results', () => {
    const matches: MatchWithResult[] = [
      {
        id: '1',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player1',
        player_b_id: 'player2',
        created_at: '2024-01-01',
        player_a_name: 'Player 1',
        player_b_name: 'Player 2',
        player_a_handicap: 5,
        player_b_handicap: 0,
        result: {
          id: 'r1',
          match_id: '1',
          player_a_imp_score: 10,
          player_b_imp_score: 5,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
      {
        id: '2',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player1',
        player_b_id: 'player3',
        created_at: '2024-01-01',
        player_a_name: 'Player 1',
        player_b_name: 'Player 3',
        player_a_handicap: 5,
        player_b_handicap: 3,
        // No result
      },
    ];

    const stats = calculatePlayerStats(matches, 'player1', 5);

    expect(stats.matchesPlayed).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.matchPoints).toBe(1);
  });

  it('should handle player as player B correctly', () => {
    const matches: MatchWithResult[] = [
      {
        id: '1',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player2',
        player_b_id: 'player1',
        created_at: '2024-01-01',
        player_a_name: 'Player 2',
        player_b_name: 'Player 1',
        player_a_handicap: 0,
        player_b_handicap: 5,
        result: {
          id: 'r1',
          match_id: '1',
          player_a_imp_score: 5,
          player_b_imp_score: 10,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
    ];

    const stats = calculatePlayerStats(matches, 'player1', 5);

    // Player 1 is player B, wins (10+5 = 15 vs 5+0 = 5)
    expect(stats.matchesPlayed).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.matchPoints).toBe(1);
    expect(stats.finalScoreDifference).toBe(10); // 15 - 5
  });
});

describe('calculateRankingsForDivision', () => {
  it('should calculate rankings for all players in a division', () => {
    const matches: MatchWithResult[] = [
      {
        id: '1',
        league_id: 'league1',
        division_id: 'div1',
        player_a_id: 'player1',
        player_b_id: 'player2',
        created_at: '2024-01-01',
        player_a_name: 'Player 1',
        player_b_name: 'Player 2',
        player_a_handicap: 5,
        player_b_handicap: 0,
        result: {
          id: 'r1',
          match_id: '1',
          player_a_imp_score: 10,
          player_b_imp_score: 5,
          entered_by_user_id: 'player1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
    ];

    const players = [
      { id: 'player1', name: 'Player 1', handicap: 5 },
      { id: 'player2', name: 'Player 2', handicap: 0 },
    ];

    const rankings = calculateRankingsForDivision(matches, players);

    expect(rankings).toHaveLength(2);
    expect(rankings[0].playerId).toBe('player1');
    expect(rankings[0].matchesPlayed).toBe(1);
    expect(rankings[0].wins).toBe(1);
    expect(rankings[1].playerId).toBe('player2');
    expect(rankings[1].matchesPlayed).toBe(1);
    expect(rankings[1].losses).toBe(1);
  });

  it('should handle division with no matches', () => {
    const matches: MatchWithResult[] = [];
    const players = [
      { id: 'player1', name: 'Player 1', handicap: 5 },
      { id: 'player2', name: 'Player 2', handicap: 0 },
    ];

    const rankings = calculateRankingsForDivision(matches, players);

    expect(rankings).toHaveLength(2);
    expect(rankings[0].matchesPlayed).toBe(0);
    expect(rankings[1].matchesPlayed).toBe(0);
  });
});

describe('sortRankings', () => {
  it('should sort by match points descending', () => {
    const rankings = [
      {
        playerId: 'player1',
        playerName: 'Player 1',
        handicap: 5,
        matchesPlayed: 2,
        wins: 1,
        ties: 0,
        losses: 1,
        matchPoints: 1,
        finalScoreDifference: 10,
      },
      {
        playerId: 'player2',
        playerName: 'Player 2',
        handicap: 0,
        matchesPlayed: 2,
        wins: 2,
        ties: 0,
        losses: 0,
        matchPoints: 2,
        finalScoreDifference: 5,
      },
    ];

    const sorted = sortRankings(rankings);

    expect(sorted[0].playerId).toBe('player2');
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].playerId).toBe('player1');
    expect(sorted[1].rank).toBe(2);
  });

  it('should use final score difference as tiebreaker', () => {
    const rankings = [
      {
        playerId: 'player1',
        playerName: 'Player 1',
        handicap: 5,
        matchesPlayed: 2,
        wins: 1,
        ties: 0,
        losses: 1,
        matchPoints: 1,
        finalScoreDifference: 5,
      },
      {
        playerId: 'player2',
        playerName: 'Player 2',
        handicap: 0,
        matchesPlayed: 2,
        wins: 1,
        ties: 0,
        losses: 1,
        matchPoints: 1,
        finalScoreDifference: 10,
      },
    ];

    const sorted = sortRankings(rankings);

    expect(sorted[0].playerId).toBe('player2');
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].playerId).toBe('player1');
    expect(sorted[1].rank).toBe(2);
  });

  it('should assign same rank to players with identical stats', () => {
    const rankings = [
      {
        playerId: 'player1',
        playerName: 'Player 1',
        handicap: 5,
        matchesPlayed: 2,
        wins: 1,
        ties: 0,
        losses: 1,
        matchPoints: 1,
        finalScoreDifference: 10,
      },
      {
        playerId: 'player2',
        playerName: 'Player 2',
        handicap: 0,
        matchesPlayed: 2,
        wins: 1,
        ties: 0,
        losses: 1,
        matchPoints: 1,
        finalScoreDifference: 10,
      },
      {
        playerId: 'player3',
        playerName: 'Player 3',
        handicap: 3,
        matchesPlayed: 2,
        wins: 0,
        ties: 0,
        losses: 2,
        matchPoints: 0,
        finalScoreDifference: -5,
      },
    ];

    const sorted = sortRankings(rankings);

    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(1); // Same rank
    expect(sorted[2].rank).toBe(3); // Next rank skipped
  });

  it('should handle empty rankings array', () => {
    const rankings: any[] = [];
    const sorted = sortRankings(rankings);

    expect(sorted).toHaveLength(0);
  });
});

