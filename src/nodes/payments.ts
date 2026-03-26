import { BiffState } from '../state'
import { config } from '../config'
import { logger } from '../logger'

/**
 * addCollateral: Incrementa el colateral de un préstamo con riesgo de liquidación.
 */
export async function addCollateral(state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: add_collateral - Mitigating liquidation risk')
  try {
    const atRiskLoan = state.activeLoans.find(l => l.ltv > config.MAX_LTV)
    if (!atRiskLoan) return { lastAction: 'idle' }

    logger.info('Adding WETH collateral to loan', { loanId: atRiskLoan.id })
    // TODO: Ejecutar transacción on-chain hacia Floe AddCollateral
    
    return { 
      lastAction: 'collateral_added',
      actionReason: `LTV de préstamo ${atRiskLoan.id} corregido.`
    }
  } catch (error: any) {
    logger.error('Failed to add collateral', { error: error.message })
    return { lastAction: 'payment_error' }
  }
}

/**
 * repayOrRenew: Decide si repagar o renovar una línea de crédito próxima a vencer.
 */
export async function repayOrRenew(state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: repay_or_renew - Managing expiring loans')
  const shouldRepay = state.usdcBalance > (config.MIN_USDC_BALANCE * 3)

  return {
    lastAction: shouldRepay ? 'repaid' : 'renewed',
    actionReason: shouldRepay ? 'Suficiente USDC para repagar.' : 'Renovando para mantener liquidez.'
  }
}

/**
 * processPayment: Placeholder para pagos x402 salientes.
 */
export async function processPayment(_state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: process_payment - Handling outgoing x402 request')
  return { lastAction: 'payment_processed' }
}
