/**
 * Custom error types and error handling
 */

export class CSVParseError extends Error {
  constructor(
    message: string,
    public readonly row?: number,
    public readonly column?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'CSVParseError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ClassificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClassificationError';
  }
}

export class FileError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string
  ) {
    super(message);
    this.name = 'FileError';
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Format error for API response
   */
  static formatErrorResponse(error: unknown): {
    error: string;
    message: string;
    details?: unknown;
  } {
    if (error instanceof CSVParseError) {
      return {
        error: 'CSV_PARSE_ERROR',
        message: error.message,
        details: {
          row: error.row,
          column: error.column,
        },
      };
    }

    if (error instanceof ValidationError) {
      return {
        error: 'VALIDATION_ERROR',
        message: error.message,
        details: {
          errors: error.errors,
        },
      };
    }

    if (error instanceof ClassificationError) {
      return {
        error: 'CLASSIFICATION_ERROR',
        message: error.message,
      };
    }

    if (error instanceof FileError) {
      return {
        error: 'FILE_ERROR',
        message: error.message,
        details: {
          fileName: error.fileName,
        },
      };
    }

    if (error instanceof Error) {
      return {
        error: 'INTERNAL_ERROR',
        message: error.message,
      };
    }

    return {
      error: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }

  /**
   * Log error with context
   */
  static logError(
    error: unknown,
    context: { module?: string; operation?: string; details?: unknown } = {}
  ): void {
    const timestamp = new Date().toISOString();
    const errorMsg =
      error instanceof Error ? error.message : String(error);

    console.error(`[${timestamp}] Error in ${context.module || 'unknown'}:`, {
      operation: context.operation,
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      details: context.details,
    });
  }

  /**
   * Safe wrapper for async operations
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context: { module?: string; operation?: string } = {}
  ): Promise<{ success: boolean; data?: T; error?: unknown }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      this.logError(error, context);
      return { success: false, error };
    }
  }
}
