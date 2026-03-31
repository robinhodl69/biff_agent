import { vi } from "vitest";

// Set required environment variables before any imports
process.env.CDP_API_KEY_ID = "test_key_id";
process.env.CDP_API_KEY_SECRET = "test_secret";
process.env.CDP_WALLET_SECRET = "test_wallet_secret";
process.env.NETWORK_ID = "base-sepolia";
process.env.LLM_PROVIDER = "anthropic";
process.env.LLM_API_KEY = "test_api_key";
process.env.LLM_MODEL = "claude-sonnet-4-20250514";
process.env.CHAINLINK_WETH_USD_FEED =
  "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
