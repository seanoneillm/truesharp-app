// src/components/dashboard/activity-feed.tsx
import { CheckCircle, UserPlus, MessageSquare, TrendingUp, DollarSign } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'bet_won' | 'bet_lost' | 'new_subscriber' | 'comment' | 'milestone'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'bet_won',
    title: 'Pick Won!',
    description: 'Lakers -4.5 vs Warriors just won',
    timestamp: '2h ago',
    metadata: { profit: '+$91', sport: 'NBA' },
  },
  {
    id: '2',
    type: 'new_subscriber',
    title: 'New subscriber joined Premium tier',
    description: '@newbettor23 subscribed to your picks',
    timestamp: '4h ago',
    metadata: { revenue: '+$89' },
  },
  {
    id: '3',
    type: 'comment',
    title: 'New comment on your NFL analysis',
    description: '@sportsfan99 commented on your Chiefs pick',
    timestamp: '6h ago',
  },
  {
    id: '4',
    type: 'milestone',
    title: '🎉 Reached 250 total bets!',
    description: 'Congratulations on this tracking milestone',
    timestamp: '1d ago',
    metadata: { milestone: '250 bets' },
  },
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'bet_won':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'bet_lost':
      return <CheckCircle className="h-5 w-5 text-red-500" />
    case 'new_subscriber':
      return <UserPlus className="h-5 w-5 text-blue-500" />
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-purple-500" />
    case 'milestone':
      return <TrendingUp className="h-5 w-5 text-yellow-500" />
    default:
      return <DollarSign className="h-5 w-5 text-gray-500" />
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'bet_won':
      return 'bg-green-100'
    case 'bet_lost':
      return 'bg-red-100'
    case 'new_subscriber':
      return 'bg-blue-100'
    case 'comment':
      return 'bg-purple-100'
    case 'milestone':
      return 'bg-yellow-100'
    default:
      return 'bg-gray-100'
  }
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  title?: string
  maxItems?: number
  showMetadata?: boolean
}

export default function ActivityFeed({
  activities = defaultActivities,
  title = 'Recent Activity',
  maxItems = 10,
  showMetadata = true,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {displayedActivities.map((activity, activityIdx) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== displayedActivities.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${getActivityColor(activity.type)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      {showMetadata && activity.metadata && (
                        <div className="mt-2 flex items-center space-x-4">
                          {activity.metadata.profit && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {activity.metadata.profit}
                            </span>
                          )}
                          {activity.metadata.revenue && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {activity.metadata.revenue}
                            </span>
                          )}
                          {activity.metadata.sport && (
                            <span className="text-xs text-gray-500">{activity.metadata.sport}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time>{activity.timestamp}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {activities.length > maxItems && (
        <div className="border-t border-gray-200 px-6 py-4">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            View all activity ({activities.length} total)
          </button>
        </div>
      )}
    </div>
  )
}
