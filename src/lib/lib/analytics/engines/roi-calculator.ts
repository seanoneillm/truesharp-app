/**
 * Calculates Return on Investment (ROI).
 * ROI = (Net Profit / Total Stake)
 */
export function calculateROI(totalPayout: number, totalStake: number): number {
  if (totalStake === 0) return 0
  return (totalPayout - totalStake) / totalStake
}
