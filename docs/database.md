# Database Schema Documentation

This document defines the complete data model for the XCoin platform.

## Tables

### 1. Users
Stores user account information and authentication details.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  country_code VARCHAR(2),
  tax_year INT DEFAULT YEAR(CURRENT_DATE),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### 2. OAuth Accounts
Stores OAuth provider credentials for users.

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);
```

### 3. Exchange/Wallet Accounts
Stores connected exchange and wallet accounts for a user.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'exchange', 'wallet', 'blockchain'
  exchange_name VARCHAR(100), -- 'binance', 'coinbase', 'metamask'
  public_key VARCHAR(255),
  encrypted_api_key TEXT,
  encrypted_secret_key TEXT,
  wallet_address VARCHAR(255),
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'syncing', 'success', 'failed'
  sync_error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

### 4. Assets (Cryptocurrencies)
Stores metadata about cryptocurrencies and NFTs.

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) UNIQUE NOT NULL, -- 'BTC', 'ETH', 'USDT'
  name VARCHAR(255) NOT NULL, -- 'Bitcoin', 'Ethereum'
  asset_type VARCHAR(50) NOT NULL, -- 'crypto', 'stablecoin', 'nft', 'token'
  decimals INT,
  contract_address VARCHAR(255), -- For ERC-20 tokens
  chain VARCHAR(50), -- 'ethereum', 'binance', 'solana'
  logo_url TEXT,
  coingecko_id VARCHAR(100),
  is_stablecoin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_symbol ON assets(symbol);
```

### 5. Transactions
Core transaction data imported from various sources.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  tx_hash VARCHAR(255),
  tx_date TIMESTAMP NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  -- 'buy', 'sell', 'swap', 'transfer_in', 'transfer_out'
  -- 'staking_reward', 'mining_reward', 'airdrop', 'fee'

  asset_in_id UUID REFERENCES assets(id),
  amount_in DECIMAL(40, 18),

  asset_out_id UUID REFERENCES assets(id),
  amount_out DECIMAL(40, 18),

  fee_asset_id UUID REFERENCES assets(id),
  fee_amount DECIMAL(40, 18),

  price_per_unit DECIMAL(40, 18),
  total_value DECIMAL(40, 2),

  source VARCHAR(100), -- 'binance', 'metamask', 'blockchain_scan'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciliation_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(tx_date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
```

### 6. Transaction Categorization
Stores user-defined and AI-generated categorization rules.

```sql
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  category VARCHAR(100), -- 'income', 'capital_gain', 'capital_loss', 'fee'
  subcategory VARCHAR(100),
  tags TEXT[], -- Array of tags
  notes TEXT,
  categorized_by VARCHAR(50), -- 'user', 'ai', 'manual'
  confidence_score DECIMAL(3, 2), -- 0-1 for AI-generated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_user_id ON transaction_categories(user_id);
```

### 7. Price History
Stores historical price data for assets.

```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(40, 18) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  price_date DATE NOT NULL,
  source VARCHAR(50), -- 'coingecko', 'binance', 'coinbase'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(asset_id, price_date, currency)
);

CREATE INDEX idx_price_history_asset_date ON price_history(asset_id, price_date);
```

### 8. Cost Basis
Tracks cost basis for each transaction (for tax purposes).

```sql
CREATE TABLE cost_basis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(40, 18) NOT NULL,
  cost_per_unit DECIMAL(40, 18) NOT NULL,
  total_cost DECIMAL(40, 2) NOT NULL,
  method VARCHAR(50), -- 'fifo', 'lifo', 'hifo', 'specific_id'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_basis_transaction ON cost_basis(transaction_id);
```

### 9. Holdings
Current user holdings/portfolio.

```sql
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(40, 18) NOT NULL,
  average_cost DECIMAL(40, 18),
  total_cost DECIMAL(40, 2),
  current_value DECIMAL(40, 2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_holdings_user_id ON holdings(user_id);
```

### 10. Tax Reports
Generated tax reports for users.

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(50), -- 'capital_gains', 'income', 'nft'
  tax_year INT NOT NULL,
  country_code VARCHAR(2),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ready', 'filed'

  total_gains DECIMAL(40, 2),
  total_losses DECIMAL(40, 2),
  net_capital_gain DECIMAL(40, 2),

  total_income DECIMAL(40, 2),
  staking_income DECIMAL(40, 2),
  mining_income DECIMAL(40, 2),

  file_format VARCHAR(20), -- 'pdf', 'csv', 'xlsx'
  file_url TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_at TIMESTAMP,
  UNIQUE(user_id, report_type, tax_year, country_code)
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_tax_year ON reports(tax_year);
```

### 11. Sync Jobs
Tracks integration sync history.

```sql
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'success', 'failed'
  transaction_count INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
```

### 12. AI Reconciliation Logs
Tracks AI-assisted transaction reconciliation.

```sql
CREATE TABLE reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  issue_type VARCHAR(100), -- 'missing_cost_basis', 'wash_trade', 'duplicate'
  ai_suggestion TEXT,
  user_action VARCHAR(50), -- 'accepted', 'rejected', 'modified'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reconciliation_user_id ON reconciliation_logs(user_id);
```

### 13. Notifications
User notifications and alerts.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notification_type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

### 14. Audit Logs
Tracks all user actions for security and compliance.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 15. Subscriptions
User subscription information.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'premium'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start DATE,
  current_period_end DATE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

## Indexes

Key indexes for performance optimization:

```sql
-- Users and authentication
CREATE INDEX idx_users_email ON users(email);

-- Transactions and querying
CREATE INDEX idx_transactions_user_date ON transactions(user_id, tx_date DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Holdings and portfolio
CREATE INDEX idx_holdings_user_asset ON holdings(user_id, asset_id);

-- Reports
CREATE INDEX idx_reports_user_year ON reports(user_id, tax_year DESC);

-- Audit trail
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
```

## Relationships

```
users (1) --> (M) accounts
users (1) --> (M) transactions
users (1) --> (M) holdings
users (1) --> (M) reports
users (1) --> (M) sync_jobs
users (1) --> (1) subscriptions

accounts (1) --> (M) transactions
accounts (1) --> (M) sync_jobs

assets (1) --> (M) transactions (as asset_in)
assets (1) --> (M) transactions (as asset_out)
assets (1) --> (M) holdings
assets (1) --> (M) price_history

transactions (1) --> (M) cost_basis
transactions (1) --> (1) transaction_categories
```

## Migrations

Migrations will be managed using a migration tool (e.g., Flyway, db-migrate).

All migrations should follow the pattern:
- `YYYYMMDD_001_description.sql`
- Should be idempotent where possible
- Include rollback functionality

---

**Last Updated**: November 2025
