// src/components/dashboard/stats-card.tsx
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  name: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: LucideIcon
  period: string
}

export default function StatsCard({
  name,
  value,
  change,
  changeType,
  icon: Icon,
  period,
}: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-5 shadow">
      <dt>
        <div className="absolute rounded-md bg-blue-500 p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <p className="ml-16 truncate text-sm font-medium text-gray-500">{name}</p>
      </dt>
      <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p
          className={`ml-2 flex items-baseline text-sm font-semibold ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {changeType === 'positive' ? (
            <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
          ) : (
            <TrendingDown className="h-4 w-4 flex-shrink-0 self-center" />
          )}
          <span className="ml-1">{change}</span>
        </p>
        <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <span className="text-gray-600">{period}</span>
          </div>
        </div>
      </dd>
    </div>
  )
}
