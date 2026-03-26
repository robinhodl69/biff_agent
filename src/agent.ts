import { StateGraph, START, END } from '@langchain/langgraph'
import { BiffStateAnnotation, BiffState, initialState } from './state'
import { monitorState } from './nodes/monitor'
import { evaluateDecision } from './nodes/evaluate'
import { requestCredit, addCollateral, repayOrRenew } from './nodes/credit'
import { logger } from './logger'
import { config } from './config'
import express, { Request, Response } from 'express'

// LangGraph setup
const workflow = new StateGraph(BiffStateAnnotation)
  .addNode('monitor', monitorState)
  .addNode('evaluate', evaluateDecision)
  .addNode('request_credit', requestCredit)
  .addNode('add_collateral', addCollateral)
  .addNode('repay_or_renew', repayOrRenew)
  .addEdge(START, 'monitor')
  .addEdge('monitor', 'evaluate')
  .addConditionalEdges('evaluate', (state) => {
    if (state.lastAction === 'request_credit') return 'request_credit'
    if (state.lastAction === 'add_collateral') return 'add_collateral'
    if (state.lastAction === 'repay_or_renew') return 'repay_or_renew'
    return END
  })
  .addEdge('request_credit', END)
  .addEdge('add_collateral', END)
  .addEdge('repay_or_renew', END)

const app = workflow.compile()

// API Server setup
const server = express()
server.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

async function main() {
  logger.info('Biff Agent starting...')
  
  // Start API Server
  server.listen(config.API_PORT, () => {
    logger.info(`API Server running on port ${config.API_PORT}`)
  })

  // Start Agent Loop
  while (true) {
    try {
      logger.info('Starting agent cycle...')
      await app.invoke(initialState)
      logger.info('Cycle complete, waiting...')
    } catch (error) {
      logger.error('Error in agent cycle:', error)
    }
    await new Promise(resolve => setTimeout(resolve, config.AGENT_LOOP_INTERVAL))
  }
}

main().catch(error => {
  logger.error('Fatal error:', error)
  process.exit(1)
})
