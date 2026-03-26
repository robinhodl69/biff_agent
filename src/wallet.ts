import { CdpWalletProvider } from '@coinbase/agentkit'
import { config } from './config'
import { logger } from './logger'

export async function setupWallet() {
  try {
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: config.CDP_API_KEY_ID,
      apiKeyPrivateKey: config.CDP_API_KEY_SECRET,
      networkId: config.NETWORK_ID,
      cdpWalletData: config.CDP_WALLET_SECRET
    })
    
    logger.info('Wallet setup successful')
    return walletProvider
  } catch (error) {
    logger.error('Failed to setup wallet:', error)
    throw error
  }
}
