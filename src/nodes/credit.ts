import { BiffState } from '../state'

export async function requestCredit(state: BiffState): Promise<Partial<BiffState>> {
  // TODO: implement Floe actions
  return { lastAction: 'request_credit' }
}

export async function addCollateral(state: BiffState): Promise<Partial<BiffState>> {
  return { lastAction: 'add_collateral' }
}

export async function repayOrRenew(state: BiffState): Promise<Partial<BiffState>> {
  return { lastAction: 'repay_or_renew' }
}
