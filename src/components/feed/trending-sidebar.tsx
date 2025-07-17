// src/components/feed/trending-sidebar.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { mockData } from '@/lib/mock-data'
import { formatPercentage } from '@/lib/utils'
import { Crown, ExternalLink, Star, TrendingUp, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

export function TrendingSidebar() {
  // Mock trending data
  const trendingTopics = [
    { tag: '#NBA', posts: 1234, trend: 'up' },
    { tag: '#SuperBowl', posts: 987, trend: 'up' },
    { tag: '#MarchMadness', posts: 756, trend: 'hot' },
    { tag: '#MLBOpening', posts: 543, trend: 'up' },
    { tag: '#StanleyCup', posts: 321, trend: 'down' }
  ]

  const hotStreaks = [
    { user: mockData.users[0], streak: 8, type: 'win' },
    { user: mockData.users[1], streak: 6, type: 'win' },
    { user: mockData.users[2], streak: 5, type: 'win' }
  ]

  const todaysGames = [
    { 
      matchup: 'Lakers vs Warriors', 
      time: '8:00 PM ET', 
      sport: 'NBA',
      picks: 34,
      consensus: 'Lakers -4.5'
    },
    { 
      matchup: 'Chiefs vs Bills', 
      time: '8:20 PM ET', 
      sport: 'NFL',
      picks: 67,
      consensus: 'Over 51.5'
    },
    { 
      matchup: 'Rangers vs Bruins', 
      time: '7:30 PM ET', 
      sport: 'NHL',
      picks: 23,
      consensus: 'Rangers ML'
    }
  ]

  const leaderboard = mockData.sellers
    .sort((a, b) => b.stats.roi - a.stats.roi)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card className="p-4">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="font-medium text-gray-900">Trending Now</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <div key={topic.tag} className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    {topic.tag}
                  </span>
                  {topic.trend === 'hot' && (
                    <Badge variant="destructive" className="ml-2 text-xs">🔥 Hot</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">{topic.posts.toLocaleString()} posts</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hot Streaks */}
      <Card className="p-4">
        <div className="flex items-center mb-4">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="font-medium text-gray-900">Hot Streaks</h3>
        </div>
        <div className="space-y-3">
          {hotStreaks.map((streak) =>
            streak.user ? (
              <div key={streak.user.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                    {streak.user.avatar}
                  </div>
                  <div>
                    <Link href={`/profile/${streak.user.username}`}>
                      <span className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        @{streak.user.username}
                      </span>
                    </Link>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">
                        {streak.streak} game streak
                      </span>
                      {streak.user.isVerified && (
                        <Crown className="h-3 w-3 text-yellow-500 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg">🔥</span>
                </div>
              </div>
            ) : null
          )}
        </div>
        <Link href="/leaderboards">
          <Button variant="outline" size="sm" className="w-full mt-3">
            View All Streaks
          </Button>
        </Link>
      </Card>

      {/* Today's Games */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Today's Games</h3>
          <Link href="/games">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {todaysGames.map((game, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{game.matchup}</span>
                <Badge variant="secondary" className="text-xs">{game.sport}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{game.time}</span>
                <span>{game.picks} picks</span>
              </div>
              <div className="mt-1">
                <span className="text-xs text-blue-600 font-medium">
                  Community: {game.consensus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Leaderboard */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="font-medium text-gray-900">Top Performers</h3>
          </div>
          <Link href="/leaderboards">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {leaderboard.map((seller, index) => {
            const user = mockData.users.find(u => u.id === seller.userId)!
            return (
              <div key={seller.userId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-400 mr-3 w-4">
                    #{index + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                    {user.avatar}
                  </div>
                  <div>
                    <Link href={`/marketplace/${user.username}`}>
                      <span className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        @{user.username}
                      </span>
                    </Link>
                    <div className="text-xs text-gray-500">
                      {seller.stats.totalPicks} picks
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">
                    {formatPercentage(seller.stats.roi)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Browse Sellers
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/games">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Trophy className="h-4 w-4 mr-2" />
              Today's Games
            </Button>
          </Link>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <Link href="/legal/terms" className="hover:text-gray-700">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link href="/help" className="hover:text-gray-700">Help</Link>
        </div>
        <p className="text-xs text-gray-400 mt-2">© 2025 TrueSharp</p>
      </div>
    </div>
  )
}
