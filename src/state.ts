import { Annotation } from '@langchain/langgraph'

/** Acciones posibles que el agente puede decidir ejecutar */
export type BiffAction = 
  | 'monitor' 
  | 'evaluate' 
  | 'request_credit' 
  | 'add_collateral' 
  | 'repay_or_renew' 
  | 'idle' 
  | 'START' 
  | 'monitor_error' 
  | 'credit_opened' 
  | 'credit_failed'
  | 'collateral_added'
  | 'repaid'
  | 'renewed'
  | 'payment_processed'
  | 'payment_error';

/** Store global para sincronizar ganancias API con el agente */
export const globalStats = {
  totalApiEarnings: 0
}

/**
 * BiffState representa el estado compartido entre el ciclo del agente y el servidor API.
 */
export const BiffStateAnnotation = Annotation.Root({
  /** Balance actual de la wallet en USDC */
  usdcBalance: Annotation<number>(),
  /** Balance actual de la wallet en WETH */
  wethBalance: Annotation<number>(),
  /** Precio de WETH en USD obtenido vía Chainlink */
  wethPriceUSD: Annotation<number>(),
  /** Lista de préstamos activos en el protocolo Floe */
  activeLoans: Annotation<Array<{
    id: string
    ltv: number
    daysRemaining: number
    principal: number
    collateral: number
  }>>(),
  /** Identificador del último nodo ejecutado en el grafo */
  lastAction: Annotation<BiffAction>(),
  /** Razonamiento del LLM tras la última evaluación */
  actionReason: Annotation<string>(),
  /** Ganancias totales acumuladas por la API x402 */
  totalApiEarnings: Annotation<number>(),
  /** Número de peticiones API pendientes de procesamiento */
  pendingApiRequests: Annotation<number>(),
  /** Registro histórico de operaciones realizadas */
  operationLog: Annotation<Array<{
    timestamp: string
    action: string
    result: string
  }>>()
})

export type BiffState = typeof BiffStateAnnotation.State

export const initialState: BiffState = {
  usdcBalance: 0,
  wethBalance: 0,
  wethPriceUSD: 0,
  activeLoans: [],
  lastAction: 'START',
  actionReason: 'initialization',
  totalApiEarnings: 0,
  pendingApiRequests: 0,
  operationLog: []
}
