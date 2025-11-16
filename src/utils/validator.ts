/**
 * Input validation utilities
 */

import { ValidationResult } from '../types';

export class Validator {
  /**
   * Validate CSV headers
   */
  static validateHeaders(headers: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(headers)) {
      errors.push('Headers must be an array');
      return { isValid: false, errors, warnings };
    }

    if (headers.length === 0) {
      errors.push('Headers array cannot be empty');
      return { isValid: false, errors, warnings };
    }

    if (headers.length > 100) {
      warnings.push('Large number of columns detected. Processing may be slower.');
    }

    // Check for duplicate headers
    const uniqueHeaders = new Set(headers);
    if (uniqueHeaders.size !== headers.length) {
      warnings.push('Duplicate column headers detected');
    }

    // Check for empty strings
    headers.forEach((h, i) => {
      if (!h || h.trim() === '') {
        errors.push(`Column ${i} is empty`);
      }
    });

    // Check for suspicious values
    headers.forEach((h, i) => {
      if (h.length > 255) {
        warnings.push(`Column ${i} header is very long (${h.length} chars)`);
      }
      if (/[<>{}[\]\\]/.test(h)) {
        warnings.push(`Column ${i} contains special characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate CSV data row
   */
  static validateRow(
    row: Record<string, string>,
    headers: string[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof row !== 'object' || row === null) {
      errors.push('Row must be an object');
      return { isValid: false, errors, warnings };
    }

    // Check that all headers exist in row
    for (const header of headers) {
      if (!(header in row)) {
        errors.push(`Missing required column: ${header}`);
      }
    }

    // Check for suspicious data
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === 'string' && value.length > 10000) {
        warnings.push(`Column "${key}" contains very large value (${value.length} chars)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate timestamp format
   */
  static isValidTimestamp(value: string): boolean {
    // Try common timestamp formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) return true;

    // Try Unix timestamp
    const unixTime = parseInt(value, 10);
    if (!isNaN(unixTime) && unixTime > 0 && unixTime < 9999999999999) return true;

    return false;
  }

  /**
   * Validate currency code
   */
  static isValidCurrencyCode(value: string): boolean {
    // Should be 2-4 character alphanumeric code
    return /^[A-Z0-9]{2,4}$/.test(value.toUpperCase());
  }

  /**
   * Validate number
   */
  static isValidNumber(value: string): boolean {
    const num = parseFloat(value.replace(/[$€£¥₹,\s]/g, ''));
    return !isNaN(num) && isFinite(num);
  }

  /**
   * Validate transaction hash
   */
  static isValidHash(value: string): boolean {
    // Common hash formats: hex (0x...), 64-char hex, alphanumeric
    return (
      /^0x[0-9a-f]{40,128}$/i.test(value) ||
      /^[0-9a-f]{64}$/i.test(value) ||
      /^[0-9a-zA-Z_-]{20,}$/.test(value)
    );
  }

  /**
   * Validate wallet address
   */
  static isValidAddress(value: string): boolean {
    // Ethereum address
    if (/^0x[0-9a-f]{40}$/i.test(value)) return true;
    // Bitcoin address formats
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(value)) return true;
    // Bech32 (Bitcoin)
    if (/^bc1[a-z0-9]{39,59}$/i.test(value)) return true;
    // Generic alphanumeric address
    if (/^[0-9a-zA-Z_-]{20,}$/.test(value)) return true;

    return false;
  }
}
