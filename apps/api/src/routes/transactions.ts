import { Router } from 'express';

export const transactionsRouter = Router();

// TODO: Implement transaction routes
// - POST / - Create transaction
// - GET / - List transactions
// - GET /:id - Get transaction
// - PUT /:id - Update transaction
// - DELETE /:id - Delete transaction
// - POST /import - Import transactions from CSV
// - POST /sync - Sync from exchange/wallet

transactionsRouter.get('/', (req, res) => {
  res.json({ message: 'Transactions endpoints not yet implemented' });
});
