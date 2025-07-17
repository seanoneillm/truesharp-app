// src/components/dashboard/recent-bets.tsx
import Link from 'next/link'
import { Filter, CheckCircle, Clock, XCircle } from 'lucide-react'

interface RecentBet {
  id: number
  description: string
  odds: string
  stake: string
  status: 'won' | 'lost' | 'pending'
  payout: string
  sport: string
  date: string
  game: string
}

const defaultRecentBets: RecentBet[] = [
  {
    id: 1,
    description: 'Lakers -4.5 vs Warriors',
    odds: '-110',
    stake: '$100',
    status: 'won',
    payout: '+$91',
    sport: 'NBA',
    date: '2h ago',
    game: 'LAL @ GSW'
  },
  {
    id: 2,
    description: 'Chiefs ML vs Bills',
    odds: '+150',
    stake: '$50',
    status: 'pending',
    payout: 'TBD',
    sport: 'NFL',
    date: '4h ago',
    game: 'KC @ BUF'
  },
  {
    id: 3,
    description: 'Over 8.5 Runs - Yankees vs Red Sox',
    odds: '-105',
    stake: '$75',
    status: 'lost',
    payout: '-$75',
    sport: 'MLB',
    date: '1d ago',
    game: 'NYY @ BOS'
  },
  {
    id: 4,
    description: 'Oilers -1.5 vs Flames',
    odds: '+120',
    stake: '$60',
    status: 'won',
    payout: '+$72',
    sport: 'NHL',
    date: '2d ago',
    game: 'EDM @ CGY'
  }
]

function getSportBadgeColor(sport: string) {
  switch (sport) {
    case 'NBA': return 'bg-orange-100 text-orange-800'
    case 'NFL': return 'bg-green-100 text-green-800'
    case 'MLB': return 'bg-blue-100 text-blue-800'
    case 'NHL': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'won': return 'bg-green-100 text-green-800'
    case 'lost': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPayoutColor(status: string) {
  switch (status) {
    case 'won': return 'text-green-600'
    case 'lost': return 'text-red-600'
    default: return 'text-gray-500'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'won': return <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
    case 'lost': return <XCircle className="h-4 w-4 text-red-500 mr-1" />
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500 mr-1" />
    default: return null
  }
}

interface RecentBetsProps {
  bets?: RecentBet[]
  title?: string
  showFilters?: boolean
}

export default function RecentBets({ 
  bets = defaultRecentBets, 
  title = "Recent Bets",
  showFilters = true
}: RecentBetsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {showFilters && (
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <Link href="/bets" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {bets.map((bet) => (
            <li key={bet.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSportBadgeColor(bet.sport)}`}>
                      {bet.sport}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">{bet.date}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {bet.description}
                  </p>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{bet.odds}</span>
                    <span className="mx-2">•</span>
                    <span>{bet.stake}</span>
                    <span className="mx-2">•</span>
                    <span>{bet.game}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    {getStatusIcon(bet.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(bet.status)}`}>
                      {bet.status}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm font-medium ${getPayoutColor(bet.status)}`}>
                    {bet.payout}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
