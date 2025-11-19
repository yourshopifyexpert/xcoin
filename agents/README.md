# Markdown Agents for XCoin & ccodetax

This directory contains specialized AI agent definitions for working with the ccodetax project documentation. Each agent is an expert in a specific domain and maintains the corresponding markdown file from the ccodetax repository.

## Agents Overview

### 1. Backend Architecture Expert
**File**: `01-backend-architecture-expert.md`
**Domain**: Backend Infrastructure & System Design
**Maintains**: [001-backend-architecture-setup.md](https://github.com/yourshopifyexpert/ccodetax/blob/main/001-backend-architecture-setup.md)

Handles all aspects of backend infrastructure, system design, API architecture, deployment, and DevOps.

### 2. CSV Import Engine Expert
**File**: `02-csv-import-engine-expert.md`
**Domain**: Data Ingestion & File Processing
**Maintains**: [002-csv-import-engine.md](https://github.com/yourshopifyexpert/ccodetax/blob/main/002-csv-import-engine.md)

Specializes in CSV parsing, data validation, bulk imports, and data transformation pipelines.

### 3. Tax Calculation Engine Expert
**File**: `03-tax-calculation-engine-expert.md`
**Domain**: Tax Computation & Compliance
**Maintains**: [003-tax-calculation-engine.md](https://github.com/yourshopifyexpert/ccodetax/blob/main/003-tax-calculation-engine.md)

Expert in tax algorithms, capital gains calculations, multi-jurisdiction rules, and regulatory compliance.

### 4. Exchange API Integration Expert
**File**: `04-exchange-api-integration-expert.md`
**Domain**: External API Integration & Market Data
**Maintains**: [004-exchange-api-integrations.md](https://github.com/yourshopifyexpert/ccodetax/blob/main/004-exchange-api-integrations.md)

Manages cryptocurrency exchange API integrations, market data streams, and real-time price feeds.

## Cross-Agent Coordination

The agents work together across integration points:

```
Backend Architecture Expert
    ├── integrates with → CSV Import Engine Expert
    ├── integrates with → Tax Calculation Engine Expert
    └── integrates with → Exchange API Integration Expert

CSV Import Engine Expert
    ├── feeds data to → Tax Calculation Engine Expert
    └── depends on → Exchange API Integration Expert (for price data)

Tax Calculation Engine Expert
    └── requires → Exchange API Integration Expert (for real-time prices)

Exchange API Integration Expert
    ├── provides data to → Tax Calculation Engine Expert
    └── provides data to → CSV Import Engine Expert
```

## Using These Agents

### For AI Assistants
When working on the ccodetax project, you can invoke specific agents based on your task:

```bash
# Example: Work with Backend Architecture
Task: Use Explore agent to understand 001-backend-architecture-setup.md
Then invoke Backend Architecture Expert Agent

# Example: Work with CSV Import
Task: Review 002-csv-import-engine.md
Then invoke CSV Import Engine Expert Agent
```

### For Project Teams
- **Review Sessions**: Have each agent review pull requests in their domain
- **Documentation Updates**: Have agents maintain consistency in related documents
- **Implementation**: Have agents guide development in their specialty areas

## Agent Capabilities

Each agent profile includes:
- **Expert Areas**: Key competencies and specializations
- **Responsibilities**: Primary duties and decision-making authority
- **Skills Required**: Technical expertise needed
- **Integration Points**: How they work with other agents
- **Key Documents**: Documentation they maintain
- **Success Metrics**: Measurable goals and targets

## Adding New Agents

When adding a new markdown file to ccodetax, create a corresponding agent file:

1. Create `NN-agent-name-expert.md` in this directory
2. Document all required fields (Profile, Areas, Responsibilities, etc.)
3. Update this README with the new agent
4. Commit with: `docs: add [Agent Name] Expert Agent`

## Repository References

- **Primary Project**: https://github.com/yourshopifyexpert/ccodetax
- **Documentation Files**:
  - Backend Architecture: `001-backend-architecture-setup.md`
  - CSV Import Engine: `002-csv-import-engine.md`
  - Tax Calculation Engine: `003-tax-calculation-engine.md`
  - Exchange API Integrations: `004-exchange-api-integrations.md`

## Maintenance

- Update agents when corresponding documentation changes significantly
- Review integration points quarterly
- Add new agents for new markdown files
- Archive agents when corresponding markdown files are deprecated

---

**Last Updated**: 2025-11-19
**Status**: Initial agent definitions created
**Next Steps**: Implement agent-specific workflows and decision trees
