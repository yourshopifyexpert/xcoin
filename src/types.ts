/**
 * Shared type definitions
 */

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

export interface ClassificationResult {
  column: string;
  type: ColumnType;
  confidence: number;
  reasoning: string;
}

export interface CSVAnalysis {
  classifications: ClassificationResult[];
  detectedExchange: string;
  confidence: number;
  summary: string;
}

export interface NormalizedTransaction {
  timestamp?: string;
  transaction_id?: string;
  transaction_type?: string;
  from_amount?: string | number;
  from_currency?: string;
  to_amount?: string | number;
  to_currency?: string;
  fee_amount?: string | number;
  fee_currency?: string;
  price?: string | number;
  price_currency?: string;
  description?: string;
  exchange?: string;
  wallet_address?: string;
  status?: string;
}

export interface ParseResult {
  success: boolean;
  exchange: string;
  totalRows: number;
  normalizedTransactions: NormalizedTransaction[];
  errors: Array<{ row: number; error: string }>;
  columnMapping: Record<string, ColumnType>;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
