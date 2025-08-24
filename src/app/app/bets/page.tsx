// src/app/bets/page.tsx
'use client'
import { BetList, SyncStatus } from '@/components/bets'

export default function BetsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bet History</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage all your tracked bets from connected sportsbooks
            </p>
          </div>

          {/* Sync Status */}
          <div className="mb-8">
            <SyncStatus />
          </div>

          {/* Bet List */}
          <BetList 
            title="All Bets"
            showFilters={true}
            showViewToggle={true}
          />
        </div>
      </div>
    </div>
  )
}
