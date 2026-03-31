# Biff Agent

Biff Agent is an autonomous financial entity deployed on the Base network. It is engineered to manage its own treasury, maintain liquidity through decentralized credit markets, and monetize its internal financial reasoning via micro-payment protocols.

## Core Capabilities

*   **Liquidity Optimization**: Monitors USDC reserves and autonomously initiates borrowing cycles via the Floe protocol when capital falls below predefined thresholds.
*   **Risk Management**: Integrates real-time Chainlink Data Feeds to calculate Loan-to-Value (LTV) ratios. The agent proactively adds collateral to prevent liquidation during market volatility.
*   **Intelligence Monetization**: Operates a specialized API server utilizing the x402 protocol, allowing external agents to purchase lending market insights and loan health diagnostics.

## Technical Architecture

### Stateful Agentic Loop
Biff Agent is built on **LangGraph**, utilizing a cyclic execution model. Unlike linear bots, the agent maintains a persistent state across iterations, allowing it to track the results of previous actions and adjust its strategy dynamically. The lifecycle is divided into three primary phases:
1.  **Perception**: Direct on-chain synchronization of wallet balances and active loan positions combined with Chainlink oracle price data.
2.  **Reasoning**: High-fidelity evaluation using **Anthropic Claude 3.5 Sonnet**. The model processes the synchronized state against financial rulesets to produce deterministic, schema-validated decisions.
3.  **Action**: Automated execution of smart contract interactions on Base using the Coinbase AgentKit.

### Secure Wallet Infrastructure
The agent utilizes the **Coinbase CDP SDK v2 (Server Wallets)**. This architecture ensures that private keys remain within Coinbase's Secure Enclave while providing the agent with a persistent identity.
*   **Idempotency Strategy**: Development environments utilize unique idempotency keys to prevent redundant wallet creation and rate-limiting issues.
*   **Enterprise Persistence**: Production environments can be locked to a specific wallet address, ensuring the agent maintains control over a consistent capital pool.

### Financial Logic & Integration
*   **Blockchain**: Base (Sepolia for staging, Mainnet for production).
*   **Oracles**: Chainlink WETH/USD Aggregator for real-time collateral valuation.
*   **Lending Protocol**: Floe P2P lending integration for customized credit matching.
*   **Communication**: x402-express middleware for pay-per-request API services.

## Working Capital & Credit Strategy

Biff Agent is engineered to function as a primary participant in the **Floe Agent Working Capital Facility**, utilizing decentralized credit as its operational engine.

### Operational Utility
The agent utilizes USDC credit lines to fund its core value-creation activities:
*   **Inference Funding**: Securing high-fidelity reasoning cycles via Anthropic Claude 3.5 Sonnet.
*   **Service Uptime**: Maintaining the availability of its proprietary Intelligence API.
*   **Protocol Settlement**: Covering x402 micro-payments and on-chain execution costs.

### Credit Decision Loop
The reasoning engine (LangGraph) evaluates capital requirements in every execution cycle:
*   **Liquidity Thresholds**: Borrowing is triggered autonomously when USDC reserves fall below the `MIN_USDC_BALANCE` configuration.
*   **Risk Mitigation**: Proactive LTV management ensures collateral ratios are adjusted in real-time based on Chainlink price volatility.
*   **Autonomous Repayment**: Debt servicing is powered by organic revenue accumulated through the x402 intelligence monetization layer.

### Integration & Validation Readiness
*   **SDK Alignment**: Architected to validate Floe's next-generation AgentKit actions including `requestcredit`, `checkcreditstatus`, and `renewcredit_line`.
*   **Signature Standard**: Ready for **ERC-1271** smart contract wallet validation via Coinbase CDP v2 managed infrastructure.

## Operational Workflow

1.  **Monitor State**: The agent retrieves USDC and WETH balances and queries the Floe Matcher contract for active loan metadata.
2.  **Evaluate Risk**: The perception data is injected into the LLM context. The agent assesses if current LTVs are within safety margins or if new credit is required for operational liquidity.
3.  **Execute Decision**: If a threshold is breached, the agent signs and broadcasts the necessary transaction (borrow, repay, or add collateral).
4.  **Log & Iterate**: All actions and reasoning are recorded in a stateful log before the next cycle begins after a configurable interval.

## Deployment Requirements

*   **Runtime**: Node.js 20+
*   **Environment Configuration**:
    *   `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET`: Authentication for Coinbase CDP.
    *   `CDP_WALLET_SECRET`: Encryption key for the managed server wallet.
    *   `ANTHROPIC_API_KEY`: Access to Claude 3.5 Sonnet reasoning engine.
    *   `CHAINLINK_WETH_USD_FEED`: Verified contract address for price data.

## Protocol Attribution

*   **Network**: Base
*   **Intelligence**: Anthropic Claude 3.5
*   **Infrastructure**: Coinbase Developer Platform (CDP)
*   **Oracle**: Chainlink
*   **Liquidity**: Floe Finance
*   **Payments**: x402
