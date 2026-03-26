import express, { Request, Response } from 'express'
import { paymentMiddleware } from 'x402-express'
import { config } from '../config'
import { logger } from '../logger'
import { globalStats } from '../state'

const app = express()

async function floeQuery(endpoint: string, _params: any) {
  logger.info(`Floe API Query: ${endpoint}`)
  return { ltv: 65, daysRemaining: 10, status: 'HEALTHY' }
}

/**
 * Inicia el servidor API monetizado con x402.
 */
export function startApiServer(walletAddress: string) {
  const x402 = (amount: number) => paymentMiddleware({
    amount,
    tokenAddress: config.USDC_ADDRESS,
    recipient: walletAddress as `0x${string}`
  })

  app.get('/loan-health', x402(0.10), async (req: Request, res: Response) => {
    try {
      const { loanId, walletAddress: target } = req.query
      const data = await floeQuery('checkcreditstatus', { loanId, target })
      
      globalStats.totalApiEarnings += 0.10
      res.json({ 
        ...data, 
        recommendation: data.ltv > 70 ? 'DANGER: Add collateral' : 'HEALTHY: No action needed' 
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  app.get('/intent-intel', x402(0.05), async (req: Request, res: Response) => {
    try {
      await floeQuery('getintentbook', req.query)
      globalStats.totalApiEarnings += 0.05
      res.json({ 
        topOffers: [], 
        avgRate: 0.12, 
        bestRate: 0.10, 
        recommendation: 'Good market liquidity available' 
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  app.listen(config.API_PORT, () => {
    logger.info(`x402 API Server running on port ${config.API_PORT}`)
  })
}
