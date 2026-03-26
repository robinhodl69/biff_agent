import { Annotation } from '@langchain/langgraph'

export const BiffStateAnnotation = Annotation.Root({
  // Wallet
  usdcBalance: Annotation<number>(),
  wethBalance: Annotation<number>(),

  // Mercado
  wethPriceUSD: Annotation<number>(),

  // Loans
  activeLoans: Annotation<Array<{
    id: string
    ltv: number
    daysRemaining: number
    principal: number
  }>>(),

  // Decisión
  lastAction: Annotation<string>(),
  actionReason: Annotation<string>(),

  // API earnings
  totalApiEarnings: Annotation<number>(),
  pendingApiRequests: Annotation<number>(),

  // Log
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
