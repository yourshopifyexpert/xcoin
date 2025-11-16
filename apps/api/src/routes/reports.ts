import { Router } from 'express';

export const reportsRouter = Router();

// TODO: Implement report routes
// - GET / - List reports
// - POST / - Generate report
// - GET /:id - Get report
// - GET /:id/download - Download report (PDF/CSV/XLSX)
// - POST /:id/regenerate - Regenerate report
// - DELETE /:id - Delete report

reportsRouter.get('/', (req, res) => {
  res.json({ message: 'Reports endpoints not yet implemented' });
});
