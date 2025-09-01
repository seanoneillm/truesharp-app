import { Metadata } from 'next'
import { Shield, TrendingUp, HelpCircle, Settings, Gamepad2, BarChart3, Store, Users, CreditCard, AlertTriangle } from 'lucide-react'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { FAQAccordion } from '@/components/help/faq-accordion'

export const metadata: Metadata = {
  title: 'Help Center - TrueSharp',
  description: 'Your comprehensive guide to TrueSharp sports betting insights platform. Get started, learn features, and find answers to common questions.',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TrueSharpShield className="h-12 w-12 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              TrueSharp Help Center
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to TrueSharp, your sports betting insights platform. This page will guide you through the platform and answer common questions.
          </p>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">🔑 Getting Started</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  Create an Account
                </h3>
                <ul className="text-gray-600 space-y-1 ml-7">
                  <li>• Sign up with your email and password</li>
                  <li>• Verify your email to activate your account</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  Sync Your Sportsbooks
                </h3>
                <ul className="text-gray-600 space-y-1 ml-7">
                  <li>• Go to Analytics → Link Sportsbooks to connect via SharpSports</li>
                  <li>• Supported: DraftKings, FanDuel, Caesars, BetMGM, and more</li>
                  <li>• Your bets will automatically sync into TrueSharp</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Settings className="h-5 w-5 text-blue-600 mr-2" />
                  Refresh Bets
                </h3>
                <p className="text-gray-600 ml-7">
                  On the Analytics page, click Refresh Bets to pull in the latest wagers from your linked sportsbooks.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Store className="h-5 w-5 text-blue-600 mr-2" />
                  Browse Strategies
                </h3>
                <ul className="text-gray-600 space-y-1 ml-7">
                  <li>• Head to the Marketplace to discover betting strategies</li>
                  <li>• Each seller can list up to 5 active strategies at once</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                  Subscribe to a Strategy
                </h3>
                <ul className="text-gray-600 space-y-1 ml-7">
                  <li>• Choose a plan (weekly / monthly / yearly)</li>
                  <li>• Payments handled securely through Stripe</li>
                  <li>• Instantly see the seller&apos;s picks once subscribed</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Gamepad2 className="h-5 w-5 text-blue-600 mr-2" />
                  Place Mock Bets
                </h3>
                <p className="text-gray-600 ml-7">
                  Test strategies without real money using the Mock Sportsbook in the Games page. Mock bets are tracked alongside your synced wagers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">📊 Features</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-50">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Automatic Bet Syncing</h3>
                <p className="text-sm text-gray-600">All wagers from linked sportsbooks update in Analytics</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-50">
              <Gamepad2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Mock Sportsbook</h3>
                <p className="text-sm text-gray-600">Simulate bets to test strategies without risk</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Performance Analytics</h3>
                <p className="text-sm text-gray-600">Charts for ROI, spreads, totals, moneylines, and line movement</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-orange-50">
              <Store className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Marketplace</h3>
                <p className="text-sm text-gray-600">Discover and subscribe to independent sellers&apos; strategies</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Seller Tools</h3>
                <p className="text-sm text-gray-600">Profile pages, performance history, and subscription management</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-pink-50">
              <CreditCard className="h-5 w-5 text-pink-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Secure Payments</h3>
                <p className="text-sm text-gray-600">Subscriptions and payouts powered by Stripe</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <HelpCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">❓ Frequently Asked Questions</h2>
          </div>
          
          <FAQAccordion />
        </div>

        {/* Troubleshooting Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">🛠 Troubleshooting</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border-l-4 border-orange-400 bg-orange-50 rounded-r-lg">
              <div>
                <p className="font-semibold text-gray-900">Sportsbook isn&apos;t syncing</p>
                <p className="text-gray-600">Try unlinking and re-linking through Analytics → Link Sportsbooks.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
              <div>
                <p className="font-semibold text-gray-900">Bets are missing</p>
                <p className="text-gray-600">Use Refresh Bets in Analytics.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border-l-4 border-purple-400 bg-purple-50 rounded-r-lg">
              <div>
                <p className="font-semibold text-gray-900">Payment issues</p>
                <p className="text-gray-600">Update your details in the Settings page.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
              <div>
                <p className="font-semibold text-gray-900">Still stuck?</p>
                <p className="text-gray-600">
                  Contact{' '}
                  <a href="mailto:info@truesharp.io" className="text-blue-600 hover:text-blue-700 font-semibold">
                    info@truesharp.io
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsible Gaming Section */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm p-8 border border-red-200">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-red-800">📌 Responsible Gaming</h2>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-red-200">
            <p className="text-gray-700 mb-4">
              TrueSharp encourages responsible betting. If you feel your betting is out of control, visit{' '}
              <a href="https://www.ncpgambling.org" className="text-blue-600 hover:text-blue-700 font-semibold" target="_blank" rel="noopener noreferrer">
                NCPG
              </a>
              {' '}or call{' '}
              <a href="tel:1-800-522-4700" className="text-blue-600 hover:text-blue-700 font-semibold">
                1-800-GAMBLER
              </a>.
            </p>
            
            <div className="flex items-center text-red-700 bg-red-100 rounded-lg p-3">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p className="font-medium text-sm">
                Remember: Betting should be fun and within your means. Never bet more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
