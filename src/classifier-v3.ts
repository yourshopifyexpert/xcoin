/**
 * Advanced Column Classifier v3
 * Context-aware, data-driven classification with:
 * - Real row data analysis for type inference
 * - Cross-column dependency detection
 * - Enhanced exchange detection with weighted scoring
 * - Transaction type inference from actual values
 * - Advanced caching and performance optimization
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  calculateSimilarity,
  jaroWinklerSimilarity,
  weightedSimilarity,
  inferColumnTypeFromData,
  detectDataType,
  DataType,
} from './utils/similarity.js';
import type { ColumnType, ClassificationResult, CSVAnalysis } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const req = createRequire(__filename);
const trainingData = req('../training-data.json');

interface ScoringWeights {
  headerMatch: number;
  dataTypeMatch: number;
  exchangeContext: number;
  crossColumnDependency: number;
}

interface ColumnAnalysis {
  columnIndex: number;
  header: string;
  dataTypes: Map<DataType, number>;
  dominantDataType: DataType;
  sampleValues: string[];
}

interface AdvancedClassificationResult extends ClassificationResult {
  dataTypeMatch: DataType;
  contextConfidence: number;
  exchangeContext?: string;
  methodsUsed: string[];
}

class AdvancedColumnClassifier {
  private patterns: Map<ColumnType, string[]> = new Map();
  private variations: Map<ColumnType, string[]> = new Map();
  private transactionTypeKeywords: Map<string, string[]> = new Map();
  private exchangeHints: Record<string, string[]> = {};
  private columnCache: Map<string, ClassificationResult> = new Map();
  private analysisCache: Map<string, ColumnAnalysis> = new Map();

  private readonly DEFAULT_WEIGHTS: ScoringWeights = {
    headerMatch: 0.45,
    dataTypeMatch: 0.35,
    exchangeContext: 0.1,
    crossColumnDependency: 0.1,
  };

  // Data type preferences for each column type
  private readonly TYPE_PREFERENCES: Record<ColumnType, DataType[]> = {
    timestamp: [DataType.TIMESTAMP],
    transaction_id: [DataType.STRING, DataType.HASH],
    transaction_type: [DataType.STRING],
    from_amount: [DataType.NUMBER],
    from_currency: [DataType.CURRENCY, DataType.STRING],
    to_amount: [DataType.NUMBER],
    to_currency: [DataType.CURRENCY, DataType.STRING],
    fee_amount: [DataType.NUMBER],
    fee_currency: [DataType.CURRENCY, DataType.STRING],
    price: [DataType.NUMBER],
    price_currency: [DataType.CURRENCY, DataType.STRING],
    description: [DataType.STRING],
    exchange: [DataType.STRING],
    wallet_address: [DataType.ADDRESS, DataType.STRING],
    status: [DataType.STRING, DataType.BOOLEAN],
    unknown: [DataType.STRING, DataType.UNKNOWN],
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
   * Clear cache
   */
  clearCache(): void {
    this.columnCache.clear();
    this.analysisCache.clear();
  }

  /**
   * Analyze column data and infer data types
   */
  private analyzeColumnData(
    header: string,
    samples: string[],
    columnIndex: number
  ): ColumnAnalysis {
    const cacheKey = `${columnIndex}:${header}`;
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const dataTypes = new Map<DataType, number>();
    const validSamples: string[] = [];

    // Analyze each sample
    for (const sample of samples) {
      if (!sample || sample.trim() === '') continue;
      validSamples.push(sample);

      const type = detectDataType(sample);
      dataTypes.set(type, (dataTypes.get(type) || 0) + 1);
    }

    // Find dominant data type
    let maxCount = 0;
    let dominantDataType = DataType.STRING;

    for (const [type, count] of dataTypes.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantDataType = type;
      }
    }

    const analysis: ColumnAnalysis = {
      columnIndex,
      header,
      dataTypes,
      dominantDataType,
      sampleValues: validSamples.slice(0, 10), // Keep first 10 samples
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Score a column type based on header match
   */
  private scoreHeaderMatch(column: string, type: ColumnType): number {
    const patterns = this.patterns.get(type) || [];
    const variations = this.variations.get(type) || [];
    const allPatterns = [...patterns, ...variations];

    if (allPatterns.length === 0) return 0;

    let bestScore = 0;
    const colLower = column.toLowerCase();

    for (const pattern of allPatterns) {
      const patternLower = pattern.toLowerCase();

      // Exact match
      if (colLower === patternLower) {
        bestScore = Math.max(bestScore, 1.0);
      } else {
        // Weighted similarity
        const similarity = weightedSimilarity(column, pattern, {
          jaroWinkler: 0.6,
          levenshtein: 0.25,
          wordMatch: 0.15,
        });
        bestScore = Math.max(bestScore, similarity);
      }
    }

    return bestScore;
  }

  /**
   * Score a column type based on data type match
   */
  private scoreDataTypeMatch(
    type: ColumnType,
    analysis: ColumnAnalysis
  ): number {
    const preferences = this.TYPE_PREFERENCES[type] || [];

    if (preferences.length === 0) return 0;

    // Check if dominant data type is in preferences
    if (preferences.includes(analysis.dominantDataType)) {
      return 0.95; // High confidence if dominant type matches
    }

    // Check if any of the found types match preferences
    let bestMatch = 0;
    const totalSamples = Array.from(analysis.dataTypes.values()).reduce(
      (a, b) => a + b,
      0
    );

    for (const [dataType, count] of analysis.dataTypes.entries()) {
      if (preferences.includes(dataType)) {
        const confidence = count / totalSamples;
        bestMatch = Math.max(bestMatch, confidence);
      }
    }

    return bestMatch * 0.9; // Slightly lower than dominant type match
  }

  /**
   * Detect exchange and return weighted score
   */
  private detectExchangeWithWeights(
    headers: string[]
  ): { exchange: string; confidence: number } {
    let bestExchange = 'unknown';
    let bestScore = 0;
    const headerLower = headers.map((h) => h.toLowerCase());

    for (const [exchange, hints] of Object.entries(this.exchangeHints)) {
      let matchScore = 0;
      let totalWeight = 0;

      for (const hint of hints) {
        const hintLower = hint.toLowerCase();
        const matchCount = headerLower.filter((h) =>
          h.includes(hintLower)
        ).length;

        if (matchCount > 0) {
          // Weight hints more heavily if they're more specific
          const hintWeight = 1 + (hintLower.split(/[\s_-]/).length - 1) * 0.2;
          matchScore += matchCount * hintWeight;
          totalWeight += hintWeight;
        }
      }

      if (totalWeight > 0) {
        const score = matchScore / totalWeight / hints.length;
        if (score > bestScore) {
          bestScore = score;
          bestExchange = exchange;
        }
      }
    }

    return {
      exchange: bestScore > 0.25 ? bestExchange : 'unknown',
      confidence: Math.min(1, bestScore),
    };
  }

  /**
   * Analyze cross-column dependencies
   */
  private analyzeColumnDependencies(
    headers: string[],
    analyses: ColumnAnalysis[]
  ): Map<number, number> {
    const dependencyBoosts = new Map<number, number>();

    // Currency and Amount pairs (strong dependency)
    for (let i = 0; i < headers.length - 1; i++) {
      const currencyPatterns = ['currency', 'coin', 'token', 'asset'];
      const amountPatterns = ['amount', 'quantity', 'value'];

      const isCurrency = currencyPatterns.some((p) =>
        headers[i].toLowerCase().includes(p)
      );
      const isCurrencyNext = currencyPatterns.some((p) =>
        headers[i + 1].toLowerCase().includes(p)
      );
      const isAmount = amountPatterns.some((p) =>
        headers[i].toLowerCase().includes(p)
      );
      const isAmountNext = amountPatterns.some((p) =>
        headers[i + 1].toLowerCase().includes(p)
      );

      // Adjacent currency-amount pairs get confidence boost
      if ((isCurrency && isAmountNext) || (isAmount && isCurrencyNext)) {
        dependencyBoosts.set(i, 0.1);
        dependencyBoosts.set(i + 1, 0.1);
      }
    }

    return dependencyBoosts;
  }

  /**
   * Classify a single column with full context
   */
  classifyColumnAdvanced(
    column: string,
    samples: string[] = [],
    headers: string[] = [],
    columnIndex: number = 0,
    exchange?: string
  ): AdvancedClassificationResult {
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

    // Analyze column data if samples provided
    let columnAnalysis: ColumnAnalysis | null = null;
    if (samples.length > 0) {
      columnAnalysis = this.analyzeColumnData(column, samples, columnIndex);
    }

    // Calculate scores for each type
    let bestType: ColumnType = 'unknown';
    let bestScore = 0;
    let bestDataType = DataType.STRING;
    let methodsUsed: string[] = [];
    let contextConfidence = 0;

    const dependencyBoosts = headers.length > 0
      ? this.analyzeColumnDependencies(headers, [])
      : new Map();

    for (const type of columnTypes) {
      let score = 0;
      const methods: string[] = [];

      // Score 1: Header matching
      const headerScore = this.scoreHeaderMatch(column, type);
      score += headerScore * this.DEFAULT_WEIGHTS.headerMatch;
      if (headerScore > 0.5) methods.push('header_match');

      // Score 2: Data type matching
      let dataTypeScore = 0;
      if (columnAnalysis) {
        dataTypeScore = this.scoreDataTypeMatch(type, columnAnalysis);
        score += dataTypeScore * this.DEFAULT_WEIGHTS.dataTypeMatch;
        if (dataTypeScore > 0.5) methods.push('data_type_match');
      }

      // Score 3: Cross-column dependencies
      const depBoost = dependencyBoosts.get(columnIndex) || 0;
      if (depBoost > 0) {
        score += depBoost * this.DEFAULT_WEIGHTS.crossColumnDependency;
        methods.push('dependency_boost');
      }

      // Score 4: Exchange context
      if (exchange && exchange !== 'unknown') {
        const exchangeHintsList = this.exchangeHints[exchange] || [];
        const columnMatches = exchangeHintsList.some(
          (hint) =>
            column.toLowerCase().includes(hint.toLowerCase())
        );
        if (columnMatches) {
          score += 0.08 * this.DEFAULT_WEIGHTS.exchangeContext;
          methods.push('exchange_context');
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestType = type;
        bestDataType = columnAnalysis?.dominantDataType || DataType.STRING;
        methodsUsed = methods;
        contextConfidence = dataTypeScore;
      }
    }

    // Apply confidence threshold
    if (bestScore < 0.35) {
      bestType = 'unknown';
      methodsUsed = ['low_confidence'];
    }

    return {
      column,
      type: bestType,
      confidence: Math.round(bestScore * 100) / 100,
      reasoning: this.getAdvancedReasoning(bestType, column, methodsUsed),
      dataTypeMatch: bestDataType,
      contextConfidence: Math.round(contextConfidence * 100) / 100,
      methodsUsed,
    };
  }

  /**
   * Generate detailed reasoning for classification
   */
  private getAdvancedReasoning(
    type: ColumnType,
    column: string,
    methods: string[]
  ): string {
    if (type === 'unknown') {
      return `Could not confidently classify "${column}" - insufficient pattern or data type matches`;
    }

    const methodDescriptions: Record<string, string> = {
      header_match: 'header pattern match',
      data_type_match: 'data type consistency',
      dependency_boost: 'adjacent column correlation',
      exchange_context: 'exchange-specific hint',
    };

    const descriptions = methods
      .map((m) => methodDescriptions[m] || m)
      .slice(0, 3);

    return `Classified as ${type} via: ${descriptions.join(', ')}`;
  }

  /**
   * Classify headers with row data analysis
   */
  classifyHeadersWithData(
    headers: string[],
    rowSamples: string[][] = [],
    exchange?: string
  ): AdvancedClassificationResult[] {
    const detectedExchange =
      exchange ||
      this.detectExchangeWithWeights(headers).exchange;

    return headers.map((header, index) => {
      // Get sample values for this column
      const samples = rowSamples
        .filter((row) => row[index])
        .map((row) => row[index])
        .slice(0, 10);

      return this.classifyColumnAdvanced(
        header,
        samples,
        headers,
        index,
        detectedExchange
      );
    });
  }

  /**
   * Get comprehensive CSV analysis with advanced metrics
   */
  analyzeCSVWithContext(
    headers: string[],
    rowSamples: string[][] = []
  ): CSVAnalysis & { methodsDistribution: Record<string, number> } {
    const { exchange, confidence: exchangeConfidence } =
      this.detectExchangeWithWeights(headers);

    const classifications = this.classifyHeadersWithData(
      headers,
      rowSamples,
      exchange
    );

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

    // Count methods used
    const methodsDistribution: Record<string, number> = {};
    for (const c of classifications) {
      for (const method of (c as AdvancedClassificationResult).methodsUsed) {
        methodsDistribution[method] =
          (methodsDistribution[method] || 0) + 1;
      }
    }

    const summary =
      `Analyzed ${headers.length} columns with data samples. ` +
      `Identified ${validClassifications.length} columns with ${Math.round(confidence * 100)}% average confidence. ` +
      `Detected exchange: ${exchange} (${Math.round(exchangeConfidence * 100)}% confidence). ` +
      `Analysis methods: ${Object.keys(methodsDistribution).join(', ')}`;

    return {
      classifications,
      detectedExchange: exchange,
      confidence,
      summary,
      methodsDistribution,
    };
  }

  /**
   * Get classifier statistics
   */
  getStatistics(): {
    cacheSize: number;
    analysisCacheSize: number;
    patternsLoaded: number;
    exchangesSupported: number;
  } {
    return {
      cacheSize: this.columnCache.size,
      analysisCacheSize: this.analysisCache.size,
      patternsLoaded: this.patterns.size,
      exchangesSupported: Object.keys(this.exchangeHints).length,
    };
  }
}

export default new AdvancedColumnClassifier();
