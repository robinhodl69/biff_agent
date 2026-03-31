import { config } from '../src/config'
import { initWallet } from '../src/wallet'

async function main() {
  console.log('--- Diagnostic (CDP v2) ---')
  console.log('NETWORK_ID:', config.NETWORK_ID)
  console.log('CDP_API_KEY_ID length:', config.CDP_API_KEY_ID?.length || 0)
  console.log('WALLET_ADDRESS:', config.WALLET_ADDRESS || '(not set)')
  console.log('WALLET_IDEMPOTENCY_KEY:', config.WALLET_IDEMPOTENCY_KEY || '(not set)')
  console.log('---------------------------')

  if (!config.CDP_API_KEY_ID || !config.CDP_API_KEY_SECRET) {
    console.error('Error: Variables de CDP v2 no detectadas por el proceso.')
    process.exit(1)
  }

  try {
    const wallet = await initWallet()
    console.log(`\nWALLET_ADDRESS: ${wallet.getAddress()}\n`)
    process.exit(0)
  } catch (error: any) {
    console.error('\nError de CDP:', error.message)
    process.exit(1)
  }
}

main()
