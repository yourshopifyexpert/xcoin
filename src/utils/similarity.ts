/**
 * String similarity utilities with enhanced data type detection
 * Supports header matching, data type detection, and cross-field analysis
 */

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits required
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const matrix: number[][] = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  // Fill matrix
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses multiple techniques: exact match, substring match, and Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Handle empty strings
  if (s1 === '' && s2 === '') return 1.0;
  if (s1 === '' || s2 === '') return 0.0;

  // Exact match
  if (s1 === s2) return 1.0;

  // One contains the other (strong signal)
  if (s1.includes(s2) || s2.includes(s1)) {
    const shortLen = Math.min(s1.length, s2.length);
    const longLen = Math.max(s1.length, s2.length);
    return 0.7 + (shortLen / longLen) * 0.25; // 0.7-0.95 range
  }

  // Check for common substrings (word-based matching)
  const s1Words = s1.split(/[\s_-]/);
  const s2Words = s2.split(/[\s_-]/);
  const commonWords = s1Words.filter((w) => s2Words.includes(w)).length;
  if (commonWords > 0) {
    const wordSimilarity = commonWords / Math.max(s1Words.length, s2Words.length);
    if (wordSimilarity > 0.5) return 0.65 + wordSimilarity * 0.2;
  }

  // Levenshtein distance fallback
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
}

/**
 * Calculate Jaro-Winkler similarity (better for short strings like column names)
 */
export function jaroWinklerSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return s1 === s2 ? 1.0 : 0.0;

  // Calculate match window
  const matchDistance = Math.max(len1, len2) / 2 - 1;
  if (matchDistance < 1) return 0.0;

  const s1Matches = new Array(len1);
  const s2Matches = new Array(len2);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  // Calculate Jaro similarity
  const jaro =
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3;

  // Apply Winkler modification (bonus for matching prefix)
  let prefixLen = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefixLen++;
    else break;
  }

  return jaro + prefixLen * 0.1 * (1 - jaro);
}

/**
 * Data type detection utilities
 */
export enum DataType {
  TIMESTAMP = 'timestamp',
  NUMBER = 'number',
  CURRENCY = 'currency',
  STRING = 'string',
  HASH = 'hash',
  ADDRESS = 'address',
  BOOLEAN = 'boolean',
  UNKNOWN = 'unknown',
}

/**
 * Detect data type of a value
 */
export function detectDataType(value: string): DataType {
  if (!value || value.trim() === '') return DataType.UNKNOWN;

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  // Timestamp patterns
  if (
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) || // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed) || // US date
    /^\d{10,13}$/.test(trimmed) // Unix timestamp
  ) {
    return DataType.TIMESTAMP;
  }

  // Hash patterns (transaction/block hashes)
  if (/^(0x)?[a-f0-9]{64}$/.test(lower) || /^[a-f0-9]{128}$/.test(lower)) {
    return DataType.HASH;
  }

  // Blockchain address patterns
  if (/^0x[a-f0-9]{40}$/.test(lower) || /^[1-9A-HJ-NP-Z]{26,35}$/.test(trimmed)) {
    return DataType.ADDRESS;
  }

  // Currency patterns
  if (/^[A-Z]{3,}$/.test(trimmed)) {
    return DataType.CURRENCY;
  }

  // Number patterns
  if (/^-?\d+([.,]\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return DataType.NUMBER;
  }

  // Boolean patterns
  if (/^(true|false|yes|no|1|0)$/i.test(lower)) {
    return DataType.BOOLEAN;
  }

  return DataType.STRING;
}

/**
 * Analyze a column's data to infer its type
 * Uses multiple sample values from the column
 */
export function inferColumnTypeFromData(samples: string[]): DataType {
  if (samples.length === 0) return DataType.UNKNOWN;

  const typeCounts: Record<DataType, number> = {
    [DataType.TIMESTAMP]: 0,
    [DataType.NUMBER]: 0,
    [DataType.CURRENCY]: 0,
    [DataType.HASH]: 0,
    [DataType.ADDRESS]: 0,
    [DataType.BOOLEAN]: 0,
    [DataType.STRING]: 0,
    [DataType.UNKNOWN]: 0,
  };

  // Analyze each sample
  for (const sample of samples) {
    const type = detectDataType(sample);
    typeCounts[type]++;
  }

  // Find the most common type
  let maxCount = 0;
  let inferredType = DataType.STRING;

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      inferredType = type as DataType;
    }
  }

  // Need at least 50% consistency to be confident
  return maxCount >= samples.length * 0.5 ? inferredType : DataType.STRING;
}

/**
 * Calculate combined similarity with weighting
 * Considers both string similarity and semantic meaning
 */
export function weightedSimilarity(
  str1: string,
  str2: string,
  weights: { levenshtein?: number; jaroWinkler?: number; wordMatch?: number } = {}
): number {
  const {
    levenshtein: levWeight = 0.3,
    jaroWinkler: jaroWeight = 0.5,
    wordMatch: wordWeight = 0.2,
  } = weights;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // Calculate individual scores
  const levScore = calculateSimilarity(s1, s2);
  const jaroScore = jaroWinklerSimilarity(s1, s2);

  // Word-based matching
  const s1Words = s1.split(/[\s_-]/);
  const s2Words = s2.split(/[\s_-]/);
  const commonWords = s1Words.filter((w) => s2Words.includes(w)).length;
  const wordScore =
    commonWords > 0
      ? commonWords / Math.max(s1Words.length, s2Words.length)
      : 0;

  // Weighted combination
  return levScore * levWeight + jaroScore * jaroWeight + wordScore * wordWeight;
}
