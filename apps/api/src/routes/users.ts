import { Router } from 'express';

export const usersRouter = Router();

// TODO: Implement user routes
// - POST /register - Register new user
// - POST /login - User login
// - GET /profile - Get user profile
// - PUT /profile - Update user profile
// - POST /mfa - Enable MFA
// - GET /subscriptions - Get subscription info

usersRouter.get('/', (req, res) => {
  res.json({ message: 'Users endpoints not yet implemented' });
});
