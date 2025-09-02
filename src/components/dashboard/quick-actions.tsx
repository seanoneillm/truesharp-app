// src/components/dashboard/quick-actions.tsx
import Link from 'next/link'
import { LucideIcon, Plus, BarChart3, Users, DollarSign } from 'lucide-react'

interface QuickAction {
  name: string
  href: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  description: string
}

const defaultActions: QuickAction[] = [
  {
    name: 'Connect Sportsbook',
    href: '/settings/sportsbooks',
    icon: Plus,
    color: 'blue',
    description: 'Link your betting accounts',
  },
  {
    name: 'View Analytics',
    href: '/analytics',
    icon: BarChart3,
    color: 'green',
    description: 'Deep dive into your performance',
  },
  {
    name: 'Browse Picks',
    href: '/marketplace',
    icon: Users,
    color: 'purple',
    description: 'Find winning bettors to follow',
  },
  {
    name: 'Start Selling',
    href: '/sell',
    icon: DollarSign,
    color: 'yellow',
    description: 'Monetize your expertise',
  },
]

function getColorClass(color: string) {
  switch (color) {
    case 'blue':
      return 'bg-blue-500'
    case 'green':
      return 'bg-green-500'
    case 'purple':
      return 'bg-purple-500'
    case 'yellow':
      return 'bg-yellow-500'
    case 'red':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

interface QuickActionsProps {
  actions?: QuickAction[]
  title?: string
  columns?: 2 | 3 | 4
}

export default function QuickActions({
  actions = defaultActions,
  title = 'Quick Actions',
  columns = 4,
}: QuickActionsProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-medium text-gray-900">{title}</h2>
      <div className={`grid grid-cols-1 gap-4 ${gridCols[columns]}`}>
        {actions.map(action => (
          <Link
            key={action.name}
            href={action.href}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${getColorClass(action.color)}`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
