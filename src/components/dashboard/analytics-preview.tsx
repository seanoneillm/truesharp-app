'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { BarChart3, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface ProfitData {
  date: string
  profit: number
}

type TimePeriod = 'week' | 'month' | 'year'

export default function AnalyticsPreview() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [profitData, setProfitData] = useState<ProfitData[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Generate array of years (current year and past 5 years)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false)
      }
    }

    if (showYearDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return undefined
  }, [showYearDropdown])

  useEffect(() => {
    async function fetchProfitData() {
      if (!user?.id) {
        setLoading(false)
        setProfitData([])
        setTotalProfit(0)
        return
      }

      try {
        const response = await fetch('/api/analytics-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            period: selectedPeriod,
            year: selectedYear
          })
        })

        if (!response.ok) {
          console.error('Analytics API error:', response.status)
          setLoading(false)
          return
        }

        const result = await response.json()

        if (result.success && result.profitData) {
          setProfitData(result.profitData)
          setTotalProfit(result.totalProfit || 0)
        } else {
          setProfitData([])
          setTotalProfit(0)
        }
      } catch (error) {
        console.error('Error fetching profit data:', error instanceof Error ? error.message : error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfitData()
  }, [user?.id, selectedPeriod, selectedYear])

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      case 'year':
        return selectedYear.toString()
    }
  }

  // Simple Line Chart Component
  const SimpleLineChart = ({ data }: { data: ProfitData[] }) => {
    if (data.length === 0) return null

    const width = 400
    const height = 160
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find min and max values for scaling
    const profits = data.map(d => d.profit)
    const minProfit = Math.min(0, ...profits)
    const maxProfit = Math.max(0, ...profits)
    const profitRange = maxProfit - minProfit || 1

    // Scale functions
    const scaleX = (index: number) => (index / Math.max(data.length - 1, 1)) * chartWidth + padding
    const scaleY = (profit: number) => height - padding - ((profit - minProfit) / profitRange) * chartHeight

    // Generate path string for the line
    const pathData = data.map((point, index) => {
      const x = scaleX(index)
      const y = scaleY(point.profit)
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')

    // Zero line Y position
    const zeroY = scaleY(0)

    return (
      <div className="w-full relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#f9fafb" strokeWidth="1"/>
            </pattern>
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={totalProfit >= 0 ? "#059669" : "#dc2626"} stopOpacity="0.08"/>
              <stop offset="100%" stopColor={totalProfit >= 0 ? "#059669" : "#dc2626"} stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Background grid */}
          <rect width={chartWidth} height={chartHeight} x={padding} y={padding} fill="url(#grid)" />
          
          {/* Zero line */}
          <line
            x1={padding}
            y1={zeroY}
            x2={width - padding}
            y2={zeroY}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.7"
          />
          
          {/* Area under the curve */}
          {data.length > 1 && (
            <path
              d={`${pathData} L ${scaleX(data.length - 1)} ${zeroY} L ${scaleX(0)} ${zeroY} Z`}
              fill="url(#profitGradient)"
            />
          )}
          
          {/* Profit line */}
          <path
            d={pathData}
            fill="none"
            stroke={totalProfit >= 0 ? "#059669" : "#dc2626"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => (
            <g key={index}>
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.profit)}
                r="1.5"
                fill={point.profit >= 0 ? "#059669" : "#dc2626"}
                stroke="white"
                strokeWidth="1"
                className="hover:r-2 transition-all cursor-pointer"
              />
              {/* Tooltip on hover */}
              <title>{`${point.date}: ${point.profit >= 0 ? '+' : ''}$${point.profit.toFixed(2)}`}</title>
            </g>
          ))}
          
          {/* Y-axis labels */}
          <text x={padding - 10} y={scaleY(maxProfit) + 5} textAnchor="end" className="text-xs fill-gray-400 font-medium">
            ${Math.round(maxProfit).toLocaleString()}
          </text>
          <text x={padding - 10} y={zeroY + 5} textAnchor="end" className="text-xs fill-gray-400 font-medium">
            $0
          </text>
          {minProfit < 0 && (
            <text x={padding - 10} y={scaleY(minProfit) + 5} textAnchor="end" className="text-xs fill-gray-400 font-medium">
              ${Math.round(minProfit).toLocaleString()}
            </text>
          )}
          
          {/* X-axis labels for first, middle, and last dates */}
          {data.length > 0 && data[0] && (
            <>
              <text x={scaleX(0)} y={height - 10} textAnchor="start" className="text-xs fill-gray-400 font-medium">
                {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
              {data.length > 2 && (
                <text x={scaleX(Math.floor(data.length / 2))} y={height - 10} textAnchor="middle" className="text-xs fill-gray-400 font-medium">
                  {new Date(data[Math.floor(data.length / 2)]?.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
              {data.length > 1 && data[data.length - 1] && (
                <text x={scaleX(data.length - 1)} y={height - 10} textAnchor="end" className="text-xs fill-gray-400 font-medium">
                  {new Date(data[data.length - 1]!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
            </>
          )}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg animate-pulse">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics Preview</h2>
            <p className="text-sm text-gray-500">Loading performance data...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
            <div className="flex-1 h-8 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded-md"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-40 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 shadow-xl rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-sm text-gray-500">Your betting insights</p>
          </div>
        </div>
        <div className="flex items-center text-purple-600">
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm font-medium">Live</span>
        </div>
      </div>

      {/* Time Period Toggles */}
      <div className="flex space-x-1 mb-6 p-1 bg-gradient-to-r from-gray-100 to-gray-150 rounded-xl shadow-inner">
        {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            {getPeriodLabel(period)}
          </button>
        ))}
      </div>

      {/* Year Selection Dropdown - only show when year period is selected */}
      {selectedPeriod === 'year' && (
        <div className="mb-6" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <span className="text-sm font-medium text-gray-700">Year: {selectedYear}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showYearDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showYearDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="py-1">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setShowYearDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedYear === year ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total Profit Display */}
      <div className="mb-6 p-6 bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl shadow-lg ${
              totalProfit >= 0 
                ? 'bg-gradient-to-br from-green-100 to-emerald-200' 
                : 'bg-gradient-to-br from-red-100 to-red-200'
            }`}>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Profit/Loss</div>
              <div className={`text-3xl font-bold ${
                totalProfit >= 0 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent'
              }`}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium mb-2">{getPeriodLabel(selectedPeriod)}</div>
            <div className={`text-3xl font-bold ${
              totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {totalProfit >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="mb-6">
        {profitData.length === 0 ? (
          <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No data for this period
              </p>
              <p className="text-xs text-gray-400">
                No settled bets in this timeframe
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Profit Over Time</h3>
            </div>
            <SimpleLineChart data={profitData} />
          </div>
        )}
      </div>

      {/* View Full Analytics Link */}
      <div className="mt-8 text-center border-t border-gray-100 pt-6">
        <Link
          href="/analytics"
          className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200"
        >
          <BarChart3 className="h-5 w-5 mr-2 group-hover:animate-pulse" />
          View Detailed Analytics
          <div className="ml-2 group-hover:translate-x-1 transition-transform">→</div>
        </Link>
      </div>
    </div>
  )
}
