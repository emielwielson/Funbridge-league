/**
 * Unit tests for match calculation utilities
 */

import {
  calculateMatchOutcome,
  calculateMatchPoints,
  calculateFinalScore,
  calculateScoreDifference,
} from './match-calculations';
import type { MatchOutcome } from '@/lib/types/match';

describe('Match Calculations', () => {
  describe('calculateMatchOutcome', () => {
    it('should return player_a_wins when Player A has higher final score', () => {
      const outcome = calculateMatchOutcome(10, 5, 8, 5);
      expect(outcome).toBe('player_a_wins');
    });

    it('should return player_b_wins when Player B has higher final score', () => {
      const outcome = calculateMatchOutcome(8, 5, 10, 5);
      expect(outcome).toBe('player_b_wins');
    });

    it('should return tie when final scores are equal', () => {
      const outcome = calculateMatchOutcome(10, 5, 10, 5);
      expect(outcome).toBe('tie');
    });

    it('should handle handicaps correctly', () => {
      // Player A: 10 + 5 = 15, Player B: 12 + 2 = 14
      const outcome = calculateMatchOutcome(10, 5, 12, 2);
      expect(outcome).toBe('player_a_wins');
    });

    it('should handle negative IMP scores', () => {
      const outcome = calculateMatchOutcome(-5, 10, -3, 10);
      // Player A: -5 + 10 = 5, Player B: -3 + 10 = 7
      expect(outcome).toBe('player_b_wins');
    });

    it('should handle zero scores', () => {
      const outcome = calculateMatchOutcome(0, 0, 0, 0);
      expect(outcome).toBe('tie');
    });

    it('should handle large handicaps', () => {
      const outcome = calculateMatchOutcome(5, 100, 10, 90);
      // Player A: 5 + 100 = 105, Player B: 10 + 90 = 100
      expect(outcome).toBe('player_a_wins');
    });
  });

  describe('calculateMatchPoints', () => {
    it('should return 1 point for a win', () => {
      const pointsA = calculateMatchPoints('player_a_wins', 'a');
      const pointsB = calculateMatchPoints('player_b_wins', 'b');
      
      expect(pointsA).toBe(1);
      expect(pointsB).toBe(1);
    });

    it('should return 0 points for a loss', () => {
      const pointsA = calculateMatchPoints('player_b_wins', 'a');
      const pointsB = calculateMatchPoints('player_a_wins', 'b');
      
      expect(pointsA).toBe(0);
      expect(pointsB).toBe(0);
    });

    it('should return 0.5 points for a tie', () => {
      const pointsA = calculateMatchPoints('tie', 'a');
      const pointsB = calculateMatchPoints('tie', 'b');
      
      expect(pointsA).toBe(0.5);
      expect(pointsB).toBe(0.5);
    });

    it('should handle all outcome combinations correctly', () => {
      expect(calculateMatchPoints('player_a_wins', 'a')).toBe(1);
      expect(calculateMatchPoints('player_a_wins', 'b')).toBe(0);
      expect(calculateMatchPoints('player_b_wins', 'a')).toBe(0);
      expect(calculateMatchPoints('player_b_wins', 'b')).toBe(1);
      expect(calculateMatchPoints('tie', 'a')).toBe(0.5);
      expect(calculateMatchPoints('tie', 'b')).toBe(0.5);
    });
  });

  describe('calculateFinalScore', () => {
    it('should add IMP score and handicap', () => {
      const finalScore = calculateFinalScore(10, 5);
      expect(finalScore).toBe(15);
    });

    it('should handle zero IMP score', () => {
      const finalScore = calculateFinalScore(0, 5);
      expect(finalScore).toBe(5);
    });

    it('should handle zero handicap', () => {
      const finalScore = calculateFinalScore(10, 0);
      expect(finalScore).toBe(10);
    });

    it('should handle negative IMP scores', () => {
      const finalScore = calculateFinalScore(-5, 10);
      expect(finalScore).toBe(5);
    });

    it('should handle negative handicaps', () => {
      const finalScore = calculateFinalScore(10, -5);
      expect(finalScore).toBe(5);
    });

    it('should handle large values', () => {
      const finalScore = calculateFinalScore(100, 50);
      expect(finalScore).toBe(150);
    });
  });

  describe('calculateScoreDifference', () => {
    it('should return positive difference when Player A wins', () => {
      const difference = calculateScoreDifference(10, 5, 8, 5);
      // Player A: 10 + 5 = 15, Player B: 8 + 5 = 13, Difference: 15 - 13 = 2
      expect(difference).toBe(2);
    });

    it('should return negative difference when Player B wins', () => {
      const difference = calculateScoreDifference(8, 5, 10, 5);
      // Player A: 8 + 5 = 13, Player B: 10 + 5 = 15, Difference: 13 - 15 = -2
      expect(difference).toBe(-2);
    });

    it('should return zero for a tie', () => {
      const difference = calculateScoreDifference(10, 5, 10, 5);
      expect(difference).toBe(0);
    });

    it('should handle handicaps correctly', () => {
      const difference = calculateScoreDifference(10, 5, 12, 2);
      // Player A: 10 + 5 = 15, Player B: 12 + 2 = 14, Difference: 15 - 14 = 1
      expect(difference).toBe(1);
    });

    it('should handle negative IMP scores', () => {
      const difference = calculateScoreDifference(-5, 10, -3, 10);
      // Player A: -5 + 10 = 5, Player B: -3 + 10 = 7, Difference: 5 - 7 = -2
      expect(difference).toBe(-2);
    });

    it('should handle large differences', () => {
      const difference = calculateScoreDifference(100, 50, 10, 5);
      // Player A: 100 + 50 = 150, Player B: 10 + 5 = 15, Difference: 150 - 15 = 135
      expect(difference).toBe(135);
    });
  });
});

