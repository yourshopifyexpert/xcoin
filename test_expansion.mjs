import trainingData from './training-data.json' assert { type: 'json' };

const exchangeCount = Object.keys(trainingData.column_mappings).length;
const patterns = Object.keys(trainingData.column_patterns).length;
const transactionTypes = Object.keys(trainingData.transaction_types).length;
const exchangeHints = Object.keys(trainingData.exchange_hints).length;

// Count all patterns
let totalPatterns = 0;
let totalVariations = 0;
for (const [key, value] of Object.entries(trainingData.column_patterns)) {
  if (value.patterns) totalPatterns += value.patterns.length;
  if (value.variations) totalVariations += value.variations.length;
}

// Count all transaction type keywords
let totalKeywords = 0;
for (const [key, keywords] of Object.entries(trainingData.transaction_types)) {
  totalKeywords += keywords.length;
}

console.log('📊 TRAINING DATA EXPANSION SUMMARY');
console.log('=====================================\n');
console.log('Exchanges & Services:', exchangeCount);
console.log('Column Pattern Types:', patterns);
console.log('Transaction Types:', transactionTypes);
console.log('Exchange-Specific Hints:', exchangeHints);
console.log('\nDetailed Counts:');
console.log('  - Pattern Variations:', totalPatterns);
console.log('  - Column Variations:', totalVariations);
console.log('  - Transaction Keywords:', totalKeywords);
console.log('\nTotal Training Signals:', totalPatterns + totalVariations + totalKeywords);

