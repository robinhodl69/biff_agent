import express, { Request, Response } from 'express'
import { paymentMiddleware } from 'x402-express'
import { config } from '../config'
import { logger } from '../logger'
import { globalStats } from '../state'

const app = express()

async function floeQuery(endpoint: string, params: any) {
  logger.info(`Floe API Query: ${endpoint}`, { params })
  return { ltv: 65, daysRemaining: 10, status: 'HEALTHY' }
}

/**
 * startApiServer: Servidor Express con validación y x402.
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
      if (!loanId && !target) {
        return res.status(400).json({ error: 'Missing loanId or walletAddress query param' })
      }

      const data = await floeQuery('checkcreditstatus', { loanId, target })
      globalStats.totalApiEarnings += 0.10
      res.json({ ...data, recommendation: 'HEALTHY: No immediate risk detected' })
    } catch (error: any) {
      logger.error('API /loan-health error', { error: error.message })
      res.status(500).json({ error: 'Internal intelligence error' })
    }
  })

  app.get('/intent-intel', x402(0.05), async (req: Request, res: Response) => {
    try {
      const { amount } = req.query
      if (!amount) return res.status(400).json({ error: 'Missing amount query param' })

      await floeQuery('getintentbook', req.query)
      globalStats.totalApiEarnings += 0.05
      res.json({ avgRate: 0.12, bestRate: 0.10, recommendation: 'Favorable liquidity conditions' })
    } catch (error: any) {
      logger.error('API /intent-intel error', { error: error.message })
      res.status(500).json({ error: 'Internal intelligence error' })
    }
  })

  app.listen(config.API_PORT, () => {
    logger.info(`x402 API Server running on port ${config.API_PORT}`)
  })
}
