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

  // Chainlink & Contracts (Base Sepolia defaults)
  FLOE_API_URL: process.env.FLOE_API_URL || 'https://api.floe.finance/v1',
  CHAINLINK_WETH_USD_FEED: process.env.CHAINLINK_WETH_USD_FEED || '0x4aDC43ef89031E254850DdBC94a9257CBA240f27',
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  WETH_ADDRESS: '0x4200000000000000000000000000000000000006'
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
  
  throw new Error(`LLM provider ${provider} not implemented in Phase 3.`)
}
