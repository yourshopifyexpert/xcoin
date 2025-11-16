/**
 * Tests for Advanced Classifier v3
 * Tests context-aware classification, data type analysis, and advanced scoring
 */

import classifierV3 from './classifier-v3';
import {
  detectDataType,
  inferColumnTypeFromData,
  DataType,
} from './utils/similarity';
import {
  inferTransactionType,
  inferColumnTransactionType,
  inferDirectionFromAmounts,
  inferTransactionTypeFromFields,
  isSwapTransaction,
} from './utils/transaction-inference';

describe('Advanced Classifier v3', () => {
  afterEach(() => {
    classifierV3.clearCache();
  });

  describe('Data Type Detection', () => {
    test('detects timestamps correctly', () => {
      expect(detectDataType('2024-01-15')).toBe(DataType.TIMESTAMP);
      expect(detectDataType('2024-01-15T10:30:00Z')).toBe(DataType.TIMESTAMP);
      expect(detectDataType('1705318200')).toBe(DataType.TIMESTAMP);
    });

    test('detects numbers correctly', () => {
      expect(detectDataType('123.45')).toBe(DataType.NUMBER);
      expect(detectDataType('0.5')).toBe(DataType.NUMBER);
      expect(detectDataType('-1234.567')).toBe(DataType.NUMBER);
      expect(detectDataType('1.23e-4')).toBe(DataType.NUMBER);
    });

    test('detects currencies correctly', () => {
      expect(detectDataType('BTC')).toBe(DataType.CURRENCY);
      expect(detectDataType('USDT')).toBe(DataType.CURRENCY);
      expect(detectDataType('ETH')).toBe(DataType.CURRENCY);
    });

    test('detects addresses correctly', () => {
      expect(
        detectDataType('0x742d35Cc6634C0532925a3b844Bc9e7595f42562')
      ).toBe(DataType.ADDRESS);
    });

    test('detects hashes correctly', () => {
      expect(
        detectDataType(
          '0x' + 'a'.repeat(64)
        )
      ).toBe(DataType.HASH);
    });
  });

  describe('Column Data Analysis', () => {
    test('infers number type from samples', () => {
      const samples = ['100.5', '250.75', '45.23', '999.99'];
      const type = inferColumnTypeFromData(samples);
      expect(type).toBe(DataType.NUMBER);
    });

    test('infers timestamp type from samples', () => {
      const samples = [
        '2024-01-15',
        '2024-01-16',
        '2024-01-17',
        '2024-01-18',
      ];
      const type = inferColumnTypeFromData(samples);
      expect(type).toBe(DataType.TIMESTAMP);
    });

    test('infers mixed but dominant type', () => {
      // 3 numbers, 1 string
      const samples = ['100', '200', '300', 'invalid'];
      const type = inferColumnTypeFromData(samples);
      expect(type).toBe(DataType.NUMBER);
    });
  });

  describe('Transaction Type Inference', () => {
    test('infers buy from description', () => {
      const results = inferTransactionType('Bought 0.5 BTC');
      expect(results.length > 0).toBe(true);
      expect(results[0].type).toBe('buy');
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    test('infers sell from description', () => {
      const results = inferTransactionType('Sold 1.5 ETH');
      expect(results[0].type).toBe('sell');
    });

    test('infers deposit from description', () => {
      const results = inferTransactionType('Deposit received');
      expect(results[0].type).toBe('deposit');
    });

    test('detects direction from amounts - buy', () => {
      const direction = inferDirectionFromAmounts(1000, 0.05);
      expect(direction).toBe('buy');
    });

    test('detects direction from amounts - sell', () => {
      const direction = inferDirectionFromAmounts(0.5, 21500);
      expect(direction).toBe('sell');
    });

    test('detects swap from currencies', () => {
      const isSwap = isSwapTransaction('BTC', 'USDT');
      expect(isSwap).toBe(true);
    });

    test('does not detect swap for same currency', () => {
      const isSwap = isSwapTransaction('USDT', 'USDT');
      expect(isSwap).toBe(false);
    });

    test('infers transaction type from multiple fields', () => {
      const result = inferTransactionTypeFromFields(
        'buy',
        'USDT',
        'BTC',
        21500,
        0.5
      );
      expect(result.type).toBe('buy');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Classification', () => {
    test('classifies timestamp column from header', () => {
      const result = classifierV3.classifyColumnAdvanced('Date', []);
      expect(result.type).toBe('timestamp');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('classifies currency column with data analysis', () => {
      const result = classifierV3.classifyColumnAdvanced(
        'currency',
        ['BTC', 'ETH', 'USDT'],
        [],
        0
      );
      expect(result.type).toBe('from_currency');
      expect(result.dataTypeMatch).toBe(DataType.CURRENCY);
    });

    test('classifies amount column with numeric data', () => {
      const result = classifierV3.classifyColumnAdvanced(
        'Amount',
        ['100.5', '250.75', '45.23'],
        [],
        0
      );
      expect(result.type).toBe('from_amount');
      expect(result.dataTypeMatch).toBe(DataType.NUMBER);
    });

    test('includes method usage in result', () => {
      const result = classifierV3.classifyColumnAdvanced(
        'timestamp',
        ['2024-01-15', '2024-01-16'],
        [],
        0
      );
      expect(result.methodsUsed).toContain('header_match');
      expect(result.methodsUsed.length).toBeGreaterThan(0);
    });

    test('applies exchange context boost', () => {
      const result = classifierV3.classifyColumnAdvanced(
        'base-asset',
        ['BTC', 'ETH'],
        [],
        0,
        'binance'
      );
      expect(result.methodsUsed.some(m => m.includes('exchange'))).toBeTruthy();
    });
  });

  describe('CSV Analysis with Data', () => {
    test('analyzes headers with row samples', () => {
      const headers = ['Date', 'From Amount', 'From Currency', 'To Amount', 'To Currency'];
      const rows = [
        ['2024-01-15', '1000', 'USDT', '0.05', 'BTC'],
        ['2024-01-16', '2000', 'USDT', '0.1', 'BTC'],
      ];

      const analysis = classifierV3.analyzeCSVWithContext(headers, rows);

      expect(analysis.classifications.length).toBe(5);
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.methodsDistribution).toBeDefined();
    });

    test('detects binance exchange from headers', () => {
      const headers = [
        'time',
        'base-asset',
        'quote-asset',
        'type',
        'price',
        'quantity',
        'total',
      ];
      const analysis = classifierV3.analyzeCSVWithContext(headers, []);

      expect(analysis.detectedExchange).toBe('binance');
    });

    test('provides method distribution in analysis', () => {
      const headers = [
        'Date',
        'Amount',
        'Currency',
      ];
      const rows = [
        ['2024-01-15', '100', 'BTC'],
        ['2024-01-16', '200', 'ETH'],
      ];

      const analysis = classifierV3.analyzeCSVWithContext(headers, rows);

      expect(analysis.methodsDistribution).toBeDefined();
      expect(Object.keys(analysis.methodsDistribution).length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Caching', () => {
    test('returns cache statistics', () => {
      const result1 = classifierV3.classifyColumnAdvanced('timestamp', []);
      const stats = classifierV3.getStatistics();

      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
      expect(stats.analysisCacheSize).toBeGreaterThanOrEqual(0);
      expect(stats.patternsLoaded).toBeGreaterThan(0);
      expect(stats.exchangesSupported).toBeGreaterThan(0);
    });

    test('clears cache successfully', () => {
      classifierV3.classifyColumnAdvanced('timestamp', []);
      classifierV3.clearCache();
      const stats = classifierV3.getStatistics();

      expect(stats.cacheSize).toBe(0);
      expect(stats.analysisCacheSize).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty column name', () => {
      const result = classifierV3.classifyColumnAdvanced('', []);
      expect(result.type).toBe('unknown');
    });

    test('handles unknown column', () => {
      const result = classifierV3.classifyColumnAdvanced('xyzabc123', []);
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.4);
    });

    test('handles empty row samples', () => {
      const result = classifierV3.classifyColumnAdvanced('Amount', []);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('handles low confidence detection gracefully', () => {
      const results = inferTransactionType('zzzzzzzzz');
      expect(results.length).toBe(0); // No matches
    });
  });
});
