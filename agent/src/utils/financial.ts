/**
 * Utilidades financieras puras — fácilmente testeables.
 */

/**
 * Calcula el Loan-to-Value (LTV) actual de un préstamo.
 * LTV = (principal / (colateral * precioColateral)) * 100
 */
export function calculateLTV(
  principalUSD: number,
  collateralAmount: number,
  collateralPriceUSD: number,
): number {
  if (collateralPriceUSD <= 0 || collateralAmount <= 0) return 0;
  return (principalUSD / (collateralAmount * collateralPriceUSD)) * 100;
}

/**
 * Calcula días restantes hasta expiración.
 */
export function calculateDaysRemaining(
  startTime: number,
  duration: number,
): number {
  const now = Math.floor(Date.now() / 1000);
  const expiry = startTime + duration;
  return Math.max(0, (expiry - now) / 86400);
}

/**
 * Determina si un loan está en riesgo de liquidación.
 */
export function isLoanAtRisk(ltv: number, maxLTV: number): boolean {
  return ltv > maxLTV;
}

/**
 * Determina si un loan está próximo a expirar.
 */
export function isLoanExpiring(
  daysRemaining: number,
  warnDays: number,
): boolean {
  return daysRemaining < warnDays;
}

/**
 * Determina si hay balance suficiente para repagar un loan.
 */
export function canRepayLoan(
  usdcBalance: number,
  principal: number,
  bufferMultiplier: number = 1.1,
): boolean {
  return usdcBalance > principal * bufferMultiplier;
}
