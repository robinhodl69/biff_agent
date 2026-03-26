import { CdpWalletProvider } from '@coinbase/agentkit'
import { config } from './config'
import { logger } from './logger'

let walletProvider: CdpWalletProvider | null = null

/**
 * Inicializa el CdpWalletProvider con las credenciales de CDP.
 */
export async function initWallet(): Promise<CdpWalletProvider> {
  try {
    walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: config.CDP_API_KEY_NAME,
      apiKeyPrivateKey: config.CDP_API_KEY_PRIVATE_KEY,
      networkId: config.NETWORK_ID
    })
    logger.info('CDP Wallet initialized', { address: walletProvider.getAddress() })
    return walletProvider
  } catch (error) {
    logger.error('Failed to initialize CDP Wallet', { error })
    throw error
  }
}

/**
 * Exporta el provider actual para uso en otros módulos.
 */
export function getWalletClient(): CdpWalletProvider {
  if (!walletProvider) throw new Error('Wallet not initialized. Call initWallet() first.')
  return walletProvider
}

/**
 * Lee balances reales de USDC y WETH en Base Sepolia.
 */
export async function getBalances(): Promise<{ usdc: number; weth: number }> {
  const client = getWalletClient()
  try {
    const abi = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const
    
    const usdcRaw = await client.readContract({
      address: config.USDC_ADDRESS as `0x${string}`,
      abi, 
      functionName: 'balanceOf', 
      args: [client.getAddress() as `0x${string}`]
    }) as bigint

    const wethRaw = await client.readContract({
      address: config.WETH_ADDRESS as `0x${string}`,
      abi, 
      functionName: 'balanceOf', 
      args: [client.getAddress() as `0x${string}`]
    }) as bigint

    return {
      usdc: Number(usdcRaw) / 1e6, // USDC has 6 decimals
      weth: Number(wethRaw) / 1e18  // WETH has 18 decimals
    }
  } catch (error) {
    logger.error('Error fetching onchain balances', { error })
    return { usdc: 0, weth: 0 }
  }
}
