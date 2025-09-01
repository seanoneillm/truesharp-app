import { ArrowRight, BarChart3, CheckCircle, Crown, DollarSign, Shield, Star, Target, TrendingUp, Trophy, Users, Zap, ChevronDown, Activity, LineChart, Gamepad2, HelpCircle } from 'lucide-react'
import Link from 'next/link'

// Shield SVG Component based on your logo
const TrueSharpShield = ({ className = "h-8 w-8", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill="url(#shieldGradient)" 
      stroke={variant === "light" ? "#60a5fa" : "#3b82f6"} 
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

export default function TrueSharpLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <TrueSharpShield className="h-10 w-10 group-hover:scale-105 transition-transform duration-200" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">TrueSharp</span>
            </Link>
          </div>

          {/* Desktop Navigation - Removed internal links */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Navigation removed - users must sign up first */}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Complete Sports Betting Platform
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600">
              Track your performance with advanced analytics, discover winning strategies from verified bettors, and monetize your expertise. All with 100% verified, synced data from your sportsbooks.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="text-lg font-semibold leading-6 text-gray-900 border border-gray-300 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How TrueSharp Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Everything you need to track, discover, and profit from sports betting
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-12 lg:max-w-none lg:grid-cols-2">
            {[
              {
                step: "1",
                title: "Sync Your Verified Performance",
                description: "Connect with SharpSports to automatically sync your betting history from DraftKings, FanDuel, Caesars, and 12+ other major sportsbooks. Every bet is verified and authentic - no fake records possible.",
                icon: Shield,
                category: "Analytics & Sync"
              },
              {
                step: "2", 
                title: "Discover Winning Strategies",
                description: "Browse our marketplace of verified bettors and subscribe to proven strategies. See real performance data, ROI, and win rates before you subscribe. Find specialists in your favorite sports.",
                icon: Users,
                category: "Marketplace"
              },
              {
                step: "3",
                title: "Advanced Performance Analytics",
                description: "Get deep insights with professional-grade analytics. Track CLV, identify your best bet types, analyze trends, and use filters to understand what's working and what isn't.",
                icon: BarChart3,
                category: "Analytics & Sync"
              },
              {
                step: "4",
                title: "Monetize Your Expertise",
                description: "Turn your verified track record into income. List up to 5 strategies, set your own prices, and earn from subscriptions. Test strategies in the mock sportsbook before going live.",
                icon: DollarSign,
                category: "Selling"
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Sportsbooks</h3>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <span className="text-sm font-medium text-gray-500">DraftKings</span>
              <span className="text-sm font-medium text-gray-500">FanDuel</span>
              <span className="text-sm font-medium text-gray-500">Caesars</span>
              <span className="text-sm font-medium text-gray-500">BetMGM</span>
              <span className="text-sm font-medium text-gray-500">+12 more</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features for Every Bettor
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Whether you're tracking performance, finding strategies, or building a business
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Advanced Analytics Dashboard",
                description: "Professional-grade performance tracking with CLV analysis, trend identification, profit/loss breakdowns, and unlimited custom filters.",
                category: "Analytics"
              },
              {
                icon: Shield,
                title: "Automatic Sportsbook Sync",
                description: "Securely connect 15+ major sportsbooks via SharpSports. Real-time bet syncing with bank-level security and 100% verification.",
                category: "Analytics"
              },
              {
                icon: Users,
                title: "Verified Seller Marketplace",
                description: "Discover proven strategies from verified bettors. Browse by sport, ROI, win rate, and bet types. All performance data is authentic.",
                category: "Marketplace"
              },
              {
                icon: DollarSign,
                title: "Strategy Monetization",
                description: "Turn your track record into income. List up to 5 strategies, set your own subscription prices. Full subscriber management tools included.",
                category: "Selling"
              },
              {
                icon: Gamepad2,
                title: "Mock Sportsbook Testing",
                description: "Test new strategies risk-free in our simulated environment. Perfect for sellers to validate picks before sharing with subscribers.",
                category: "Other"
              },
              {
                icon: Activity,
                title: "Social Feed & Community",
                description: "Connect with other bettors, share insights, and discuss strategies in our verified community of serious sports bettors.",
                category: "Other"
              }
            ].map((feature, index) => (
              <div key={index} className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Deep Dive Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Professional-Grade Analytics
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get the insights you need to improve your betting performance
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-8">
              <BarChart3 className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Closing Line Value (CLV) Analysis</h3>
              <p className="text-gray-600 mb-4">
                Track how your bets perform against closing lines - the gold standard for measuring betting skill. Identify which bet types and sports give you the best edge.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Positive CLV identification across all bet types</li>
                <li>• Sport-by-sport CLV breakdowns</li>
                <li>• Line movement tracking and analysis</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-green-50 p-8">
              <TrendingUp className="h-12 w-12 text-green-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Filtering & Trends</h3>
              <p className="text-gray-600 mb-4">
                Drill down into your performance with unlimited filters. Find patterns in your betting that you never knew existed.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Filter by date, sport, bet type, odds range</li>
                <li>• Streak analysis and variance tracking</li>
                <li>• Custom time period comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Discovery Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Discover Winning Strategies
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Subscribe to verified bettors and learn from the best in each sport
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">TB</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">TopBaseball</div>
                  <div className="text-sm text-gray-600">MLB Specialist</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-gray-900">+23.4%</div>
                  <div className="text-xs text-gray-600">ROI</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">847</div>
                  <div className="text-xs text-gray-600">Bets</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">58.2%</div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Specializes in MLB player props and run totals. Strong record in day games and division matchups.</p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">NE</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">NFLEdge</div>
                  <div className="text-sm text-gray-600">NFL Totals Expert</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-gray-900">+19.8%</div>
                  <div className="text-xs text-gray-600">ROI</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">312</div>
                  <div className="text-xs text-gray-600">Bets</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">61.5%</div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Focus on NFL over/under totals with weather and pace analysis. Best record in primetime games.</p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">BM</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">BasketballMath</div>
                  <div className="text-sm text-gray-600">NBA Analytics</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-gray-900">+16.2%</div>
                  <div className="text-xs text-gray-600">ROI</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">523</div>
                  <div className="text-xs text-gray-600">Bets</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">55.8%</div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Data-driven NBA approach using advanced metrics. Strong in player props and alternative spreads.</p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Why TrueSharp Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Sellers Choose TrueSharp
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Built on trust, transparency, and seller success
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">100% Verified Credibility</h3>
              <p className="text-gray-600">
                Every bet is automatically verified through direct sportsbook integration. No fake records means higher subscriber trust and conversion rates.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Revenue Share</h3>
              <p className="text-gray-600">
                Earn from your strategies with no hidden fees. We handle payments, customer service, and platform maintenance so you can focus on winning.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Private</h3>
              <p className="text-gray-600">
                We never store your sportsbook credentials. All syncing is handled securely by SharpSports with bank-level encryption.{' '}
                <a 
                  href="https://www.ncpgambling.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Responsible gaming resources
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get Started Today
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join TrueSharp free and access all the tools you need for smarter sports betting
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-lg">
            <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Free to Get Started</h3>
              <p className="text-gray-600 mb-8">
                Start using TrueSharp immediately with no upfront costs. Access all core features and begin building your verified track record.
              </p>
              <ul className="text-left text-gray-600 mb-8 space-y-3">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Unlimited bet tracking and syncing</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Advanced analytics and filtering</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Browse verified marketplace strategies</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />List your own strategies for sale</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Mock sportsbook for testing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 sm:py-32 bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <TrueSharpShield className="h-16 w-16" variant="light" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Ready to Elevate Your Betting?
            </h2>
            <p className="text-xl leading-8 text-blue-100 mb-12">
              Whether you want to track performance, find winning strategies, or build a betting business - TrueSharp has you covered.
            </p>
            <div className="flex items-center justify-center gap-6 flex-col sm:flex-row">
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="text-white border border-white/20 px-8 py-4 text-lg font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Brand Column */}
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <TrueSharpShield className="h-8 w-8" />
                <span className="text-xl font-bold text-white">TrueSharp</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                The only verified sports betting platform where you can turn your expertise into a profitable business. Track your real performance and sell your winning strategies.
              </p>
              <p className="text-gray-400">
                Email: <a href="mailto:info@truesharp.io" className="text-blue-400 hover:text-blue-300">info@truesharp.io</a>
              </p>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-6">Resources</h3>
              <ul className="space-y-4">
                <li><a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">Responsible Gaming</a></li>
                <li><span className="text-sm text-gray-400">Privacy Policy</span></li>
                <li><span className="text-sm text-gray-400">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              © 2025 TrueSharp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}