export interface Bet {
  stake: number
  payout: number
  status: 'won' | 'lost' | 'void' | 'pending'
}

export interface AnalyticsSummary {
  totalBets: number
  winRate: number
  roi: number
  averageStake: number
  netProfit: number
}

export function calculateFreeTierAnalytics(bets: Bet[]): AnalyticsSummary {
  const completedBets = bets.filter(b => b.status === 'won' || b.status === 'lost')
  const totalBets = completedBets.length

  if (totalBets === 0) {
    return {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      averageStake: 0,
      netProfit: 0,
    }
  }

  const wins = completedBets.filter(b => b.status === 'won').length
  const totalStake = completedBets.reduce((sum, b) => sum + b.stake, 0)
  const totalPayout = completedBets.reduce((sum, b) => sum + b.payout, 0)
  const netProfit = totalPayout - totalStake

  return {
    totalBets,
    winRate: wins / totalBets,
    roi: netProfit / totalStake,
    averageStake: totalStake / totalBets,
    netProfit,
  }
}
