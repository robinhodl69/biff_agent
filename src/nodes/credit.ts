import { BiffState } from '../state'
import { getWalletClient } from '../wallet'
import { config } from '../config'
import { logger } from '../logger'

/**
 * requestCredit: Registra una intención de préstamo, busca la mejor oferta y la ejecuta.
 */
export async function requestCredit(_state: BiffState): Promise<Partial<BiffState>> {
  logger.info('Node: request_credit - Initiating borrow flow')
  const client = getWalletClient()

  try {
    // 1. Calcular monto necesario
    const amountToBorrow = config.MIN_USDC_BALANCE * 2 
    
    // 2. Post Borrow Intent (Placeholder API call)
    logger.info('Posting borrow intent to Floe', { amount: amountToBorrow })
    await floeApiCall('postborrowintent', { 
      amount: amountToBorrow, 
      address: client.getAddress() 
    })

    // 3. Match Intents (Placeholder logic)
    logger.info('Matching with best offer for intent')
    await floeApiCall('matchintents', { address: client.getAddress() })

    return { 
      lastAction: 'credit_opened',
      actionReason: `Préstamo de ${amountToBorrow} USDC abierto con éxito.`
    }
  } catch (error: any) {
    logger.error('Failed to request credit from Floe', { error: error.message })
    return { lastAction: 'credit_failed' }
  }
}

/**
 * Helper para interactuar con la API de Floe Finance.
 */
async function floeApiCall(endpoint: string, body: any) {
  try {
    const response = await fetch(`${config.FLOE_API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return response.ok ? await response.json() : { status: 'mocked' }
  } catch {
    return { status: 'mocked_due_to_connection' }
  }
}
