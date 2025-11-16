/**
 * Transaction Type Inference
 * Analyzes actual data values to infer transaction types
 */

interface TransactionTypeScore {
  type: string;
  confidence: number;
  indicators: string[];
}

/**
 * Keywords associated with each transaction type
 */
const TYPE_KEYWORDS: Record<string, string[]> = {
  buy: [
    'buy',
    'purchase',
    'acquired',
    'bought',
    'in',
    'deposit',
    'received',
    'incoming',
  ],
  sell: [
    'sell',
    'sold',
    'sale',
    'out',
    'withdrawal',
    'sent',
    'outgoing',
    'distributed',
  ],
  transfer: ['transfer', 'moved', 'swap', 'exchange', 'converted'],
  deposit: ['deposit', 'received', 'incoming', 'credited'],
  withdrawal: ['withdrawal', 'withdrawn', 'sent', 'outgoing'],
  fee: ['fee', 'fee', 'commission', 'charge'],
  staking: ['staking', 'stake', 'yield', 'earn'],
  reward: ['reward', 'bonus', 'airdrop', 'grant'],
  interest: ['interest', 'apy', 'apr'],
  mining: ['mining', 'mined', 'block reward'],
  fork: ['fork', 'airdrop', 'hardfork'],
  rebate: ['rebate', 'refund', 'cashback'],
};

/**
 * Analyze a transaction description/type column and infer transaction type
 */
export function inferTransactionType(value: string): TransactionTypeScore[] {
  const lower = value.toLowerCase();
  const words = lower.split(/[\s_,-]/);

  const scores: Map<string, TransactionTypeScore> = new Map();

  // Score each transaction type
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    let matchCount = 0;
    const matchedIndicators: string[] = [];

    for (const keyword of keywords) {
      // Check for exact word match or substring
      if (
        words.includes(keyword) ||
        lower.includes(keyword)
      ) {
        matchCount++;
        matchedIndicators.push(keyword);
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(
        1.0,
        matchCount / keywords.length
      );
      scores.set(type, {
        type,
        confidence,
        indicators: matchedIndicators.slice(0, 3),
      });
    }
  }

  // Sort by confidence and return top results
  return Array.from(scores.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

/**
 * Analyze a column of transaction values and infer the dominant type
 */
export function inferColumnTransactionType(samples: string[]): string | null {
  if (samples.length === 0) return null;

  const typeScores: Map<string, number> = new Map();
  let totalSamples = 0;

  for (const sample of samples) {
    if (!sample || sample.trim() === '') continue;
    totalSamples++;

    const inferences = inferTransactionType(sample);
    if (inferences.length > 0) {
      const bestMatch = inferences[0];
      typeScores.set(
        bestMatch.type,
        (typeScores.get(bestMatch.type) || 0) + bestMatch.confidence
      );
    }
  }

  if (typeScores.size === 0) return null;

  // Find type with highest aggregate confidence
  let bestType = '';
  let bestScore = 0;

  for (const [type, score] of typeScores.entries()) {
    const avgConfidence = score / totalSamples;
    if (avgConfidence > bestScore) {
      bestScore = avgConfidence;
      bestType = type;
    }
  }

  return bestScore > 0.3 ? bestType : null;
}

/**
 * Detect transaction direction from from/to amounts
 * Returns 'buy', 'sell', or 'transfer' based on amount patterns
 */
export function inferDirectionFromAmounts(
  fromAmount: string | number | null,
  toAmount: string | number | null
): 'buy' | 'sell' | 'transfer' | null {
  if (!fromAmount || !toAmount) return null;

  const from = parseFloat(String(fromAmount));
  const to = parseFloat(String(toAmount));

  if (isNaN(from) || isNaN(to)) return null;

  // Heuristic: larger toAmount suggests buying
  if (to > from * 1.5) {
    return 'buy';
  }
  // Smaller toAmount suggests selling
  if (from > to * 1.5) {
    return 'sell';
  }
  // Similar amounts suggest transfer/swap
  return 'transfer';
}

/**
 * Detect if transaction is a swap based on currency pair change
 */
export function isSwapTransaction(
  fromCurrency: string | null,
  toCurrency: string | null
): boolean {
  if (!fromCurrency || !toCurrency) return false;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  return from !== to;
}

/**
 * Comprehensive transaction inference from multiple fields
 */
export function inferTransactionTypeFromFields(
  typeValue?: string,
  fromCurrency?: string,
  toCurrency?: string,
  fromAmount?: string | number,
  toAmount?: string | number,
  description?: string
): { type: string; confidence: number; reasoning: string } {
  const indicators: string[] = [];
  let typeScores: Map<string, number> = new Map();

  // Check type field if provided
  if (typeValue) {
    const inferred = inferTransactionType(typeValue);
    if (inferred.length > 0) {
      const best = inferred[0];
      typeScores.set(best.type, best.confidence);
      indicators.push(`Type field: ${best.type}`);
    }
  }

  // Check if it's a swap
  const isSwap = isSwapTransaction(fromCurrency, toCurrency);
  if (isSwap) {
    typeScores.set('transfer', (typeScores.get('transfer') || 0) + 0.7);
    indicators.push('Currency conversion detected');
  }

  // Check direction from amounts
  const direction = inferDirectionFromAmounts(fromAmount, toAmount);
  if (direction) {
    typeScores.set(direction, (typeScores.get(direction) || 0) + 0.6);
    indicators.push(`Amount pattern: ${direction}`);
  }

  // Check description if provided
  if (description) {
    const inferred = inferTransactionType(description);
    if (inferred.length > 0) {
      const best = inferred[0];
      typeScores.set(best.type, (typeScores.get(best.type) || 0) + 0.5);
      indicators.push(`Description hint: ${best.type}`);
    }
  }

  // Determine best match
  let bestType = 'transfer'; // Default
  let bestScore = 0;

  for (const [type, score] of typeScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return {
    type: bestType,
    confidence: Math.min(1.0, bestScore),
    reasoning: indicators.join('; '),
  };
}
