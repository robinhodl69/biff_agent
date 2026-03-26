import { StateGraph, START, END } from '@langchain/langgraph'
import { BiffStateAnnotation, initialState } from './state'
import { monitorState } from './nodes/monitor'
import { evaluateDecision } from './nodes/evaluate'
import { requestCredit } from './nodes/credit'
import { addCollateral, repayOrRenew } from './nodes/payments'
import { startApiServer } from './nodes/serve'
import { initWallet } from './wallet'
import { config } from './config'
import { logger } from './logger'

/** Nodo para idle (sin acción onchain) */
async function idleNode() { 
  return { lastAction: 'idle' } 
}

/** Nodo final para registro y auditoría */
async function logOperation(state: typeof BiffStateAnnotation.State) {
  logger.info('Cycle Summary', { 
    action: state.lastAction, 
    reason: state.actionReason,
    usdc: state.usdcBalance,
    earnings: state.totalApiEarnings
  })
  return { 
    operationLog: [
      ...state.operationLog, 
      { timestamp: new Date().toISOString(), action: state.lastAction, result: state.actionReason }
    ] 
  }
}

// Configuración del Grafo
const workflow = new StateGraph(BiffStateAnnotation)
  .addNode('monitor', monitorState)
  .addNode('evaluate', evaluateDecision)
  .addNode('request_credit', requestCredit)
  .addNode('add_collateral', addCollateral)
  .addNode('repay_or_renew', repayOrRenew)
  .addNode('idle', idleNode)
  .addNode('log_operation', logOperation)
  .addEdge(START, 'monitor')
  .addEdge('monitor', 'evaluate')
  .addConditionalEdges('evaluate', (state) => state.lastAction as any)
  .addEdge('request_credit', 'log_operation')
  .addEdge('add_collateral', 'log_operation')
  .addEdge('repay_or_renew', 'log_operation')
  .addEdge('idle', 'log_operation')
  .addEdge('log_operation', END)

const app = workflow.compile()

async function main() {
  try {
    logger.info('Biff Agent Bootstrap starting...')
    const wallet = await initWallet()
    
    // Inicia el servidor API en paralelo
    startApiServer(wallet.getAddress())

    // Loop principal del Agente
    while (true) {
      try {
        logger.info('--- Starting Agent Cycle ---')
        await app.invoke(initialState)
      } catch (error: any) {
        logger.error('Cycle failed, continuing...', { error: error.message })
      }
      await new Promise(resolve => setTimeout(resolve, config.AGENT_LOOP_INTERVAL_MS))
    }
  } catch (error: any) {
    logger.error('Fatal bootstrap error', { error: error.message })
    process.exit(1)
  }
}

main()
