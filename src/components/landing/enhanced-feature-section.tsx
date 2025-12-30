'use client'

import { BarChart3, Shield, Users, DollarSign, Gamepad2, Activity, Smartphone, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { placeholders } from '@/utils/generatePlaceholder'

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics Dashboard',
    description: 'Professional-grade performance tracking with CLV analysis, trend identification, profit/loss breakdowns, and unlimited custom filters.',
    category: 'Analytics',
    screenshot: '/images/screenshots/features/analytics-feature.png',
    fallback: '/images/feature-screenshots/analytics-preview.svg',
    screenshotAlt: 'TrueSharp analytics dashboard showing detailed performance metrics and charts',
    highlights: ['CLV Analysis', 'Profit/Loss Tracking', 'Custom Filters', 'Trend Analysis']
  },
  {
    icon: Shield,
    title: 'Automatic Sportsbook Sync',
    description: 'Securely connect 15+ major sportsbooks via SharpSports. Real-time bet syncing with bank-level security and 100% verification.',
    category: 'Analytics',
    screenshot: '/images/screenshots/features/sync-feature.png',
    fallback: '/images/feature-screenshots/sharpsports-sync.svg',
    screenshotAlt: 'SharpSports to TrueSharp syncing interface showing connected sportsbooks',
    highlights: ['15+ Sportsbooks', 'Real-time Sync', 'Bank-level Security', '100% Verified']
  },
  {
    icon: Users,
    title: 'Verified Seller Marketplace',
    description: 'Discover proven strategies from verified bettors. Browse by sport, ROI, win rate, and bet types. All performance data is authentic.',
    category: 'Marketplace',
    screenshot: '/images/screenshots/features/marketplace-feature.png',
    fallback: '/images/feature-screenshots/strategy-details.svg',
    screenshotAlt: 'Strategy details modal showing performance metrics before subscription',
    highlights: ['Verified Strategies', 'Detailed Analytics', 'Sport Filtering', 'Authentic Data']
  },
  {
    icon: Gamepad2,
    title: 'Mock Sportsbook Testing',
    description: 'Test new strategies risk-free in our simulated environment. Perfect for sellers to validate picks before sharing with subscribers.',
    category: 'Other',
    screenshot: '/images/screenshots/features/mock-testing-feature.png',
    fallback: '/images/feature-screenshots/mock-betslip.svg',
    screenshotAlt: 'Mock sportsbook betting slip interface for risk-free testing',
    highlights: ['Risk-free Testing', 'Strategy Validation', 'Simulated Environment', 'Pre-launch Testing']
  },
  {
    icon: Activity,
    title: 'Odds Research Tools',
    description: 'Research line movement, view last 10 results for every prop, and analyze betting trends before placing your bets.',
    category: 'Other',
    screenshot: '/images/screenshots/features/odds-research-feature.png',
    fallback: '/images/feature-screenshots/odds-research.svg',
    screenshotAlt: 'Odds research tools showing line movement and prop betting history',
    highlights: ['Line Movement', 'Prop Histories', 'Betting Trends', 'Research Tools']
  }
]

export default function EnhancedFeatureSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features for Every Bettor
            </h2>
            <img 
              src="/images/truesharp-logo.png" 
              alt="TrueSharp Logo" 
              className="h-10 w-10 rounded-lg shadow-sm" 
            />
          </div>
          <p className="text-lg leading-7 text-gray-600">
            Whether you're tracking performance, finding strategies, or building a business
          </p>
        </div>

        <div className="grid gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
              index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
            }`}>
              {/* Feature Content */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <div className="rounded-2xl bg-white p-6 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
                  <div className="mb-4">
                    <div className="mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        feature.category === 'Analytics' ? 'bg-blue-100 text-blue-800' :
                        feature.category === 'Marketplace' ? 'bg-purple-100 text-purple-800' :
                        feature.category === 'Selling' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {feature.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                    
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {feature.highlights.map((highlight, highlightIndex) => (
                        <div key={highlightIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div>
                      <a
                        href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200"
                      >
                        Try This Feature
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Screenshot */}
              <div className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className="relative group">
                  {/* Modern iPhone Frame */}
                  <div className="relative mx-auto w-[280px] h-[560px] rounded-[3.2rem] bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 p-2 shadow-2xl">
                    <div className="w-full h-full bg-black rounded-[2.8rem] overflow-hidden relative">
                      {/* Dynamic Island */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20"></div>
                      
                      {/* Screenshot */}
                      <div className="relative w-full h-full">
                        <Image
                          src={feature.screenshot}
                          alt={feature.screenshotAlt}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-105"
                          sizes="280px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = feature.fallback
                          }}
                        />
                      </div>
                      
                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Enhanced Glow Effects */}
                  <div className="absolute inset-0 bg-blue-500/15 rounded-[3.2rem] blur-2xl scale-110 -z-10 group-hover:bg-blue-500/25 transition-all duration-700"></div>
                  <div className="absolute -inset-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-[4rem] blur-3xl -z-20 opacity-60 group-hover:opacity-80 transition-all duration-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}