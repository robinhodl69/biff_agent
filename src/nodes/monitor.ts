import { BiffState, globalStats } from '../state'
import { getBalances, getWalletClient } from '../wallet'
import { config } from '../config'
import { logger } from '../logger'

const CHAINLINK_ABI = [{
  name: 'latestRoundData',
  type: 'function',
  stateMutability: 'view',
  inputs: [],
  outputs: [
    { name: 'roundId', type: 'uint80' },
    { name: 'answer', type: 'int256' },
    { name: 'startedAt', type: 'uint256' },
    { name: 'updatedAt', type: 'uint256' },
    { name: 'answeredInRound', type: 'uint80' }
  ]
}] as const

/**
 * monitorState: Nodo de percepción que actualiza balances, precios y salud de préstamos.
 */
export async function monitorState(_state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: monitor_state - Updating perceptions')
  
  try {
    const balances = await getBalances()
    const client = getWalletClient()
    
    const priceData = await client.readContract({
      address: config.CHAINLINK_WETH_USD_FEED as `0x${string}`,
      abi: CHAINLINK_ABI,
      functionName: 'latestRoundData'
    }) as any[]
    
    const wethPriceUSD = Number(priceData[1]) / 1e8
    const activeLoans = await fetchFloeLoans(client.getAddress(), wethPriceUSD)

    logger.info('Perceptions updated successfully', { 
      usdc: balances.usdc, 
      price: wethPriceUSD,
      apiEarnings: globalStats.totalApiEarnings
    })

    return {
      usdcBalance: balances.usdc,
      wethBalance: balances.weth,
      wethPriceUSD,
      activeLoans,
      totalApiEarnings: globalStats.totalApiEarnings,
      lastAction: 'monitor'
    }
  } catch (error: any) {
    logger.error('Error in monitor_state node', { message: error.message })
    return { lastAction: 'monitor_error' }
  }
}

async function fetchFloeLoans(_address: string, _currentPrice: number) {
  return [] 
}
