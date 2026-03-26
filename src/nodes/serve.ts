import { BiffState } from '../state'

export async function serveApi(state: BiffState): Promise<Partial<BiffState>> {
  // TODO: implement API server with x402-express
  return { lastAction: 'serve_api' }
}
