import { CdpEvmWalletProvider } from '@coinbase/agentkit'
import { config } from './config'
import { logger } from './logger'

let walletProvider: CdpEvmWalletProvider | null = null

const DECIMALS = {
  USDC: 6,
  WETH: 18
}

/**
 * Inicializa el CdpEvmWalletProvider con las credenciales de CDP v2.
 * Usa una estrategia de idempotencia para desarrollo y dirección fija para producción.
 */
export async function initWallet(): Promise<CdpEvmWalletProvider> {
  if (walletProvider) return walletProvider

  try {
    const providerConfig: any = {
      apiKeyId: config.CDP_API_KEY_ID,
      apiKeySecret: config.CDP_API_KEY_SECRET,
      walletSecret: config.CDP_WALLET_SECRET,
      networkId: config.NETWORK_ID,
    }

    // Estrategia de Lifecycle:
    // 1. Si hay una dirección fija (Prod), la usamos para reusar el wallet.
    // 2. Si no, usamos la llave de idempotencia (Dev) para evitar duplicados.
    if (config.WALLET_ADDRESS) {
      providerConfig.address = config.WALLET_ADDRESS as `0x${string}`
      logger.info('Using existing wallet address', { address: config.WALLET_ADDRESS })
    } else if (config.WALLET_IDEMPOTENCY_KEY) {
      providerConfig.idempotencyKey = config.WALLET_IDEMPOTENCY_KEY
      logger.info('Using wallet idempotency key', { key: config.WALLET_IDEMPOTENCY_KEY })
    }

    walletProvider = await CdpEvmWalletProvider.configureWithWallet(providerConfig)
    
    logger.info('CDP v2 Wallet initialized', { 
      address: walletProvider.getAddress(),
      network: config.NETWORK_ID 
    })
    
    return walletProvider
  } catch (error: any) {
    logger.error('Failed to initialize CDP v2 Wallet', { message: error.message })
    throw new Error(`Wallet v2 Initialization Error: ${error.message}`)
  }
}

/**
 * Exporta el provider actual para uso en otros módulos.
 */
export function getWalletClient(): CdpEvmWalletProvider {
  if (!walletProvider) throw new Error('Wallet not initialized. Call initWallet() first.')
  return walletProvider
}

/**
 * Lee balances reales de USDC y WETH usando el provider moderno.
 */
export async function getBalances(): Promise<{ usdc: number; weth: number }> {
  const client = getWalletClient()
  try {
    const abi = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const
    
    const [usdcRaw, wethRaw] = await Promise.all([
      client.readContract({
        address: config.USDC_ADDRESS,
        abi, 
        functionName: 'balanceOf', 
        args: [client.getAddress() as `0x${string}`]
      }),
      client.readContract({
        address: config.WETH_ADDRESS,
        abi, 
        functionName: 'balanceOf', 
        args: [client.getAddress() as `0x${string}`]
      })
    ]) as [bigint, bigint]

    return {
      usdc: Number(usdcRaw) / Math.pow(10, DECIMALS.USDC),
      weth: Number(wethRaw) / Math.pow(10, DECIMALS.WETH)
    }
  } catch (error: any) {
    logger.error('Error fetching onchain balances with v2 provider', { message: error.message })
    throw new Error(`Blockchain Reading Error: ${error.message}`)
  }
}
