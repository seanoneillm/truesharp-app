'use client'

import {
  BarChart3,
  CheckCircle,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  Activity,
  Gamepad2,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PrivacyPolicyDialog } from '@/components/legal/privacy-policy-dialog'
import { TermsOfServiceDialog } from '@/components/legal/terms-of-service-dialog'
import AppLaunchSection from '@/components/landing/app-launch-section'
import SocialMediaSection from '@/components/landing/social-media-section'

// Shield SVG Component based on your logo
const TrueSharpShield = ({ className = 'h-8 w-8', variant = 'default' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
        <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill="url(#shieldGradient)"
      stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
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
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-3">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg transition-transform duration-200 group-hover:scale-105" 
              />
              <span className="text-2xl font-bold tracking-tight text-gray-900">TrueSharp</span>
            </Link>
          </div>

          {/* Desktop Navigation - Removed internal links */}
          <div className="hidden items-center space-x-8 lg:flex">
            {/* Navigation removed - users must sign up first */}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-16 w-16 rounded-xl shadow-lg" 
              />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Complete Sports Betting Platform
            </h1>
            <p className="mt-4 text-xl leading-8 text-gray-600">
              Sync, track, analyze, and sell verified sports picks from one place. 
              All with 100% verified, synced data from your sportsbooks.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <a
                href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
              >
                Get Started Free
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-base font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Already have an account? Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Launch Section */}
      <AppLaunchSection />

      {/* Social Media Section */}
      <SocialMediaSection />

      {/* How It Works Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How TrueSharp Works
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Everything you need to track, discover, and profit from sports betting
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            {[
              {
                step: '1',
                title: 'Sync Your Verified Performance',
                description:
                  'Connect with SharpSports to automatically sync your betting history from DraftKings, FanDuel, Caesars, and 12+ other major sportsbooks. Every bet is verified and authentic - no fake records possible.',
                icon: Shield,
                category: 'Analytics & Sync',
              },
              {
                step: '2',
                title: 'Discover Winning Strategies',
                description:
                  'Browse our marketplace of verified bettors and subscribe to proven strategies. See real performance data, ROI, and win rates before you subscribe. Find specialists in your favorite sports.',
                icon: Users,
                category: 'Marketplace',
              },
              {
                step: '3',
                title: 'Advanced Performance Analytics',
                description:
                  "Get deep insights with professional-grade analytics. Track CLV, identify your best bet types, analyze trends, and use filters to understand what's working and what isn't.",
                icon: BarChart3,
                category: 'Analytics & Sync',
              },
              {
                step: '4',
                title: 'Monetize Your Expertise',
                description:
                  'Turn your verified track record into income. List up to 5 strategies, set your own prices, and earn from subscriptions. Test strategies in the mock sportsbook before going live.',
                icon: DollarSign,
                category: 'Selling',
              },
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

          <div className="mt-12 text-center">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Supported Sportsbooks</h3>
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
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Powerful Features for Every Bettor
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Whether you're tracking performance, finding strategies, or building a business
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Advanced Analytics Dashboard',
                description:
                  'Professional-grade performance tracking with CLV analysis, trend identification, profit/loss breakdowns, and unlimited custom filters.',
                category: 'Analytics',
              },
              {
                icon: Shield,
                title: 'Automatic Sportsbook Sync',
                description:
                  'Securely connect 15+ major sportsbooks via SharpSports. Real-time bet syncing with bank-level security and 100% verification.',
                category: 'Analytics',
              },
              {
                icon: Users,
                title: 'Verified Seller Marketplace',
                description:
                  'Discover proven strategies from verified bettors. Browse by sport, ROI, win rate, and bet types. All performance data is authentic.',
                category: 'Marketplace',
              },
              {
                icon: DollarSign,
                title: 'Strategy Monetization',
                description:
                  'Turn your track record into income. List up to 5 strategies, set your own subscription prices. Full subscriber management tools included.',
                category: 'Selling',
              },
              {
                icon: Gamepad2,
                title: 'Mock Sportsbook Testing',
                description:
                  'Test new strategies risk-free in our simulated environment. Perfect for sellers to validate picks before sharing with subscribers.',
                category: 'Other',
              },
              {
                icon: Activity,
                title: 'Social Feed & Community',
                description:
                  'Connect with other bettors, share insights, and discuss strategies in our verified community of serious sports bettors.',
                category: 'Other',
              },
            ].map((feature, index) => (
              <div key={index} className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
                <div className="mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
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
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Professional-Grade Analytics
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Get the insights you need to improve your betting performance
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 border border-blue-200 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="h-12 w-12 text-blue-600" />
                <img 
                  src="/images/truesharp-logo.png" 
                  alt="TrueSharp Logo" 
                  className="h-6 w-6 rounded-lg shadow-sm" 
                />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Closing Line Value (CLV) Analysis
              </h3>
              <p className="mb-4 text-gray-600">
                Track how your bets perform against closing lines - the gold standard for measuring
                betting skill. Identify which bet types and sports give you the best edge.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Positive CLV identification across all bet types</li>
                <li>• Sport-by-sport CLV breakdowns</li>
                <li>• Line movement tracking and analysis</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-200 shadow-lg">
              <TrendingUp className="mb-6 h-12 w-12 text-blue-600" />
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Advanced Filtering & Trends
              </h3>
              <p className="mb-4 text-gray-600">
                Drill down into your performance with unlimited filters. Find patterns in your
                betting that you never knew existed.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Filter by date, sport, bet type, odds range</li>
                <li>• Streak analysis and variance tracking</li>
                <li>• Custom time period comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Discovery Section */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Discover Winning Strategies
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Subscribe to verified bettors and learn from the best in each sport
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
              <div className="mb-4 flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                  <span className="text-sm font-semibold text-white">TB</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">TopBaseball</div>
                  <div className="text-sm text-gray-600">MLB Specialist</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
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
              <p className="mb-4 text-sm text-gray-600">
                Specializes in MLB player props and run totals. Strong record in day games and
                division matchups.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
              <div className="mb-4 flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                  <span className="text-sm font-semibold text-white">NE</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">NFLEdge</div>
                  <div className="text-sm text-gray-600">NFL Totals Expert</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
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
              <p className="mb-4 text-sm text-gray-600">
                Focus on NFL over/under totals with weather and pace analysis. Best record in
                primetime games.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
              <div className="mb-4 flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                  <span className="text-sm font-semibold text-white">BM</span>
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">BasketballMath</div>
                  <div className="text-sm text-gray-600">NBA Analytics</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
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
              <p className="mb-4 text-sm text-gray-600">
                Data-driven NBA approach using advanced metrics. Strong in player props and
                alternative spreads.
              </p>
              <div className="text-center">
                <span className="text-sm text-gray-600">Subscription-based strategy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why TrueSharp Section */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Sellers Choose TrueSharp
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Built on trust, transparency, and seller success
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                100% Verified Credibility
              </h3>
              <p className="text-gray-600">
                Every bet is automatically verified through direct sportsbook integration. No fake
                records means higher subscriber trust and conversion rates.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Competitive Revenue Share
              </h3>
              <p className="text-gray-600">
                Earn from your strategies with no hidden fees. We handle payments, customer service,
                and platform maintenance so you can focus on winning.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 shadow-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Secure & Private</h3>
              <p className="text-gray-600">
                We never store your sportsbook credentials. All syncing is handled securely by
                SharpSports with bank-level encryption.{' '}
                <a
                  href="https://www.ncpgambling.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Responsible gaming resources
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Get Started Today
              </h2>
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-10 w-10 rounded-lg shadow-sm" 
              />
            </div>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Join TrueSharp free and access all the tools you need for smarter sports betting
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg">
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg border border-blue-100">
              <h3 className="mb-4 text-2xl font-semibold text-gray-900">Free to Get Started</h3>
              <p className="mb-8 text-gray-600">
                Start using TrueSharp immediately with no upfront costs. Access all core features
                and begin building your verified track record.
              </p>
              <ul className="mb-8 space-y-3 text-left text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Unlimited bet tracking and syncing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Advanced analytics and filtering
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Browse verified marketplace strategies
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  List your own strategies for sale
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Mock sportsbook for testing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-blue-600 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-16 w-16 rounded-xl shadow-lg" 
              />
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Elevate Your Betting?
            </h2>
            <p className="mb-8 text-xl leading-8 text-blue-100">
              Whether you want to track performance, find winning strategies, or build a betting
              business - TrueSharp has you covered.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <a
                href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
              >
                Get Started Free
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-base font-medium text-blue-100 transition-colors hover:text-white"
              >
                Already have an account? Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Brand Column */}
            <div className="col-span-1 lg:col-span-2">
              <div className="mb-6 flex items-center space-x-3">
                <img 
                  src="/images/truesharp-logo.png" 
                  alt="TrueSharp Logo" 
                  className="h-10 w-10 rounded-lg" 
                />
                <span className="text-xl font-bold text-white">TrueSharp</span>
              </div>
              <p className="mb-6 max-w-md text-gray-400">
                The only verified sports betting platform where you can turn your expertise into a
                profitable business. Track your real performance and sell your winning strategies.
              </p>
              <p className="text-gray-400">
                Email:{' '}
                <a href="mailto:info@truesharp.io" className="text-blue-400 hover:text-blue-300">
                  info@truesharp.io
                </a>
              </p>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="mb-6 text-sm font-semibold text-white">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://www.ncpgambling.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Responsible Gaming
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setPrivacyOpen(true)}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setTermsOpen(true)}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">© 2025 TrueSharp. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Legal Dialogs */}
      <PrivacyPolicyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <TermsOfServiceDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  )
}
