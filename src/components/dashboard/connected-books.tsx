// src/components/dashboard/connected-books.tsx
import Link from 'next/link'
import { CheckCircle, XCircle, Plus } from 'lucide-react'

interface ConnectedSportsbook {
  name: string
  status: 'connected' | 'error' | 'disconnected'
  lastSync: string
  betsTracked?: number
}

const defaultSportsbooks: ConnectedSportsbook[] = [
  {
    name: 'DraftKings',
    status: 'connected',
    lastSync: '2 min ago',
    betsTracked: 124,
  },
  {
    name: 'FanDuel',
    status: 'connected',
    lastSync: '5 min ago',
    betsTracked: 89,
  },
  {
    name: 'BetMGM',
    status: 'error',
    lastSync: '2 hours ago',
    betsTracked: 56,
  },
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-4 w-4 text-white" />
    case 'error':
      return <XCircle className="h-4 w-4 text-white" />
    default:
      return <XCircle className="h-4 w-4 text-white" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'connected':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function getStatusText(sportsbook: ConnectedSportsbook) {
  if (sportsbook.status === 'connected') {
    return `Last sync: ${sportsbook.lastSync}`
  } else if (sportsbook.status === 'error') {
    return 'Connection error'
  }
  return 'Disconnected'
}

function getStatusTextColor(status: string) {
  switch (status) {
    case 'connected':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

interface ConnectedBooksProps {
  sportsbooks?: ConnectedSportsbook[]
  title?: string
  showAddButton?: boolean
}

export default function ConnectedBooks({
  sportsbooks = defaultSportsbooks,
  title = 'Connected Sportsbooks',
  showAddButton = true,
}: ConnectedBooksProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-medium text-gray-900">{title}</h2>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sportsbooks.map(book => (
            <div key={book.name} className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded ${getStatusColor(book.status)}`}
                >
                  {getStatusIcon(book.status)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{book.name}</p>
                <p className={`text-sm ${getStatusTextColor(book.status)}`}>
                  {getStatusText(book)}
                </p>
                {book.betsTracked && book.status === 'connected' && (
                  <p className="text-xs text-gray-500">{book.betsTracked} bets tracked</p>
                )}
              </div>
            </div>
          ))}

          {showAddButton && (
            <Link
              href="/settings/sportsbooks"
              className="flex items-center rounded-lg border-2 border-dashed border-gray-300 p-3 transition-colors hover:border-gray-400"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">Add sportsbook</span>
            </Link>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {sportsbooks.filter(book => book.status === 'connected').length}
              </p>
              <p className="text-xs text-gray-500">Connected</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {sportsbooks.reduce((total, book) => total + (book.betsTracked || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Total Bets</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-600">Auto-Sync</p>
              <p className="text-xs text-gray-500">Real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
