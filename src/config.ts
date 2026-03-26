import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'

const requiredEnv = [
  'CDP_API_KEY_NAME',
  'CDP_API_KEY_PRIVATE_KEY',
  'NETWORK_ID',
  'LLM_PROVIDER',
  'LLM_API_KEY'
] as const

for (const env of requiredEnv) {
  if (!process.env[env]) {
    throw new Error(`CRITICAL: Missing required environment variable: ${env}`)
  }
}

export const config = {
  // Required
  CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME!,
  CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  NETWORK_ID: process.env.NETWORK_ID!,
  LLM_PROVIDER: process.env.LLM_PROVIDER!,
  LLM_API_KEY: process.env.LLM_API_KEY!,
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',

  // Optional with defaults
  MIN_USDC_BALANCE: Number(process.env.MIN_USDC_BALANCE) || 50,
  MAX_LTV: Number(process.env.MAX_LTV) || 70,
  LOAN_WARN_DAYS: Number(process.env.LOAN_WARN_DAYS) || 3,
  AGENT_LOOP_INTERVAL_MS: (Number(process.env.AGENT_LOOP_INTERVAL_MIN) || 5) * 60 * 1000,
  API_PORT: Number(process.env.API_PORT) || 3000,

  // Floe Protocol - Base Sepolia
  FLOE_API_URL: process.env.FLOE_API_URL || 'https://api.floe.finance/v1',
  LENDING_INTENT_MATCHER: '0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E' as `0x${string}`,
  PRICE_ORACLE: '0x71020b939b1f0988b2d93c2d930fea5b370203a5' as `0x${string}`,
  
  // Chainlink WETH/USD Feed (used as fallback or for direct checks)
  CHAINLINK_WETH_USD_FEED: '0x4aDC43ef89031E254850DdBC94a9257CBA240f27',
  
  // Tokens
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
  WETH_ADDRESS: '0x4200000000000000000000000000000000000006' as `0x${string}`,

  // Protocol Constants
  MIN_LTV_GAP_BPS: 800,
  GRACE_PERIOD: 86400,
  LIQUIDATION_BONUS_BPS: 500
} as const

export function getLLM() {
  const provider = config.LLM_PROVIDER.toLowerCase()
  
  if (provider === 'openai') {
    return new ChatOpenAI({
      modelName: config.LLM_MODEL,
      openAIApiKey: config.LLM_API_KEY,
      temperature: 0
    })
  }

  if (provider === 'moonshot') {
    return new ChatOpenAI({
      modelName: process.env.LLM_MODEL || 'kimi-k2.5',
      apiKey: config.LLM_API_KEY,
      configuration: {
        baseURL: 'https://api.moonshot.ai/v1'
      },
      temperature: 0
    })
  }
  
  throw new Error(`LLM provider ${provider} not implemented.`)
}
