// src/components/dashboard/performance-chart.tsx
import { BarChart3 } from 'lucide-react'

interface ChartDataPoint {
  date: string
  profit: number
  cumulative: number
}

const mockChartData: ChartDataPoint[] = [
  { date: '2024-11-01', profit: 450, cumulative: 450 },
  { date: '2024-11-15', profit: 320, cumulative: 770 },
  { date: '2024-12-01', profit: 680, cumulative: 1450 },
  { date: '2024-12-15', profit: 890, cumulative: 2340 },
  { date: '2024-12-21', profit: 507, cumulative: 2847 },
]

interface PerformanceChartProps {
  data?: ChartDataPoint[]
  title?: string
  height?: string
  showUpgrade?: boolean
}

export default function PerformanceChart({
  data = mockChartData,
  title = 'Profit Over Time',
  height = 'h-64',
  showUpgrade = false,
}: PerformanceChartProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>

      <div className={`${height} flex items-center justify-center rounded-lg bg-gray-50`}>
        <div className="text-center">
          <BarChart3 className="mx-auto mb-2 h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500">Chart visualization would go here</p>
          <p className="mt-1 text-xs text-gray-400">
            Interactive profit/loss chart showing {data.length} data points
          </p>
          {showUpgrade && (
            <div className="mt-4">
              <button className="inline-flex items-center rounded border border-transparent bg-blue-100 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-200">
                Upgrade for Advanced Charts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-gray-900">
            ${data[data.length - 1]?.cumulative.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500">Total Profit</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            ${data[data.length - 1]?.profit.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500">This Period</p>
        </div>
        <div>
          <p className="text-sm font-medium text-green-600">+18.5%</p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
      </div>
    </div>
  )
}
