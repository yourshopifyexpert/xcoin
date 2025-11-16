/**
 * Improved Column Classifier v2
 * Enhanced version with:
 * - Better similarity algorithms (Jaro-Winkler)
 * - Result caching for performance
 * - Multi-pass analysis for accuracy
 * - Weighted scoring
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { calculateSimilarity, jaroWinklerSimilarity } from './utils/similarity';
import type { ColumnType, ClassificationResult, CSVAnalysis } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const req = createRequire(__filename);
const trainingData = req('../training-data.json');

interface ScoringWeights {
  exactMatch: number;
  patternMatch: number;
  partialMatch: number;
  jaroWinkler: number;
}

class ImprovedColumnClassifier {
  private patterns: Map<ColumnType, string[]> = new Map();
  private variations: Map<ColumnType, string[]> = new Map();
  private transactionTypeKeywords: Map<string, string[]> = new Map();
  private exchangeHints: Record<string, string[]> = {};
  private columnCache: Map<string, ClassificationResult> = new Map();
  private readonly DEFAULT_WEIGHTS: ScoringWeights = {
    exactMatch: 1.0,
    patternMatch: 0.95,
    partialMatch: 0.75,
    jaroWinkler: 0.85,
  };

  constructor() {
    this.loadPatterns();
    this.loadTransactionTypes();
    this.loadExchangeHints();
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
   * Load exchange-specific column hints
   */
  private loadExchangeHints(): void {
    this.exchangeHints = trainingData.exchange_hints || {};
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.columnCache.clear();
  }

  /**
   * Score a column against a specific type using weighted multi-algorithm approach
   */
  private scoreColumnType(
    column: string,
    type: ColumnType,
    weights: ScoringWeights = this.DEFAULT_WEIGHTS
  ): { score: number; method: string } {
    const patterns = this.patterns.get(type) || [];
    const variations = this.variations.get(type) || [];
    const allPatterns = [...patterns, ...variations];

    if (allPatterns.length === 0) {
      return { score: 0, method: 'no_patterns' };
    }

    let bestScore = 0;
    let bestMethod = 'none';

    for (const pattern of allPatterns) {
      const lowerCol = column.toLowerCase();
      const lowerPattern = pattern.toLowerCase();

      // Method 1: Exact match
      if (lowerCol === lowerPattern) {
        return { score: weights.exactMatch, method: 'exact_match' };
      }

      // Method 2: Pattern match (direct inclusion)
      if (patterns.includes(pattern) && lowerCol.includes(lowerPattern)) {
        bestScore = Math.max(bestScore, weights.patternMatch);
        bestMethod = 'pattern_match';
      }

      // Method 3: Jaro-Winkler similarity (better for short strings)
      const jaroScore = jaroWinklerSimilarity(column, pattern);
      if (jaroScore > 0.8) {
        const weighted = jaroScore * weights.jaroWinkler;
        if (weighted > bestScore) {
          bestScore = weighted;
          bestMethod = 'jaro_winkler';
        }
      }

      // Method 4: Levenshtein-based similarity
      const levScore = calculateSimilarity(column, pattern);
      if (levScore > 0.7) {
        const weighted = levScore * weights.patternMatch;
        if (weighted > bestScore) {
          bestScore = weighted;
          bestMethod = 'levenshtein';
        }
      }

      // Method 5: Partial match bonus
      if (lowerCol.includes(lowerPattern) || lowerPattern.includes(lowerCol)) {
        const partialScore = weights.partialMatch;
        if (partialScore > bestScore) {
          bestScore = partialScore;
          bestMethod = 'partial_match';
        }
      }
    }

    return { score: bestScore, method: bestMethod };
  }

  /**
   * Classify a single column header
   */
  classifyColumn(column: string): ClassificationResult {
    // Check cache first
    const cached = this.columnCache.get(column);
    if (cached) return cached;

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
    let bestMethod = 'none';

    // Score against all column types
    for (const type of columnTypes) {
      const { score, method } = this.scoreColumnType(column, type);

      if (score > bestScore) {
        bestScore = score;
        bestType = type;
        bestMethod = method;
      }
    }

    // Apply confidence threshold
    if (bestScore < 0.4) {
      bestType = 'unknown';
    }

    const result: ClassificationResult = {
      column,
      type: bestType,
      confidence: Math.round(bestScore * 100) / 100,
      reasoning: this.getReasoningForType(bestType, column, bestMethod),
    };

    // Cache the result
    this.columnCache.set(column, result);

    return result;
  }

  /**
   * Get reasoning for why a column was classified as a type
   */
  private getReasoningForType(
    type: ColumnType,
    column: string,
    method: string
  ): string {
    if (type === 'unknown') {
      return `No strong pattern match found for "${column}" (threshold: 0.4)`;
    }

    const patterns = this.patterns.get(type) || [];
    const variations = this.variations.get(type) || [];
    const allPatterns = [...patterns, ...variations];

    const matches = allPatterns.filter((p) => {
      const jaroScore = jaroWinklerSimilarity(column, p);
      return jaroScore > 0.7 || column.toLowerCase().includes(p.toLowerCase());
    });

    if (matches.length > 0) {
      return `Matched via ${method}: ${matches.slice(0, 2).join(', ')}`;
    }

    return `Classification as ${type} via ${method}`;
  }

  /**
   * Classify all columns in a CSV header
   */
  classifyHeaders(headers: string[]): ClassificationResult[] {
    return headers.map((header) => this.classifyColumn(header));
  }

  /**
   * Detect exchange/source from headers using hint-based approach
   */
  detectExchange(headers: string[]): { exchange: string; score: number } {
    let bestExchange = 'unknown';
    let bestScore = 0;

    for (const [exchange, hints] of Object.entries(this.exchangeHints)) {
      const matchCount = hints.filter((hint) =>
        headers.some((h) => h.toLowerCase().includes(hint.toLowerCase()))
      ).length;

      const score = hints.length > 0 ? matchCount / hints.length : 0;

      if (score > bestScore) {
        bestScore = score;
        bestExchange = exchange;
      }
    }

    // Only return if we have reasonable confidence
    const minConfidence = 0.3;
    if (bestScore < minConfidence) {
      bestExchange = 'unknown';
    }

    return { exchange: bestExchange, score: bestScore };
  }

  /**
   * Get comprehensive analysis of CSV headers
   */
  analyzeCSVHeaders(headers: string[]): CSVAnalysis {
    const classifications = this.classifyHeaders(headers);
    const { exchange, score } = this.detectExchange(headers);

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

    let summary = `Analyzed ${headers.length} columns. Identified ${validClassifications.length} columns with ${Math.round(confidence * 100)}% average confidence.`;

    if (unknownCount > 0) {
      summary += ` ${unknownCount} column(s) could not be classified.`;
    }

    if (exchange !== 'unknown' && score > 0.3) {
      summary += ` Detected source: ${exchange} (${Math.round(score * 100)}% confidence)`;
    }

    return {
      classifications,
      detectedExchange: exchange,
      confidence,
      summary,
    };
  }

  /**
   * Get classifier statistics
   */
  getStatistics(): {
    cacheSize: number;
    patternsLoaded: number;
    exchangesSupported: number;
  } {
    return {
      cacheSize: this.columnCache.size,
      patternsLoaded: this.patterns.size,
      exchangesSupported: Object.keys(this.exchangeHints).length,
    };
  }
}

export default new ImprovedColumnClassifier();
