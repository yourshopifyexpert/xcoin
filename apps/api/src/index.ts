import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';

import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';
import { transactionsRouter } from './routes/transactions.js';
import { reportsRouter } from './routes/reports.js';

dotenv.config();

const app = express();
const logger = pino();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
  });
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/reports', reportsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
