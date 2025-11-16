/**
 * CSV Parser and Importer
 * Parses CSV files and normalizes them to standard format using the classifier
 */

import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import classifier, { ColumnType } from './classifier';

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

class CSVParser {
  /**
   * Parse CSV file from path
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const transactions: NormalizedTransaction[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      let headers: string[] = [];
      let rowCount = 0;
      let columnMapping: Record<string, ColumnType> = {};
      let exchange = 'unknown';
      let confidence = 0;

      const stream = createReadStream(filePath)
        .pipe(csvParser())
        .on('headers', (parsedHeaders: string[]) => {
          headers = parsedHeaders;
          const analysis = classifier.analyzeCSVHeaders(headers);

          // Build column mapping
          analysis.classifications.forEach((classification) => {
            columnMapping[classification.column] = classification.type;
          });

          exchange = analysis.detectedExchange;
          confidence = analysis.confidence;
        })
        .on('data', (row: Record<string, string>) => {
          rowCount++;
          try {
            const normalized = this.normalizeRow(row, columnMapping);
            transactions.push(normalized);
          } catch (error) {
            errors.push({
              row: rowCount,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
        .on('end', () => {
          resolve({
            success: errors.length === 0,
            exchange,
            totalRows: rowCount,
            normalizedTransactions: transactions,
            errors,
            columnMapping,
            confidence,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse CSV from buffer/stream
   */
  async parseStream(stream: Readable): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const transactions: NormalizedTransaction[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      let headers: string[] = [];
      let rowCount = 0;
      let columnMapping: Record<string, ColumnType> = {};
      let exchange = 'unknown';
      let confidence = 0;

      stream
        .pipe(csvParser())
        .on('headers', (parsedHeaders: string[]) => {
          headers = parsedHeaders;
          const analysis = classifier.analyzeCSVHeaders(headers);

          // Build column mapping
          analysis.classifications.forEach((classification) => {
            columnMapping[classification.column] = classification.type;
          });

          exchange = analysis.detectedExchange;
          confidence = analysis.confidence;
        })
        .on('data', (row: Record<string, string>) => {
          rowCount++;
          try {
            const normalized = this.normalizeRow(row, columnMapping);
            transactions.push(normalized);
          } catch (error) {
            errors.push({
              row: rowCount,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
        .on('end', () => {
          resolve({
            success: errors.length === 0,
            exchange,
            totalRows: rowCount,
            normalizedTransactions: transactions,
            errors,
            columnMapping,
            confidence,
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Normalize a single row based on column mapping
   */
  private normalizeRow(
    row: Record<string, string>,
    columnMapping: Record<string, ColumnType>
  ): NormalizedTransaction {
    const normalized: NormalizedTransaction = {};

    for (const [originalColumn, value] of Object.entries(row)) {
      const columnType = columnMapping[originalColumn];

      if (!columnType || columnType === 'unknown' || !value) {
        continue;
      }

      // Map original column to standardized field
      switch (columnType) {
        case 'timestamp':
          normalized.timestamp = this.normalizeTimestamp(value);
          break;
        case 'transaction_id':
          normalized.transaction_id = value;
          break;
        case 'transaction_type':
          normalized.transaction_type = this.normalizeTransactionType(value);
          break;
        case 'from_amount':
          normalized.from_amount = this.parseNumber(value);
          break;
        case 'from_currency':
          normalized.from_currency = value.toUpperCase();
          break;
        case 'to_amount':
          normalized.to_amount = this.parseNumber(value);
          break;
        case 'to_currency':
          normalized.to_currency = value.toUpperCase();
          break;
        case 'fee_amount':
          normalized.fee_amount = this.parseNumber(value);
          break;
        case 'fee_currency':
          normalized.fee_currency = value.toUpperCase();
          break;
        case 'price':
          normalized.price = this.parseNumber(value);
          break;
        case 'price_currency':
          normalized.price_currency = value.toUpperCase();
          break;
        case 'description':
          normalized.description = value;
          break;
        case 'exchange':
          normalized.exchange = value;
          break;
        case 'wallet_address':
          normalized.wallet_address = value;
          break;
        case 'status':
          normalized.status = value;
          break;
      }
    }

    return normalized;
  }

  /**
   * Normalize timestamp to ISO 8601 format
   */
  private normalizeTimestamp(value: string): string {
    // Try to parse the value as a date
    const date = new Date(value);

    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // If parsing fails, return as-is (user can handle manually)
    return value;
  }

  /**
   * Normalize transaction type to standard values
   */
  private normalizeTransactionType(value: string): string {
    const lowerValue = value.toLowerCase().trim();

    const typeMap: Record<string, string> = {
      // Buy variations
      buy: 'buy',
      purchase: 'buy',
      bid: 'buy',
      long: 'buy',
      enter: 'buy',

      // Sell variations
      sell: 'sell',
      sale: 'sell',
      ask: 'sell',
      short: 'sell',
      exit: 'sell',

      // Deposit variations
      deposit: 'deposit',
      in: 'deposit',
      receive: 'deposit',
      received: 'deposit',
      incoming: 'deposit',

      // Withdrawal variations
      withdrawal: 'withdrawal',
      withdraw: 'withdrawal',
      out: 'withdrawal',
      send: 'withdrawal',
      sent: 'withdrawal',
      outgoing: 'withdrawal',

      // Transfer variations
      transfer: 'transfer',
      move: 'transfer',
      swap: 'transfer',
      exchange: 'transfer',

      // Other types
      fee: 'fee',
      commission: 'fee',
      spread: 'fee',
      staking: 'staking',
      stake: 'staking',
      earn: 'staking',
      reward: 'reward',
      bonus: 'reward',
      airdrop: 'reward',
      referral: 'reward',
      interest: 'interest',
      yield: 'interest',
      mining: 'mining',
      mined: 'mining',
      fork: 'fork',
      rebate: 'rebate',
      cashback: 'rebate',
    };

    return typeMap[lowerValue] || value;
  }

  /**
   * Parse string number to number, handling various formats
   */
  private parseNumber(value: string): number | string {
    // Remove common currency symbols and whitespace
    const cleaned = value
      .replace(/[$€£¥₹,\s]/g, '')
      .replace(/−/g, '-'); // Handle minus sign variations

    const parsed = parseFloat(cleaned);

    // If parsing fails or results in NaN, return original value
    return isNaN(parsed) ? value : parsed;
  }
}

export default new CSVParser();
