import { CdpWalletProvider } from '@coinbase/agentkit'
import { config } from './config'
import { logger } from './logger'

let walletProvider: CdpWalletProvider | null = null

const DECIMALS = {
  USDC: 6,
  WETH: 18
}

/**
 * Inicializa el CdpWalletProvider con las credenciales de CDP.
 */
export async function initWallet(): Promise<CdpWalletProvider> {
  if (walletProvider) return walletProvider

  try {
    walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: config.CDP_API_KEY_NAME,
      apiKeyPrivateKey: config.CDP_API_KEY_PRIVATE_KEY,
      networkId: config.NETWORK_ID
    })
    logger.info('CDP Wallet initialized', { 
      address: walletProvider.getAddress(),
      network: config.NETWORK_ID 
    })
    return walletProvider
  } catch (error: any) {
    logger.error('Failed to initialize CDP Wallet', { message: error.message })
    throw new Error(`Wallet Initialization Error: ${error.message}`)
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
    
    // Ejecutar lecturas en paralelo para eficiencia
    const [usdcRaw, wethRaw] = await Promise.all([
      client.readContract({
        address: config.USDC_ADDRESS as `0x${string}`,
        abi, functionName: 'balanceOf', args: [client.getAddress() as `0x${string}`]
      }),
      client.readContract({
        address: config.WETH_ADDRESS as `0x${string}`,
        abi, functionName: 'balanceOf', args: [client.getAddress() as `0x${string}`]
      })
    ]) as [bigint, bigint]

    return {
      usdc: Number(usdcRaw) / Math.pow(10, DECIMALS.USDC),
      weth: Number(wethRaw) / Math.pow(10, DECIMALS.WETH)
    }
  } catch (error: any) {
    logger.error('Error fetching onchain balances', { message: error.message })
    throw new Error(`Blockchain Reading Error: ${error.message}`)
  }
}
