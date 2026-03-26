import 'dotenv/config'

export const config = {
  // Coinbase CDP
  CDP_API_KEY_ID: process.env.CDP_API_KEY_ID || '',
  CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET || '',
  CDP_WALLET_SECRET: process.env.CDP_WALLET_SECRET || '',

  // LLM
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Network
  NETWORK_ID: process.env.NETWORK_ID || 'base-sepolia',

  // Agent Config
  MIN_USDC_BALANCE: Number(process.env.MIN_USDC_BALANCE) || 100,
  MAX_LTV: Number(process.env.MAX_LTV) || 70,
  LOAN_WARN_DAYS: Number(process.env.LOAN_WARN_DAYS) || 2,
  AGENT_LOOP_INTERVAL: Number(process.env.AGENT_LOOP_INTERVAL) || 300000,

  // API Server
  API_PORT: Number(process.env.API_PORT) || 3000
}

export function getLLM() {
  // TODO: implement based on provider
  return null
}
