/**
 * Representa un préstamo en el protocolo Floe.
 */
export interface FloeLoan {
  id: string;
  /** Monto principal en USDC */
  principal: number;
  /** Monto de colateral en WETH */
  collateral: number;
  /** Loan-to-Value actual (%) */
  ltv: number;
  /** Días restantes hasta el vencimiento */
  daysRemaining: number;
  /** Estado actual del préstamo */
  status: 'ACTIVE' | 'REPAID' | 'LIQUIDATED';
}
