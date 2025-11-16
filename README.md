# XCoin - Crypto Tax SaaS Platform

A comprehensive Koinly-style cryptocurrency tax calculation and portfolio tracking platform. XCoin aggregates transaction data from multiple sources, performs tax calculations, and generates country-specific tax reports.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Core Functionality

#### 🔐 User Management
- Email/password authentication
- OAuth integration (Google, Apple, GitHub)
- Multi-factor authentication (MFA)
- Subscription management with Stripe
- Usage metering and billing

#### 📊 Dashboard & Analytics
- Portfolio overview (total value, holdings)
- Unrealized & realized gains/losses
- Tax summary for current financial year
- Real-time alerts and notifications
- Historical charts and analytics

#### 🔗 Data Integration
- **Exchange APIs**: Binance, Coinbase, Kraken, Gemini, KuCoin, Bybit, OKX, and more
- **Wallets**: MetaMask, Ledger, Trezor, TrustWallet
- **Blockchain**: BTC, ETH, BNB, SOL, ADA, TRX, LTC, and all EVM chains
- **CSV Import**: Support for unsupported sources
- **Manual Entry**: Ability to add custom transactions

#### 📝 Transaction Types Supported
- Spot trades
- Margin/futures trades
- Swaps (DEX)
- Token transfers
- Airdrops
- Staking rewards
- NFT transactions
- Gas fees
- LP deposits/withdrawals
- Bridge transfers

#### 🤖 AI-Powered Reconciliation
- Intelligent missing cost basis detection
- Wash trade identification
- Transfer inference
- Automatic transaction categorization
- Tax strategy optimization (FIFO, LIFO, HIFO, Specific ID)

#### 📋 Tax Reports
- **Report Types**:
  - Capital Gains Report
  - Income Report
  - End-of-Year Balances
  - Cost Basis Breakdown
  - Mining/Staking income summary
  - NFT gains/losses
  - Tax-loss harvesting suggestions

- **Supported Countries**:
  - USA (Form 8949, Schedule D)
  - UK (HMRC Capital Gains)
  - Canada (T1135)
  - Australia (ATO CGT)
  - EU (Generalized template)

#### 🔄 Automation
- Daily automatic sync from connected sources
- Background processing queues
- Auto-generation of year-end reports
- Custom categorization rules
- Duplicate detection and merging

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Language**: TypeScript
- **Logging**: Pino
- **Validation**: Zod
- **Queue**: Bull (Redis-backed)

### Database & Cache
- **Primary**: PostgreSQL
- **Cache**: Redis
- **Search** (Optional): ElasticSearch

### Infrastructure
- **Hosting**: AWS / GCP / Azure
- **Containers**: Docker & Kubernetes
- **CI/CD**: GitHub Actions
- **File Storage**: S3 / Azure Blob
- **Monitoring**: Sentry, DataDog

### External Services
- **Payments**: Stripe
- **AI/LLM**: OpenAI API (for reconciliation)
- **Blockchain Data**: Alchemy, QuickNode, BlockPi
- **Email**: SendGrid / Mailgun

---

## Project Structure

```
xcoin/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── db/            # Database connections
│   │   │   ├── integrations/  # Exchange/wallet APIs
│   │   │   ├── tax-engine/    # Tax calculation logic
│   │   │   └── index.ts       # Server entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── web/                    # Frontend app
│       ├── src/
│       │   ├── app/           # Next.js app directory
│       │   ├── components/    # React components
│       │   ├── pages/         # Page routes (legacy)
│       │   ├── hooks/         # Custom React hooks
│       │   ├── stores/        # Zustand stores
│       │   └── lib/           # Utilities
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── .env.example
│
├── packages/                   # Shared packages
│   ├── types/                 # Shared TypeScript types
│   ├── ui/                    # Shared UI components
│   └── utils/                 # Shared utilities
│
├── docs/                      # Documentation
│   ├── api.md                # API documentation
│   ├── architecture.md       # Architecture decisions
│   ├── database.md           # Database schema
│   └── deployment.md         # Deployment guide
│
├── scripts/                   # Build and utility scripts
├── .github/
│   └── workflows/            # CI/CD workflows
├── .gitignore
├── package.json              # Root package.json (monorepo)
├── tsconfig.json            # Root TypeScript config
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Redis 6+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xcoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env
   # Frontend
   cp apps/web/.env.example apps/web/.env
   ```

4. **Configure environment files**
   Edit `.env` files with your credentials:
   - Database URL
   - Redis connection
   - API keys (Stripe, OpenAI, blockchain providers)
   - JWT secrets

5. **Initialize database**
   ```bash
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```
   - API: http://localhost:3000
   - Web: http://localhost:3001

---

## Development

### Available Scripts

```bash
# Development
npm run dev           # Run both API and web in watch mode
npm run dev:api      # Run API only
npm run dev:web      # Run web only

# Building
npm run build        # Build all packages
npm run build:api    # Build API
npm run build:web    # Build web

# Testing
npm run test         # Run all tests
npm test -- --watch  # Watch mode

# Linting & Formatting
npm run lint         # Check code style
npm run format       # Format code

# Type Checking
npm run type-check   # Check TypeScript types
```

### Code Conventions

- Follow the conventions in [CLAUDE.md](./CLAUDE.md)
- Use TypeScript for all new code
- Write tests for business logic
- Use ESLint and Prettier for formatting
- Keep commits atomic and descriptive

### Database Schema

The database schema includes tables for:
- `users` - User accounts and profiles
- `accounts` - Connected wallets/exchanges
- `transactions` - Imported transactions
- `assets` - Cryptocurrency & NFT metadata
- `prices` - Historical price data
- `reports` - Generated tax reports
- `sync_jobs` - Integration sync history
- `reconciliation_logs` - AI reconciliation records

See [docs/database.md](./docs/database.md) for detailed schema.

### Adding a New Exchange Integration

1. Create a new file: `apps/api/src/integrations/exchanges/NewExchange.ts`
2. Implement the `ExchangeAdapter` interface
3. Add authentication handling
4. Implement transaction fetching
5. Add tests in `apps/api/tests/integrations/`
6. Update documentation

---

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/refresh` - Refresh access token
- `POST /api/users/mfa` - Setup MFA

### Accounts (Wallets/Exchanges)
- `GET /api/accounts` - List connected accounts
- `POST /api/accounts` - Connect new account
- `DELETE /api/accounts/:id` - Disconnect account

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/import` - Bulk import
- `POST /api/accounts/:id/sync` - Manual sync

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/:id/download` - Download report (PDF/CSV/XLSX)

See [docs/api.md](./docs/api.md) for complete API documentation.

---

## Deployment

### Docker

Build Docker images:
```bash
docker build -t xcoin-api apps/api
docker build -t xcoin-web apps/web
```

### Production Deployment

1. Set environment variables in production
2. Run database migrations: `npm run db:migrate`
3. Build applications: `npm run build`
4. Deploy to your hosting platform

See [docs/deployment.md](./docs/deployment.md) for detailed instructions.

---

## Security

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: JWT with secure refresh token rotation
- **API Security**: Rate limiting, CORS, CSRF protection
- **Data**: No private keys stored, only public addresses
- **Validation**: Input validation on all endpoints
- **Audit**: Complete audit logs of all operations

---

## Subscription Tiers

### Free Tier
- Limited to 50 transactions
- CSV import only
- Basic portfolio view

### Pro Tier
- Unlimited transactions
- Full tax reports
- API integrations

### Premium Tier
- Everything in Pro
- AI-powered reconciliation
- Automatic daily syncs
- Priority support

---

## Support & Contributing

### Getting Help
- Check [CLAUDE.md](./CLAUDE.md) for AI assistant guidelines
- Review [docs/](./docs) for detailed documentation
- Open an issue on GitHub

### Contributing
1. Create a feature branch from `main`
2. Make your changes
3. Write tests for new features
4. Submit a pull request

---

## License

[License to be determined]

---

## Roadmap

### MVP (Months 1-3)
- [x] Project setup and architecture
- [ ] User authentication
- [ ] CSV import
- [ ] Basic tax calculations
- [ ] Simple reports

### Phase 2 (Months 4-6)
- [ ] Exchange integrations (Binance, Coinbase, Kraken)
- [ ] AI reconciliation
- [ ] Multi-country tax forms
- [ ] Advanced filtering

### Phase 3 (Months 7-9)
- [ ] All major exchange APIs
- [ ] Blockchain integrations
- [ ] Complete tax engine
- [ ] Performance optimization

### Phase 4+ (Months 10+)
- [ ] Mobile app
- [ ] DeFi protocol support
- [ ] Developer API
- [ ] Enterprise features

---

## Contact & Community

- **Email**: support@xcoin.dev
- **Website**: [xcoin.dev](https://xcoin.dev)
- **GitHub**: [yourshopifyexpert/xcoin](https://github.com/yourshopifyexpert/xcoin)

---

**Last Updated**: November 2025
