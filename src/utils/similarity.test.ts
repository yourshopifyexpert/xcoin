/**
 * Tests for string similarity utilities
 */

import {
  levenshteinDistance,
  calculateSimilarity,
  jaroWinklerSimilarity,
} from './similarity';

describe('Similarity Utilities', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'hello')).toBe(5);
    });

    it('should be case-insensitive', () => {
      expect(levenshteinDistance('Hello', 'hello')).toBe(0);
    });

    it('should calculate correct distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('timestamp', 'timestamp')).toBe(1);
    });

    it('should return high score for similar strings', () => {
      const score = calculateSimilarity('timestamp', 'Timestamp');
      expect(score).toBeGreaterThan(0.9);
    });

    it('should handle partial matches', () => {
      const score = calculateSimilarity('amount', 'total_amount');
      expect(score).toBeGreaterThan(0.65);
    });

    it('should return 0 for completely different strings', () => {
      const score = calculateSimilarity('xyz', 'abc');
      expect(score).toBeLessThan(0.5);
    });

    it('should be case-insensitive', () => {
      const score1 = calculateSimilarity('Date', 'date');
      const score2 = calculateSimilarity('Date', 'DATE');
      expect(score1).toBe(1);
      expect(score2).toBe(1);
    });
  });

  describe('jaroWinklerSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(jaroWinklerSimilarity('hello', 'hello')).toBe(1);
    });

    it('should handle empty strings', () => {
      expect(jaroWinklerSimilarity('', '')).toBe(1);
      expect(jaroWinklerSimilarity('hello', '')).toBe(0);
    });

    it('should give bonus for matching prefix', () => {
      const score1 = jaroWinklerSimilarity('martha', 'marhta');
      const score2 = jaroWinklerSimilarity('dixon', 'dickson');
      expect(score1).toBeGreaterThan(0.9);
      expect(score2).toBeGreaterThan(0.6);
    });

    it('should be better for short strings', () => {
      const jw = jaroWinklerSimilarity('Date', 'Dat');
      expect(jw).toBeGreaterThan(0.8);
    });
  });

  describe('Column name matching', () => {
    it('should match common column variations', () => {
      const testCases = [
        ['timestamp', 'Timestamp'],
        ['transaction_id', 'TransactionID'],
        ['from_amount', 'FromAmount'],
        ['to_currency', 'ToCurrency'],
        ['fee_currency', 'FeeCurrency'],
      ];

      testCases.forEach(([col1, col2]) => {
        const score = calculateSimilarity(col1, col2);
        expect(score).toBeGreaterThan(0.8);
      });
    });

    it('should match exchange-specific formats', () => {
      const testCases = [
        ['base-asset', 'base_asset'],
        ['quote-asset', 'quote_asset'],
        ['trade-id', 'tradeId'],
        ['fee-currency', 'feeCurrency'],
      ];

      testCases.forEach(([col1, col2]) => {
        const score = calculateSimilarity(col1, col2);
        expect(score).toBeGreaterThan(0.75);
      });
    });
  });
});
