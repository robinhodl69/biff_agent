import { BiffState, globalStats } from '../state'
import { getBalances, getWalletClient } from '../wallet'
import { config } from '../config'
import { logger } from '../logger'
import { Loan, FloeLoan, FloeLoanStatus } from '../types/floe'

const ORACLE_ABI = [{
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

const MATCHER_ABI = [
  {
    name: 'getLoanIdsByUser',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    name: 'getLoan',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'loanId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'loanId', type: 'uint256' },
      { name: 'lender', type: 'address' },
      { name: 'borrower', type: 'address' },
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'interestRateBps', type: 'uint256' },
      { name: 'ltvBps', type: 'uint256' },
      { name: 'liquidationLtvBps', type: 'uint256' },
      { name: 'marketFeeBps', type: 'uint256' },
      { name: 'matcherCommissionBps', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'repaid', type: 'bool' }
    ] }]
  }
] as const

/**
 * monitorState: Nodo de percepción que actualiza balances, precios y salud de préstamos reales.
 */
export async function monitorState(_state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: monitor_state - Updating real perceptions')
  
  try {
    const client = getWalletClient()
    
    // 1. Obtener balances y precio de WETH en paralelo
    const [balances, priceData] = await Promise.all([
      getBalances(),
      client.readContract({
        address: config.PRICE_ORACLE,
        abi: ORACLE_ABI,
        functionName: 'latestRoundData'
      })
    ]) as [any, any[]]
    
    const wethPriceUSD = Number(priceData[1]) / 1e8

    // 2. Obtener préstamos activos reales de Floe
    const activeLoans = await fetchFloeLoans(client.getAddress() as `0x${string}`, wethPriceUSD)

    logger.info('Real perceptions updated', { 
      usdc: balances.usdc, 
      price: wethPriceUSD,
      loans: activeLoans.length,
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
    logger.error('Real perception cycle failed', { error: error.message })
    return { lastAction: 'monitor_error' }
  }
}

/**
 * Consulta LendingIntentMatcher para obtener préstamos reales.
 */
async function fetchFloeLoans(address: `0x${string}`, currentPrice: number): Promise<FloeLoan[]> {
  const client = getWalletClient()
  
  try {
    const loanIds = await client.readContract({
      address: config.LENDING_INTENT_MATCHER,
      abi: MATCHER_ABI,
      functionName: 'getLoanIdsByUser',
      args: [address]
    }) as bigint[]

    const loansRaw = await Promise.all(
      loanIds.map(id => client.readContract({
        address: config.LENDING_INTENT_MATCHER,
        abi: MATCHER_ABI,
        functionName: 'getLoan',
        args: [id]
      }))
    ) as Loan[]

    return loansRaw
      .filter(l => !l.repaid)
      .map(l => {
        const principal = Number(l.principal) / 1e6
        const collateral = Number(l.collateralAmount) / 1e18
        // Recalcular LTV real basado en el precio actual
        const currentLtv = (principal / (collateral * currentPrice)) * 100
        
        const now = Math.floor(Date.now() / 1000)
        const expiry = Number(l.startTime) + Number(l.duration)
        const daysRemaining = Math.max(0, (expiry - now) / 86400)

        return {
          id: l.loanId.toString(),
          principal,
          collateral,
          ltv: currentLtv,
          daysRemaining,
          status: FloeLoanStatus.ACTIVE
        }
      })
  } catch (error: any) {
    logger.error('Error fetching real Floe loans', { error: error.message })
    return []
  }
}
