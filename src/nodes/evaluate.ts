import { BiffState } from '../state'

export async function evaluateDecision(state: BiffState): Promise<Partial<BiffState>> {
  // TODO: implement evaluation
  return { lastAction: 'evaluate' }
}
