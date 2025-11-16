/**
 * Express API for CSV Upload and Processing
 */

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import csvParser from './csv-parser';
import classifier from './classifier';
import classifierV3 from './classifier-v3';
import { inferTransactionTypeFromFields } from './utils/transaction-inference';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'XCoin CSV Parser API is running' });
});

/**
 * Classify CSV headers without full parsing
 * Useful for preview before actual import
 */
app.post('/api/analyze-headers', (req: Request, res: Response) => {
  try {
    const { headers } = req.body;

    if (!Array.isArray(headers) || headers.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid input: headers array required' });
    }

    const analysis = classifier.analyzeCSVHeaders(headers);

    res.json({
      success: true,
      data: {
        classifications: analysis.classifications,
        detectedExchange: analysis.detectedExchange,
        confidence: analysis.confidence,
        summary: analysis.summary,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload and parse CSV file
 * Returns normalized transactions and column mapping
 */
app.post('/api/upload-csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const mimeType = req.file.mimetype;
    if (
      mimeType !== 'text/csv' &&
      mimeType !== 'application/vnd.ms-excel' &&
      !req.file.originalname.endsWith('.csv')
    ) {
      return res.status(400).json({ error: 'File must be a CSV file' });
    }

    // Create readable stream from buffer
    const stream = Readable.from(req.file.buffer);

    // Parse the CSV
    const result = await csvParser.parseStream(stream);

    // Remove internal error details from response
    const response = {
      success: result.success,
      file: req.file.originalname,
      exchange: result.exchange,
      totalRows: result.totalRows,
      processedRows: result.normalizedTransactions.length,
      confidence: `${Math.round(result.confidence * 100)}%`,
      columnMapping: result.columnMapping,
      transactions: result.normalizedTransactions,
      errors:
        result.errors.length > 0
          ? {
              count: result.errors.length,
              samples: result.errors.slice(0, 5), // Only first 5 errors
            }
          : null,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Batch upload multiple CSV files
 */
app.post('/api/upload-csv-batch', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const results = [];

    for (const file of files) {
      try {
        const stream = Readable.from(file.buffer);
        const result = await csvParser.parseStream(stream);

        results.push({
          file: file.originalname,
          success: result.success,
          exchange: result.exchange,
          totalRows: result.totalRows,
          processedRows: result.normalizedTransactions.length,
          confidence: `${Math.round(result.confidence * 100)}%`,
        });
      } catch (error) {
        results.push({
          file: file.originalname,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: results.every((r) => r.success),
      totalFiles: files.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Advanced header analysis with data type inference (v3)
 * Provides context-aware classification using actual row samples
 */
app.post('/api/analyze-headers-advanced', (req: Request, res: Response) => {
  try {
    const { headers, samples } = req.body;

    if (!Array.isArray(headers) || headers.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid input: headers array required' });
    }

    // Convert samples to 2D array if provided
    const rowSamples = Array.isArray(samples) && samples.length > 0
      ? samples.map((row: any[]) =>
          headers.map((_, i) => row[i] || '')
        )
      : [];

    const analysis = classifierV3.analyzeCSVWithContext(headers, rowSamples);

    res.json({
      success: true,
      data: {
        classifications: analysis.classifications,
        detectedExchange: analysis.detectedExchange,
        confidence: analysis.confidence,
        summary: analysis.summary,
        methodsDistribution: analysis.methodsDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Infer transaction type from transaction details
 */
app.post('/api/infer-transaction-type', (req: Request, res: Response) => {
  try {
    const {
      typeValue,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      description,
    } = req.body;

    if (!typeValue && !description && (!fromCurrency || !toCurrency)) {
      return res.status(400).json({
        error:
          'Invalid input: provide typeValue, description, or currency pair',
      });
    }

    const result = inferTransactionTypeFromFields(
      typeValue,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      description
    );

    res.json({
      success: true,
      data: {
        transactionType: result.type,
        confidence: result.confidence,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get classifier statistics and capabilities
 */
app.get('/api/classifier-stats', (req: Request, res: Response) => {
  try {
    const stats = classifierV3.getStatistics();

    res.json({
      success: true,
      data: {
        classifier: 'Advanced v3',
        capabilities: [
          'context-aware classification',
          'data type inference',
          'cross-column dependency analysis',
          'weighted exchange detection',
          'transaction type inference',
        ],
        performance: {
          cacheSize: stats.cacheSize,
          analysisCacheSize: stats.analysisCacheSize,
        },
        supportedPatterns: {
          patternsLoaded: stats.patternsLoaded,
          exchangesSupported: stats.exchangesSupported,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get available exchange formats
 */
app.get('/api/supported-exchanges', (req: Request, res: Response) => {
  const exchanges = [
    'binance',
    'kraken',
    'coinbase',
    'gemini',
    'koinly',
    'kucoin',
    'etherscan',
    'cointracking',
    'poloniex',
  ];

  res.json({
    supported: exchanges,
    description: 'Supported crypto exchange formats for CSV import',
    note: 'Unknown formats will be detected automatically using AI classification',
  });
});

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

export default app;
