/**
 * String similarity utilities
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
