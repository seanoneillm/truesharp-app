import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts'
import { LucideIcon } from 'lucide-react'

interface GrowthChartProps {
  title: string
  data: Array<{
    date: string
    count: number
    cumulative: number
  }>
  dataKey?: 'count' | 'cumulative'
  color?: string
  icon?: LucideIcon
  height?: number
  showLegend?: boolean
}

export function GrowthChart({
  title,
  data,
  dataKey = 'cumulative',
  color = '#3b82f6',
  icon: Icon,
  height = 200,
  showLegend = false
}: GrowthChartProps) {
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTooltipValue = (value: number, name: string) => {
    const label = name === 'count' ? 'New' : 'Total'
    return [value.toLocaleString(), label]
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="h-4 w-4" style={{ color }} />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            
            {dataKey === 'cumulative' ? (
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={color}
                fill={color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'white' }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'white' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Summary stats */}
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>
            Latest: {data[data.length - 1]?.[dataKey]?.toLocaleString() || 0}
          </span>
          <span>
            {dataKey === 'cumulative' ? 'Total Growth' : 'Daily Average'}: {
              dataKey === 'cumulative' 
                ? data[data.length - 1]?.cumulative?.toLocaleString() || 0
                : Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length).toLocaleString()
            }
          </span>
        </div>
      </CardContent>
    </Card>
  )
}