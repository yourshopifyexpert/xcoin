/**
 * Simple Column Classifier
 * Uses pattern matching and similarity scoring to identify column types
 * No external AI needed - completely free and runs locally
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const trainingData = require('../training-data.json');

export type ColumnType =
  | 'timestamp'
  | 'transaction_id'
  | 'transaction_type'
  | 'from_amount'
  | 'from_currency'
  | 'to_amount'
  | 'to_currency'
  | 'fee_amount'
  | 'fee_currency'
  | 'price'
  | 'price_currency'
  | 'description'
  | 'exchange'
  | 'wallet_address'
  | 'status'
  | 'unknown';

interface ClassificationResult {
  column: string;
  type: ColumnType;
  confidence: number;
  reasoning: string;
}

class ColumnClassifier {
  private patterns: Map<ColumnType, string[]> = new Map();
  private variations: Map<ColumnType, string[]> = new Map();
  private transactionTypeKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.loadPatterns();
    this.loadTransactionTypes();
  }

  /**
   * Load pattern data from training data
   */
  private loadPatterns(): void {
    const columnPatterns = trainingData.column_patterns as Record<
      string,
      { patterns: string[]; variations: string[] }
    >;

    for (const [columnType, data] of Object.entries(columnPatterns)) {
      const type = columnType as ColumnType;
      this.patterns.set(type, data.patterns);
      this.variations.set(type, data.variations);
    }
  }

  /**
   * Load transaction type keywords
   */
  private loadTransactionTypes(): void {
    const transactionTypes = trainingData.transaction_types;
    this.transactionTypeKeywords = new Map(Object.entries(transactionTypes));
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // Partial match
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;

    // Levenshtein distance (simplified)
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    const similarity = 1 - distance / maxLen;

    return Math.max(0, similarity);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Score a column against a specific type
   */
  private scoreColumn(column: string, type: ColumnType): number {
    const patterns = this.patterns.get(type) || [];
    const variations = this.variations.get(type) || [];
    const allPatterns = [...patterns, ...variations];

    let maxScore = 0;

    for (const pattern of allPatterns) {
      const similarity = this.calculateSimilarity(column, pattern);
      if (similarity > maxScore) {
        maxScore = similarity;
      }
    }

    return maxScore;
  }

  /**
   * Detect if a value looks like a transaction type
   */
  private isTransactionTypeValue(value: string): boolean {
    const lowerValue = value.toLowerCase().trim();

    for (const [, keywords] of this.transactionTypeKeywords) {
      if (keywords.some((kw) => lowerValue.includes(kw))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Classify a single column header
   */
  classifyColumn(column: string): ClassificationResult {
    const columnTypes: ColumnType[] = [
      'timestamp',
      'transaction_id',
      'transaction_type',
      'from_amount',
      'from_currency',
      'to_amount',
      'to_currency',
      'fee_amount',
      'fee_currency',
      'price',
      'price_currency',
      'description',
      'exchange',
      'wallet_address',
      'status',
    ];

    let bestType: ColumnType = 'unknown';
    let bestScore = 0;
    let reasoning = '';

    for (const type of columnTypes) {
      const score = this.scoreColumn(column, type);

      if (score > bestScore) {
        bestScore = score;
        bestType = type;
        reasoning = this.getReasoningForType(type, column);
      }
    }

    // If confidence is too low, mark as unknown
    if (bestScore < 0.4) {
      bestType = 'unknown';
      reasoning = `No strong pattern match found for "${column}"`;
    }

    return {
      column,
      type: bestType,
      confidence: Math.round(bestScore * 100) / 100,
      reasoning,
    };
  }

  /**
   * Get reasoning for why a column was classified as a type
   */
  private getReasoningForType(type: ColumnType, column: string): string {
    const patterns = this.patterns.get(type) || [];
    const matches = patterns.filter(
      (p) => this.calculateSimilarity(column, p) > 0.5
    );

    if (matches.length > 0) {
      return `Matched patterns: ${matches.join(', ')}`;
    }

    return `Partial match to pattern: ${type}`;
  }

  /**
   * Classify all columns in a CSV header
   */
  classifyHeaders(headers: string[]): ClassificationResult[] {
    return headers.map((header) => this.classifyColumn(header));
  }

  /**
   * Detect exchange/source from headers
   */
  detectExchange(headers: string[]): string {
    const exchangeHints: Record<string, string[]> = {
      binance: ['base-asset', 'quote-asset', 'trade-id'],
      kraken: ['txid', 'refid', 'aclass'],
      coinbase: [
        'Spot Price Currency',
        'Spot Price at Transaction',
        'Fees and/or Spread',
      ],
      gemini: ['base-asset', 'quote-asset', 'fee-currency'],
      koinly: ['From Wallet ID', 'To Wallet ID', 'Fee Currency'],
      kucoin: ['pair', 'tradeCreatedAt', 'feeCurrency'],
      etherscan: ['Txhash', 'BlockNumber', 'Gas_UsedGasPrice'],
      cointracking: ['Trade-Group', 'Buy Currency', 'Sell Currency'],
      poloniex: ['Status', 'Comment'],
    };

    let bestMatch = 'unknown';
    let bestScore = 0;

    for (const [exchange, hints] of Object.entries(exchangeHints)) {
      const matchCount = hints.filter((hint) =>
        headers.some((h) => h.toLowerCase().includes(hint.toLowerCase()))
      ).length;

      const score = matchCount / hints.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = exchange;
      }
    }

    return bestScore > 0.3 ? bestMatch : 'unknown';
  }

  /**
   * Get comprehensive analysis of CSV headers
   */
  analyzeCSVHeaders(headers: string[]): {
    classifications: ClassificationResult[];
    detectedExchange: string;
    confidence: number;
    summary: string;
  } {
    const classifications = this.classifyHeaders(headers);
    const detectedExchange = this.detectExchange(headers);

    const validClassifications = classifications.filter(
      (c) => c.type !== 'unknown'
    );
    const confidence =
      validClassifications.length === 0
        ? 0
        : Math.round(
            (validClassifications.reduce((sum, c) => sum + c.confidence, 0) /
              validClassifications.length) *
              100
          ) / 100;

    const unknownCount = classifications.filter(
      (c) => c.type === 'unknown'
    ).length;
    let summary = `Analyzed ${headers.length} columns. Identified ${validClassifications.length} columns with ${confidence * 100}% average confidence.`;

    if (unknownCount > 0) {
      summary += ` ${unknownCount} column(s) could not be classified.`;
    }

    if (detectedExchange !== 'unknown') {
      summary += ` Detected source: ${detectedExchange}`;
    }

    return {
      classifications,
      detectedExchange,
      confidence,
      summary,
    };
  }
}

export default new ColumnClassifier();
