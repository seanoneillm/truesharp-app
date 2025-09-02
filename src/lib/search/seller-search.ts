export interface SellerSearchResult {
  id: string
  username: string
  displayName?: string
  profilePictureUrl?: string | null
  isVerifiedSeller: boolean
  subscriberCount: number
  performanceRoi?: number
}

export interface SearchState {
  query: string
  results: SellerSearchResult[]
  isLoading: boolean
  isOpen: boolean
}

// Mock data for now - will be replaced with Supabase integration
const mockSellers: SellerSearchResult[] = [
  {
    id: '1',
    username: 'sharpbettor',
    displayName: 'Sharp Bettor',
    profilePictureUrl: null,
    isVerifiedSeller: true,
    subscriberCount: 247,
    performanceRoi: 12.5,
  },
  {
    id: '2',
    username: 'profitpicks',
    displayName: 'Profit Picks',
    profilePictureUrl: null,
    isVerifiedSeller: true,
    subscriberCount: 189,
    performanceRoi: 8.3,
  },
  {
    id: '3',
    username: 'sportsgenius',
    displayName: 'Sports Genius',
    profilePictureUrl: null,
    isVerifiedSeller: false,
    subscriberCount: 95,
    performanceRoi: 15.7,
  },
  {
    id: '4',
    username: 'oddsmaster',
    displayName: 'Odds Master',
    profilePictureUrl: null,
    isVerifiedSeller: true,
    subscriberCount: 312,
    performanceRoi: 6.9,
  },
  {
    id: '5',
    username: 'winningway',
    displayName: 'Winning Way',
    profilePictureUrl: null,
    isVerifiedSeller: false,
    subscriberCount: 67,
    performanceRoi: 22.1,
  },
]

export function searchSellers(query: string): Promise<SellerSearchResult[]> {
  return new Promise(resolve => {
    // Simulate API delay
    setTimeout(() => {
      if (!query.trim()) {
        resolve([])
        return
      }

      const filtered = mockSellers
        .filter(
          seller =>
            seller.username.toLowerCase().includes(query.toLowerCase()) ||
            seller.displayName?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5) // Max 5 results as per spec

      resolve(filtered)
    }, 200)
  })
}

export function getSellerProfileUrl(username: string): string {
  return `/marketplace/${username}`
}

// Future: Real Supabase integration
export async function searchSellersFromSupabase(query: string): Promise<SellerSearchResult[]> {
  // This will be implemented when Supabase is fully integrated
  // Will query profiles table where is_seller = true and public_profile = true
  // and search by username or display_name
  return searchSellers(query) // Fallback to mock for now
}
