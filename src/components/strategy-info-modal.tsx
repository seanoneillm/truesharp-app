'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Filter,
  Users,
  BarChart3,
  Settings,
  Plus,
  Banknote,
  Shield,
  Eye,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// TrueSharp Shield Component
const TrueSharpShield = ({ className = 'h-8 w-8' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill="url(#shieldGradient)"
      stroke="#3b82f6"
      strokeWidth="2"
    />
    <path
      d="M35 45 L45 55 L65 35"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

interface StrategyInfoModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function StrategyInfoModal({ isOpen, onOpenChange }: StrategyInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] mx-auto">
        <div className="flex h-full max-h-[90vh] w-full flex-col">
          {/* Header Section - Fixed */}
          <div className="flex-shrink-0 rounded-t-3xl border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6">
            <DialogHeader>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-blue-600 opacity-20 blur-xl"></div>
                      <TrueSharpShield className="relative h-16 w-16 drop-shadow-lg" />
                    </div>
                  </div>
                  <DialogTitle>
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 bg-clip-text text-3xl font-bold text-transparent">
                      Strategy Guide
                    </div>
                  </DialogTitle>
                  <div className="mx-auto max-w-lg text-base leading-relaxed text-gray-700">
                    Complete guide to creating, monetizing, and managing your betting strategies on TrueSharp
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-8">
              {/* What is a Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-blue-600">
                    <Brain className="h-6 w-6" />
                    What is a Strategy?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    A Strategy is a way to organize, analyze, and share your betting approach inside TrueSharp. 
                    Strategies let you track performance, test ideas, and even monetize your best systems by 
                    offering them to subscribers.
                  </p>
                </CardContent>
              </Card>

              {/* Creating a Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                    <Search className="h-6 w-6" />
                    Creating a Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Start in Analytics
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Go to the Analytics page to see a full breakdown of your betting history</li>
                      <li>• Open the Smart Filters dropdown and apply as many filters as you like</li>
                      <li>• Strategies can be specific (e.g., MLB Totals Unders) or broad (e.g., All NFL bets, or even All Bets)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Filter className="h-4 w-4 text-purple-500" />
                      Apply Filters
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Once your filters are applied, click over to the Strategies tab</li>
                      <li>• Select Create Strategy</li>
                      <li>• A modal will pop up where you can name and describe your strategy</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Note:</p>
                        <p className="text-yellow-700 text-sm">
                          Some filters cannot be used in strategies (e.g., "Wins Only") because they could skew 
                          public data. If you select one of these, a message will appear and you won't be able 
                          to create the strategy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Save Your Strategy
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• When you confirm, the strategy will be created with analytics from your filtered bets</li>
                      <li>• It will appear in your Strategies tab, complete with performance metrics</li>
                      <li>• At this point, your strategy is private — only you can see it</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Important:</p>
                        <p className="text-blue-700 text-sm">
                          Strategies do not automatically add new bets. You'll need to add bets to your strategy 
                          manually through the Monetize page.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monetizing a Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                    <DollarSign className="h-6 w-6" />
                    Monetizing a Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Turning a strategy into a product lets you earn money when other users subscribe to it.
                  </p>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      Set Up Your Seller Account
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Go to the Monetize page and connect a Stripe account</li>
                      <li>• Once approved, you'll be able to sell strategies</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Activate Monetization
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• In the Monetize → Strategies tab, find the strategy you want to sell</li>
                      <li>• Click Edit, toggle Monetization On, set your subscription price, and save</li>
                      <li>• Your strategy is now public on the leaderboard</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      What Becomes Public
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Performance metrics only: ROI, win rate, total bets, start date</li>
                      <li>• No monetary values, no individual bet history, and no filter details are shared</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Managing & Upkeeping Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-blue-600">
                    <BarChart3 className="h-6 w-6" />
                    Managing & Upkeeping Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Once monetized, you'll need to keep your strategy active by posting new bets.
                  </p>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-500" />
                      Adding Bets
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Place bets in your synced sportsbook or use the Mock Sportsbook in the Games page</li>
                      <li>• In the Sell → Overview tab, select any open bets you want to post</li>
                      <li>• Click Add to Strategy, choose which strategy to add them to, and save</li>
                    </ul>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                      <p className="text-green-700 text-sm flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Only bets for games that haven't started yet can be posted.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Subscribers' View
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• Subscribers will see your posted bets in their Subscriptions tab</li>
                      <li>• They see all bet details, but never your stake</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Bet Protection
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li>• TrueSharp protects your picks with a copy-bet detection algorithm</li>
                      <li>• If a subscriber tries to resell your posted bets, they'll be flagged as copies and blocked</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Running Your Betting Business */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-purple-600">
                    <Banknote className="h-6 w-6" />
                    Running Your Betting Business
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-gray-700">
                    <li>• Manage all financials in the Sell Dashboard</li>
                    <li>• To adjust Stripe details, click Manage Account for direct access to your Stripe dashboard</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Key Rules & Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-orange-600">
                    <AlertTriangle className="h-6 w-6" />
                    Key Rules & Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-gray-700">
                    <li>• You can have up to 10 active strategies at once</li>
                    <li>• Long-term inactivity may result in strategy deletion</li>
                    <li>• Subscribers can cancel at any time — so consistency matters!</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Final Message */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Ready to Get Started?</p>
                    <p className="text-gray-700">
                      With Strategies, you can track performance, prove your edge, and even monetize your betting 
                      knowledge. Whether you're testing ideas or building a subscriber base, Strategies are your 
                      tool to level up inside TrueSharp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section - Fixed */}
          <div className="flex-shrink-0 rounded-b-3xl border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center space-x-2 rounded-full bg-white px-6 py-3 shadow-sm">
                <TrueSharpShield className="h-5 w-5" />
                <span className="text-sm font-medium text-gray-600">TrueSharp Strategy Guide</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}