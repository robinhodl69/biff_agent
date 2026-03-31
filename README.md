# Biff Monorepo

Autonomous financial agent + dashboard for managing treasury, credit, and intelligence monetization on Base.

## Structure

```
biff_agent/
├── agent/              # 🤖 Biff Agent (LangGraph + CDP + Floe)
│   ├── src/            # Agent source code
│   ├── tests/          # Unit tests (83 tests)
│   └── scripts/        # Utility scripts
└── frontend/           # 🖥️ Dashboard (coming soon)
```

## Quick Start

```bash
# Install all workspaces
npm install

# Run agent
npm run dev:agent

# Run tests
npm test

# Build
npm run build
```

## Agent

See [agent/README.md](agent/README.md) for detailed documentation on:

- Core capabilities (liquidity optimization, risk management, intelligence monetization)
- Technical architecture (LangGraph cyclic loop, CDP wallet infrastructure)
- Financial logic (Floe P2P lending, Chainlink oracles, x402 payments)
- Deployment requirements

## Frontend

Dashboard for visualizing agent state, balances, loan health, and API earnings. **Coming soon.**

## Development

```bash
# Watch mode
npm run dev:agent

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Protocol Attribution

- **Network**: Base
- **Intelligence**: Anthropic Claude 3.5
- **Infrastructure**: Coinbase Developer Platform (CDP)
- **Oracle**: Chainlink
- **Liquidity**: Floe Finance
- **Payments**: x402
