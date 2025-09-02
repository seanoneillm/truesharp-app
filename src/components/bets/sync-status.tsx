// src/components/bets/sync-status.tsx
import { CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'

interface SyncStatus {
  sportsbook: string
  status: 'synced' | 'syncing' | 'error' | 'disconnected'
  lastSync?: string
  betsFound?: number
  error?: string
}

interface SyncStatusProps {
  sportsbooks?: SyncStatus[]
  showAddButton?: boolean
  isCompact?: boolean
}

const defaultSportsbooks: SyncStatus[] = [
  {
    sportsbook: 'DraftKings',
    status: 'synced',
    lastSync: '2 minutes ago',
    betsFound: 3,
  },
  {
    sportsbook: 'FanDuel',
    status: 'synced',
    lastSync: '5 minutes ago',
    betsFound: 1,
  },
  {
    sportsbook: 'BetMGM',
    status: 'error',
    lastSync: '2 hours ago',
    error: 'Authentication failed. Please reconnect your account.',
    betsFound: 0,
  },
  {
    sportsbook: 'Caesars',
    status: 'syncing',
    lastSync: 'Now',
    betsFound: 0,
  },
]

function getStatusIcon(status: string, isAnimated = false) {
  switch (status) {
    case 'synced':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'syncing':
      return <RefreshCw className={`h-5 w-5 text-blue-500 ${isAnimated ? 'animate-spin' : ''}`} />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'disconnected':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'synced':
      return 'text-green-600'
    case 'syncing':
      return 'text-blue-600'
    case 'error':
      return 'text-red-600'
    case 'disconnected':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

function getStatusText(sportsbook: SyncStatus) {
  switch (sportsbook.status) {
    case 'synced':
      return `Last sync: ${sportsbook.lastSync}${sportsbook.betsFound ? ` • ${sportsbook.betsFound} new bets` : ''}`
    case 'syncing':
      return 'Syncing now...'
    case 'error':
      return sportsbook.error || 'Sync error'
    case 'disconnected':
      return 'Not connected'
    default:
      return 'Unknown status'
  }
}

export default function SyncStatus({
  sportsbooks = defaultSportsbooks,
  showAddButton = true,
  isCompact = false,
}: SyncStatusProps) {
  const connectedCount = sportsbooks.filter(sb => sb.status !== 'disconnected').length
  const errorCount = sportsbooks.filter(sb => sb.status === 'error').length
  const totalBetsFound = sportsbooks.reduce((sum, sb) => sum + (sb.betsFound || 0), 0)

  if (isCompact) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw className="mr-2 h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sync Status</p>
              <p className="text-xs text-gray-500">
                {connectedCount} connected • {totalBetsFound} new bets
              </p>
            </div>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="mr-1 h-4 w-4" />
              <span className="text-xs">
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Sportsbook Sync Status</h3>
            <p className="text-sm text-gray-600">
              Real-time synchronization with your betting accounts
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {connectedCount} of {sportsbooks.length} connected
            </div>
            {totalBetsFound > 0 && (
              <div className="text-xs text-green-600">{totalBetsFound} new bets found</div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sportsbooks.map(sportsbook => (
          <div key={sportsbook.sportsbook} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4">
                  {getStatusIcon(sportsbook.status, sportsbook.status === 'syncing')}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{sportsbook.sportsbook}</h4>
                  <p className={`text-sm ${getStatusColor(sportsbook.status)}`}>
                    {getStatusText(sportsbook)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {sportsbook.status === 'error' && (
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-500">
                    Reconnect
                  </button>
                )}
                {sportsbook.status === 'synced' && (
                  <button className="text-xs text-gray-600 hover:text-gray-500">Sync Now</button>
                )}
              </div>
            </div>
          </div>
        ))}

        {showAddButton && (
          <div className="px-6 py-4">
            <Link
              href="/settings/sportsbooks"
              className="flex items-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400"
            >
              <Plus className="mr-3 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600">Connect Another Sportsbook</p>
                <p className="text-xs text-gray-500">Add more accounts for complete bet tracking</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {sportsbooks.reduce((sum, sb) => sum + (sb.betsFound || 0), 0)}
            </div>
            <div className="text-xs text-gray-500">Bets Synced Today</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {sportsbooks.filter(sb => sb.status === 'synced').length}
            </div>
            <div className="text-xs text-gray-500">Connected</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">Auto</div>
            <div className="text-xs text-gray-500">Sync Mode</div>
          </div>
        </div>
      </div>
    </div>
  )
}
