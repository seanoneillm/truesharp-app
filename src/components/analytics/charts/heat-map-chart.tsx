// src/components/analytics/charts/heat-map-chart.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import React, { useState } from 'react'

interface HeatMapData {
  day: string
  hour: number
  value: number
  bets: number
  winRate: number
}

interface HeatMapChartProps {
  data: HeatMapData[]
  isPro: boolean
  metric: 'roi' | 'winRate' | 'profit' | 'volume'
  onMetricChange: (metric: string) => void
}

export const HeatMapChart: React.FC<HeatMapChartProps> = ({
  data,
  isPro,
  metric,
  onMetricChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatMapData | null>(null)

  if (!isPro) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Performance Heat Map</h3>
          <p className="mb-4 text-muted-foreground">
            Visualize your betting patterns by day and time with Pro
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    )
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const metrics = [
    { value: 'roi', label: 'ROI %', color: 'bg-blue-500' },
    { value: 'winRate', label: 'Win Rate %', color: 'bg-green-500' },
    { value: 'profit', label: 'Profit $', color: 'bg-purple-500' },
    { value: 'volume', label: 'Bet Volume', color: 'bg-orange-500' },
  ]

  const getColorIntensity = (value: number, maxValue: number, minValue: number) => {
    if (maxValue === minValue) return 0.5
    return (value - minValue) / (maxValue - minValue)
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))

  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)
  }

  const getColorForValue = (value: number) => {
    const intensity = getColorIntensity(value, maxValue, minValue)
    if (value > 0) {
      return `rgba(34, 197, 94, ${intensity})` // Green for positive
    } else if (value < 0) {
      return `rgba(239, 68, 68, ${Math.abs(intensity)})` // Red for negative
    } else {
      return 'rgba(156, 163, 175, 0.2)' // Gray for neutral
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Performance Heat Map</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {metric.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {metrics.map(m => (
            <Button
              key={m.value}
              variant={metric === m.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMetricChange(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="grid-cols-25 grid gap-1">
          {/* Hour labels */}
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="p-1 text-center text-xs text-muted-foreground">
              {hour}
            </div>
          ))}

          {/* Days and heat map cells */}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="flex items-center justify-end p-1 text-right text-xs text-muted-foreground">
                {day}
              </div>
              {hours.map(hour => {
                const cellData = getCellData(day, hour)
                const value = cellData?.value || 0
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="aspect-square cursor-pointer rounded-sm border border-gray-200 transition-colors hover:border-gray-400"
                    style={{
                      backgroundColor: getColorForValue(value),
                    }}
                    onClick={() => setSelectedCell(cellData || null)}
                    title={`${day} ${hour}:00 - ${value.toFixed(2)}${metric === 'profit' ? '$' : '%'}`}
                  >
                    {cellData?.bets && cellData.bets > 0 && (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-xs font-medium text-white mix-blend-difference">
                          {cellData.bets > 9 ? '9+' : cellData.bets}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Less</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
              <div
                key={opacity}
                className="h-4 w-4 border border-gray-200"
                style={{ backgroundColor: `rgba(34, 197, 94, ${opacity})` }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">More</span>
        </div>

        <div className="text-sm text-muted-foreground">
          Range: {minValue.toFixed(2)} to {maxValue.toFixed(2)}
          {metric === 'profit' ? '$' : '%'}
        </div>
      </div>

      {/* Selected cell details */}
      {selectedCell && (
        <div className="border-t pt-4">
          <h4 className="mb-2 font-medium">
            {selectedCell.day} at {selectedCell.hour}:00
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="font-semibold">
                {selectedCell.value.toFixed(2)}
                {metric === 'profit' ? '$' : '%'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Bets</p>
              <p className="font-semibold">{selectedCell.bets}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="font-semibold">{selectedCell.winRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Performance</p>
              <p
                className={`font-semibold ${selectedCell.value > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {selectedCell.value > 0 ? 'Good' : 'Poor'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
