/**
 * XCoin Tax Engine
 * AI-powered crypto transaction detection and tax report generation
 *
 * Main entry point for the application
 */

import app from './api';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          XCoin Tax Engine - API Server Started            ║
╠════════════════════════════════════════════════════════════╣
║ 🚀 Server: http://${HOST}:${PORT}
║ 📊 CSV Processing: Enabled
║ 🤖 AI Classification: Using Local Classifier
║ 💰 Supported Exchanges: 9+ formats detected
║ ⚡ Features: Auto-detection, Normalization, Mapping
╚════════════════════════════════════════════════════════════╝

📝 API Endpoints:
  GET  /health                    - Health check
  POST /api/analyze-headers       - Analyze CSV headers
  POST /api/upload-csv            - Upload and parse single CSV
  POST /api/upload-csv-batch      - Upload multiple CSV files
  GET  /api/supported-exchanges   - List supported exchanges

Example cURL commands:

1. Check health:
   curl http://localhost:3000/health

2. Upload CSV file:
   curl -X POST -F "file=@transactions.csv" \\
     http://localhost:3000/api/upload-csv

3. Analyze headers:
   curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '{"headers":["Date","Amount","Currency"]}' \\
     http://localhost:3000/api/analyze-headers

4. Get supported exchanges:
   curl http://localhost:3000/api/supported-exchanges

`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;
