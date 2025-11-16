# API Documentation

Complete API documentation for the XCoin platform.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.xcoin.dev/api`

## Authentication

All endpoints (except `/auth/*`) require JWT authentication.

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses are in JSON format:

### Success Response (2xx)
```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-11-16T10:30:00Z",
    "version": "1.0"
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John"
  },
  "token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "user": { ... },
  "token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token"
}

Response (200):
{
  "token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "message": "Successfully logged out"
}
```

### Users

#### Get Profile
```
GET /users/profile
Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "country_code": "US",
    "subscription_tier": "pro"
  }
}
```

#### Update Profile
```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Doe",
  "country_code": "GB"
}

Response (200):
{
  "user": { ... }
}
```

#### Enable MFA
```
POST /users/mfa/enable
Authorization: Bearer <token>

Response (200):
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qr_code_url": "data:image/png;base64,..."
}
```

#### Verify MFA
```
POST /users/mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}

Response (200):
{
  "backup_codes": ["code1", "code2", ...]
}
```

### Accounts (Wallets/Exchanges)

#### List Accounts
```
GET /accounts
Authorization: Bearer <token>
Query Parameters:
  - type: 'exchange' | 'wallet' | 'blockchain'
  - status: 'active' | 'inactive'

Response (200):
{
  "accounts": [
    {
      "id": "uuid",
      "account_type": "exchange",
      "exchange_name": "binance",
      "display_name": "Binance Main",
      "is_active": true,
      "last_sync_at": "2025-11-16T10:00:00Z"
    }
  ]
}
```

#### Connect Exchange (API Key)
```
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_type": "exchange",
  "exchange_name": "binance",
  "display_name": "My Binance",
  "api_key": "your_api_key",
  "secret_key": "your_secret_key"
}

Response (201):
{
  "account": {
    "id": "uuid",
    "account_type": "exchange",
    "exchange_name": "binance",
    "display_name": "My Binance"
  }
}
```

#### Connect Wallet (Public Address)
```
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_type": "wallet",
  "wallet_address": "0x1234567890abcdef",
  "chain": "ethereum",
  "display_name": "My MetaMask"
}

Response (201):
{
  "account": { ... }
}
```

#### Disconnect Account
```
DELETE /accounts/:account_id
Authorization: Bearer <token>

Response (200):
{
  "message": "Account disconnected successfully"
}
```

#### Manual Sync
```
POST /accounts/:account_id/sync
Authorization: Bearer <token>

Response (202):
{
  "sync_job_id": "uuid",
  "status": "pending"
}
```

#### Get Sync Status
```
GET /accounts/:account_id/sync-status
Authorization: Bearer <token>

Response (200):
{
  "sync_job_id": "uuid",
  "status": "running",
  "progress": 45,
  "transaction_count": 120
}
```

### Transactions

#### List Transactions
```
GET /transactions
Authorization: Bearer <token>
Query Parameters:
  - page: 1 (default)
  - limit: 50 (default, max 100)
  - date_from: '2025-01-01'
  - date_to: '2025-12-31'
  - type: 'buy,sell,swap'
  - asset: 'BTC,ETH'
  - status: 'confirmed,pending'
  - sort: 'date_desc' (default)

Response (200):
{
  "transactions": [
    {
      "id": "uuid",
      "tx_date": "2025-06-15T10:30:00Z",
      "transaction_type": "buy",
      "asset_in": { "symbol": "BTC", "amount": 1.5 },
      "asset_out": { "symbol": "USD", "amount": 45000 },
      "fee": { "symbol": "USD", "amount": 10 },
      "status": "confirmed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250
  }
}
```

#### Get Transaction
```
GET /transactions/:transaction_id
Authorization: Bearer <token>

Response (200):
{
  "transaction": { ... }
}
```

#### Create Transaction
```
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "tx_date": "2025-06-15T10:30:00Z",
  "transaction_type": "swap",
  "asset_in_symbol": "BTC",
  "amount_in": 1.0,
  "asset_out_symbol": "ETH",
  "amount_out": 15.5,
  "fee_symbol": "ETH",
  "fee_amount": 0.05,
  "account_id": "uuid"
}

Response (201):
{
  "transaction": { ... }
}
```

#### Update Transaction
```
PUT /transactions/:transaction_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction_type": "swap",
  "amount_in": 1.5
}

Response (200):
{
  "transaction": { ... }
}
```

#### Delete Transaction
```
DELETE /transactions/:transaction_id
Authorization: Bearer <token>

Response (200):
{
  "message": "Transaction deleted"
}
```

#### Bulk Import (CSV)
```
POST /transactions/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <csv-file>
account_id: "uuid" (optional)

Response (202):
{
  "import_job_id": "uuid",
  "status": "processing",
  "message": "Processing CSV file"
}
```

#### Get Import Status
```
GET /transactions/import/:import_job_id
Authorization: Bearer <token>

Response (200):
{
  "import_job_id": "uuid",
  "status": "completed",
  "total_transactions": 500,
  "successful": 495,
  "failed": 5,
  "errors": [
    {
      "row": 10,
      "error": "Invalid date format"
    }
  ]
}
```

### Portfolio & Holdings

#### Get Portfolio Summary
```
GET /portfolio
Authorization: Bearer <token>

Response (200):
{
  "portfolio": {
    "total_value": 125000.50,
    "total_cost": 85000.00,
    "total_gain": 40000.50,
    "gain_percentage": 47.06,
    "currency": "USD"
  }
}
```

#### Get Holdings
```
GET /portfolio/holdings
Authorization: Bearer <token>
Query Parameters:
  - asset: 'BTC,ETH'
  - sort: 'value_desc'

Response (200):
{
  "holdings": [
    {
      "asset": "BTC",
      "quantity": 2.5,
      "average_cost": 28000,
      "total_cost": 70000,
      "current_price": 45000,
      "current_value": 112500,
      "gain": 42500,
      "gain_percentage": 60.71
    }
  ]
}
```

### Reports

#### List Reports
```
GET /reports
Authorization: Bearer <token>
Query Parameters:
  - tax_year: 2025
  - status: 'draft,ready'

Response (200):
{
  "reports": [
    {
      "id": "uuid",
      "report_type": "capital_gains",
      "tax_year": 2025,
      "country_code": "US",
      "status": "ready",
      "total_gains": 50000,
      "total_losses": 5000,
      "net_gain": 45000,
      "created_at": "2025-11-16T10:00:00Z"
    }
  ]
}
```

#### Generate Report
```
POST /reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "report_type": "capital_gains",
  "tax_year": 2025,
  "country_code": "US",
  "accounting_method": "fifo"
}

Response (202):
{
  "report_id": "uuid",
  "status": "generating"
}
```

#### Get Report
```
GET /reports/:report_id
Authorization: Bearer <token>

Response (200):
{
  "report": {
    "id": "uuid",
    "report_type": "capital_gains",
    "status": "ready",
    "total_gains": 50000,
    "total_losses": 5000,
    "detailed_gains": [
      {
        "asset": "BTC",
        "quantity_sold": 1.0,
        "cost_basis": 30000,
        "proceeds": 45000,
        "gain": 15000
      }
    ]
  }
}
```

#### Download Report
```
GET /reports/:report_id/download
Authorization: Bearer <token>
Query Parameters:
  - format: 'pdf' | 'csv' | 'xlsx'

Response (200):
[Binary file content]
Content-Type: application/pdf | text/csv | application/vnd.ms-excel
Content-Disposition: attachment; filename="report.pdf"
```

#### Regenerate Report
```
POST /reports/:report_id/regenerate
Authorization: Bearer <token>

Response (202):
{
  "report_id": "uuid",
  "status": "regenerating"
}
```

### Dashboard

#### Get Dashboard Summary
```
GET /dashboard/summary
Authorization: Bearer <token>

Response (200):
{
  "summary": {
    "portfolio_value": 125000.50,
    "portfolio_gain": 40000.50,
    "monthly_gain": 5000,
    "total_transactions": 1250,
    "pending_reconciliation": 12,
    "next_tax_deadline": "2026-04-15"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Premium tier: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1700000000
```

## Webhooks

Webhooks are sent for important events:

### Events
- `transaction.created`
- `transaction.updated`
- `report.generated`
- `sync.completed`
- `sync.failed`

### Webhook Payload
```json
{
  "event": "transaction.created",
  "timestamp": "2025-11-16T10:30:00Z",
  "data": {
    "transaction_id": "uuid",
    "user_id": "uuid"
  }
}
```

## Pagination

List endpoints support pagination with:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5
  }
}
```

---

**Last Updated**: November 2025
