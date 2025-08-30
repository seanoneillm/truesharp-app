// Shared types for custom charts functionality

export interface ChartConfig {
  id: string
  title: string
  chartType: 'line' | 'bar' | 'pie'
  xAxis: 'placed_at' | 'league' | 'bet_type' | 'sportsbook'
  yAxis: 'count' | 'profit' | 'stake' | 'win_rate' | 'roi'
  filters: {
    leagues?: string[]
    status?: ('won' | 'lost' | 'pending' | 'void' | 'cancelled')[]
    bet_types?: string[]
    date_range?: {
      start: Date | null
      end: Date | null
    }
    sportsbooks?: string[]
  }
}

export interface CustomChartData {
  [key: string]: any
}