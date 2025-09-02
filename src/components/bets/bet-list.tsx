// src/components/bets/bet-list.tsx
import { useState } from 'react'
import BetCard from './bet-card'
import { Filter, Grid3X3, List, SortAsc } from 'lucide-react'

interface Bet {
  id: string
  description: string
  odds: string
  stake: string
  status: 'won' | 'lost' | 'pending' | 'void' | 'cancelled'
  payout?: string
  sport: string
  date: string
  game: string
  sportsbook: string
  betType: string
  potentialPayout?: string
  actualPayout?: string
  isPublic?: boolean
}

const mockBets: Bet[] = [
  {
    id: '1',
    description: 'Lakers -4.5 vs Warriors',
    odds: '-110',
    stake: '$100',
    status: 'won',
    payout: '+$91',
    sport: 'NBA',
    date: '2h ago',
    game: 'LAL @ GSW',
    sportsbook: 'DraftKings',
    betType: 'spread',
    actualPayout: '+$91',
    isPublic: true,
  },
  {
    id: '2',
    description: 'Chiefs ML vs Bills',
    odds: '+150',
    stake: '$50',
    status: 'pending',
    sport: 'NFL',
    date: '4h ago',
    game: 'KC @ BUF',
    sportsbook: 'FanDuel',
    betType: 'moneyline',
    potentialPayout: '+$75',
  },
  {
    id: '3',
    description: 'Over 8.5 Runs - Yankees vs Red Sox',
    odds: '-105',
    stake: '$75',
    status: 'lost',
    payout: '-$75',
    sport: 'MLB',
    date: '1d ago',
    game: 'NYY @ BOS',
    sportsbook: 'BetMGM',
    betType: 'total',
    actualPayout: '-$75',
  },
  {
    id: '4',
    description: 'Oilers -1.5 vs Flames',
    odds: '+120',
    stake: '$60',
    status: 'won',
    payout: '+$72',
    sport: 'NHL',
    date: '2d ago',
    game: 'EDM @ CGY',
    sportsbook: 'Caesars',
    betType: 'spread',
    actualPayout: '+$72',
    isPublic: true,
  },
]

interface BetListProps {
  bets?: Bet[]
  title?: string
  showFilters?: boolean
  showViewToggle?: boolean
  defaultView?: 'grid' | 'list'
  itemsPerPage?: number
}

export default function BetList({
  bets = mockBets,
  title = 'All Bets',
  showFilters = true,
  showViewToggle = true,
  defaultView = 'grid',
  itemsPerPage = 12,
}: BetListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView)
  const [sortBy, setSortBy] = useState('date')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSport, setFilterSport] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and sort logic
  const filteredBets = bets
    .filter(bet => filterStatus === 'all' || bet.status === filterStatus)
    .filter(bet => filterSport === 'all' || bet.sport === filterSport)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'profit':
          const aProfit = parseFloat(a.payout?.replace(/[$+]/g, '') || '0')
          const bProfit = parseFloat(b.payout?.replace(/[$+]/g, '') || '0')
          return bProfit - aProfit
        case 'sport':
          return a.sport.localeCompare(b.sport)
        default:
          return 0
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBets = filteredBets.slice(startIndex, startIndex + itemsPerPage)

  const uniqueSports = Array.from(new Set(bets.map(bet => bet.sport)))

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            {filteredBets.length} of {bets.length} bets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {showFilters && (
            <div className="flex items-center space-x-2">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
                <option value="void">Void</option>
              </select>

              {/* Sport Filter */}
              <select
                value={filterSport}
                onChange={e => setFilterSport(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="all">All Sports</option>
                {uniqueSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="profit">Sort by Profit</option>
                <option value="sport">Sort by Sport</option>
              </select>
            </div>
          )}

          {showViewToggle && (
            <div className="flex items-center rounded-md border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bets Display */}
      {paginatedBets.length === 0 ? (
        <div className="py-12 text-center">
          <Filter className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No bets found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new bets.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedBets.map(bet => (
                <BetCard
                  key={bet.id}
                  {...bet}
                  onEdit={() => console.log('Edit bet', bet.id)}
                  onShare={() => console.log('Share bet', bet.id)}
                  onMakePublic={() => console.log('Make public', bet.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBets.map(bet => (
                <div key={bet.id} className="w-full">
                  <BetCard
                    {...bet}
                    onEdit={() => console.log('Edit bet', bet.id)}
                    onShare={() => console.log('Share bet', bet.id)}
                    onMakePublic={() => console.log('Make public', bet.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + itemsPerPage, filteredBets.length)} of {filteredBets.length}{' '}
                results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      currentPage === page
                        ? 'border border-blue-200 bg-blue-50 text-blue-600'
                        : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
