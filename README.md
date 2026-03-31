# Biff Monorepo

Autonomous financial agent + live dashboard for managing treasury, credit, and intelligence monetization on Base.

## Structure

```
biff_agent/
├── agent/                    # 🤖 Biff Agent (LangGraph + CDP + Floe)
│   ├── src/                  # Agent source code
│   │   ├── store.ts          # State persistence + runtime config
│   │   ├── nodes/serve.ts    # Admin API + static file server
│   │   └── ...
│   ├── tests/                # 83 unit tests
│   ├── scripts/              # Utility scripts
│   └── data/                 # Local persistence (gitignored)
├── frontend/                 # 🖥️ Dashboard (React + Vite + Tailwind)
│   └── src/pages/
│       ├── Home.jsx          # ASCII Biff hero
│       ├── HowItWorks.jsx    # Agent explanation
│       ├── Tracking.jsx      # 7 public dashboards
│       └── Admin.jsx         # Auth + controls
└── railway.json              # Deploy config
```

## Quick Start

```bash
# Install all workspaces
npm install

# Build everything
npm run build

# Run agent (includes API server + frontend)
npm run dev:agent

# Run tests
npm test
```

## Agent

Autonomous financial agent built on **LangGraph** with a cyclic execution model:

1. **Perception** — On-chain balances, Chainlink oracles, Floe loan positions
2. **Reasoning** — Anthropic Claude Sonnet evaluates state against financial rules
3. **Action** — Executes on-chain transactions (borrow, collateral, repay)

See [agent/README.md](agent/README.md) for detailed documentation.

## Frontend

### Public Pages

| Route           | Description                               |
| --------------- | ----------------------------------------- |
| `/`             | Home — ASCII Biff art + navigation        |
| `/how-it-works` | Agent architecture and tech stack         |
| `/tracking`     | Live dashboards (7 widgets, auto-refresh) |

### Admin Panel

| Route    | Access                  | Features                                    |
| -------- | ----------------------- | ------------------------------------------- |
| `/admin` | `ADMIN_SECRET` required | Pause/resume, force actions, config updates |

### Dashboards

1. **Agent Vitality** — Status, uptime, cycle count
2. **Portfolio** — USDC, WETH, total value
3. **Loan Health** — LTV gauges, countdown, principal/collateral
4. **Performance** — Success rate, errors, last action
5. **Action Distribution** — Pie chart of agent decisions
6. **USDC History** — Line chart of balance over time
7. **Recent Activity** — Timeline of last 30 cycles

## Admin API

| Endpoint                 | Auth     | Description                  |
| ------------------------ | -------- | ---------------------------- |
| `GET /api/state`         | Public   | Current agent state          |
| `GET /api/history`       | Public   | Cycle history                |
| `GET /api/config`        | Public   | Runtime configuration        |
| `POST /api/auth`         | —        | Login with ADMIN_SECRET      |
| `POST /api/pause`        | Required | Pause agent loop             |
| `POST /api/resume`       | Required | Resume agent loop            |
| `POST /api/force-cycle`  | Required | Execute cycle immediately    |
| `POST /api/force-action` | Required | Override LLM decision        |
| `POST /api/config`       | Required | Update thresholds + interval |

## Deploy to Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Set environment variables:
   - `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`
   - `LLM_PROVIDER`, `LLM_API_KEY`
   - `ADMIN_SECRET` (your admin password)
   - `NETWORK_ID=base-sepolia`
3. Deploy from `main` branch
4. The `railway.json` handles build + start automatically

## Protocol Attribution

- **Network**: Base
- **Intelligence**: Anthropic Claude
- **Infrastructure**: Coinbase Developer Platform (CDP)
- **Oracle**: Chainlink
- **Liquidity**: Floe Finance
- **Payments**: x402
