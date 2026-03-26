import { BiffState } from '../state'

export async function processPayment(state: BiffState): Promise<Partial<BiffState>> {
  // TODO: implement x402 outgoing payments
  return { lastAction: 'process_payment' }
}
