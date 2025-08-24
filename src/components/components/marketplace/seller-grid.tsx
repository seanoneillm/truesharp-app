// src/components/marketplace/seller-grid.tsx
import { Seller, User } from '@/lib/types'
import { SellerCard } from './seller-card'

interface SellerGridProps {
  sellers: (Seller & { user: User })[]
  viewMode: 'grid' | 'list'
}

export function SellerGrid({ sellers, viewMode }: SellerGridProps) {
  if (sellers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sellers found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms to find more sellers.
          </p>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {sellers.map((seller) => (
          <SellerCard 
            key={seller.userId} 
            seller={seller} 
            viewMode="list" 
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sellers.map((seller) => (
        <SellerCard 
          key={seller.userId} 
          seller={seller} 
          viewMode="grid" 
        />
      ))}
    </div>
  )
}