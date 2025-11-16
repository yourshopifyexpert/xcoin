/**
 * Unit tests for the Column Classifier
 */

import classifier from './classifier';

describe('Column Classifier', () => {
  describe('classifyColumn', () => {
    it('should classify timestamp columns', () => {
      const testCases = [
        'Date',
        'time',
        'Timestamp',
        'created_at',
        'tradeCreatedAt',
      ];

      testCases.forEach((column) => {
        const result = classifier.classifyColumn(column);
        expect(result.type).toBe('timestamp');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify transaction ID columns', () => {
      const testCases = ['ID', 'txid', 'transaction_id', 'hash', 'TxHash'];

      testCases.forEach((column) => {
        const result = classifier.classifyColumn(column);
        expect(result.type).toBe('transaction_id');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify amount columns', () => {
      const testCases = ['Amount', 'quantity', 'Qty', 'value', 'size'];

      testCases.forEach((column) => {
        const result = classifier.classifyColumn(column);
        expect(result.type).toBe('from_amount');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify currency columns', () => {
      const testCases = [
        'Currency',
        'coin',
        'Asset',
        'symbol',
        'base-asset',
      ];

      testCases.forEach((column) => {
        const result = classifier.classifyColumn(column);
        expect(result.type).toBe('from_currency');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify fee columns', () => {
      const testCases = ['Fee', 'fees', 'commission'];

      testCases.forEach((column) => {
        const result = classifier.classifyColumn(column);
        expect(result.type).toBe('fee_amount');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify unknown columns', () => {
      const result = classifier.classifyColumn('XYZ123RandomColumn');
      expect(result.type).toBe('unknown');
    });
  });

  describe('classifyHeaders', () => {
    it('should classify all headers in an array', () => {
      const headers = ['Date', 'Amount', 'Currency', 'Fee', 'Notes'];
      const results = classifier.classifyHeaders(headers);

      expect(results.length).toBe(headers.length);
      expect(results[0].type).toBe('timestamp');
      expect(results[1].type).toBe('from_amount');
      expect(results[2].type).toBe('from_currency');
      expect(results[3].type).toBe('fee_amount');
      expect(results[4].type).toBe('description');
    });
  });

  describe('detectExchange', () => {
    it('should detect Binance format', () => {
      const headers = [
        'time',
        'base-asset',
        'quote-asset',
        'type',
        'price',
        'quantity',
        'total',
        'fee',
        'fee-currency',
        'trade-id',
      ];

      const exchange = classifier.detectExchange(headers);
      expect(exchange).toBe('binance');
    });

    it('should detect Kraken format', () => {
      const headers = ['txid', 'refid', 'time', 'type', 'aclass', 'asset'];

      const exchange = classifier.detectExchange(headers);
      expect(exchange).toBe('kraken');
    });

    it('should detect Coinbase format', () => {
      const headers = [
        'Timestamp',
        'Transaction Type',
        'Asset',
        'Spot Price Currency',
      ];

      const exchange = classifier.detectExchange(headers);
      expect(exchange).toBe('coinbase');
    });

    it('should detect Koinly format', () => {
      const headers = [
        'Date',
        'Type',
        'From Wallet ID',
        'From Amount',
        'To Wallet ID',
        'To Amount',
        'Fee Currency',
      ];

      const exchange = classifier.detectExchange(headers);
      expect(exchange).toBe('koinly');
    });

    it('should return unknown for unrecognized format', () => {
      const headers = ['ColA', 'ColB', 'ColC'];

      const exchange = classifier.detectExchange(headers);
      expect(exchange).toBe('unknown');
    });
  });

  describe('analyzeCSVHeaders', () => {
    it('should provide comprehensive analysis', () => {
      const headers = [
        'Date',
        'Type',
        'From Amount',
        'From Currency',
        'To Amount',
        'To Currency',
      ];

      const analysis = classifier.analyzeCSVHeaders(headers);

      expect(analysis.classifications.length).toBe(headers.length);
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.summary).toBeDefined();
      expect(typeof analysis.summary).toBe('string');
    });

    it('should calculate confidence as average of classifications', () => {
      const headers = ['Date', 'Random123', 'Amount'];

      const analysis = classifier.analyzeCSVHeaders(headers);

      const validClassifications = analysis.classifications.filter(
        (c) => c.type !== 'unknown'
      );
      const expectedConfidence =
        validClassifications.reduce((sum, c) => sum + c.confidence, 0) /
        validClassifications.length;

      expect(analysis.confidence).toBeCloseTo(expectedConfidence);
    });
  });
});
