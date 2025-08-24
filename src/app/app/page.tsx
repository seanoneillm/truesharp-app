import { ArrowRight, BarChart3, CheckCircle, Crown, DollarSign, Shield, Star, Target, TrendingUp, Trophy, Users, Zap } from 'lucide-react'
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

export default function EnhancedLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-50 border-b border-white/10 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1 items-center">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-3 group">
              <TrueSharpShield className="h-10 w-10 group-hover:scale-105 transition-transform duration-200" />
              <span className="text-2xl font-bold text-white tracking-tight">TrueSharp</span>
            </Link>
          </div>
          <div className="flex lg:flex-1 lg:justify-end space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-white/90 hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-5xl py-24 sm:py-32">
          <div className="text-center">
            {/* Trust Badge */}
            <div className="mb-8 flex justify-center">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
                <TrueSharpShield className="h-6 w-6" variant="light" />
                <span className="text-sm font-medium text-white/90">100% Verified Data Platform</span>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl leading-tight">
              The Only
              <span className="text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text"> Verified</span>
              <br />
              Sports Betting Community
            </h1>
            <p className="mt-8 text-xl leading-8 text-white/80 max-w-3xl mx-auto">
              Track your real betting performance with automatic sportsbook sync.
              No fake records, no manual entry - just 100% authentic data.
              Turn your expertise into income by selling access to your stategy.
            </p>
            <div className="mt-12 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="group rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl hover:bg-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 flex items-center space-x-2"
              >
                <span>Start Tracking Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="#features"
                className="text-lg font-semibold leading-6 text-white/90 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
              >
                <span>Learn more</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "100%", label: "Verified Data", icon: Shield },
              { value: "15+", label: "Sportsbooks", icon: Target },
              { value: "$0", label: "Setup Cost", icon: DollarSign },
              { value: "24/7", label: "Auto Sync", icon: Zap }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                    <stat.icon className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div id="features" className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl lg:text-center mb-20">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Trophy className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <h2 className="text-base font-semibold leading-7 text-blue-400 tracking-wide uppercase">Everything you need</h2>
            <p className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Turn your strategy into a business
            </p>
            <p className="mt-6 text-xl leading-8 text-white/80">
              From tracking your performance to monetizing your expertise, TrueSharp provides everything you need to succeed in sports betting.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "100% Verified Tracking",
                  description: "Automatically sync with all major sportsbooks. Every bet is verified and authentic.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  description: "Deep dive into your performance with unlimited filters, trend analysis, and predictive insights. See what works and optimize your strategy.",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: DollarSign,
                  title: "Monetize Your Picks",
                  description: "Turn your expertise into recurring income. Monetize your strategy with verified track records that build trust with subscribers.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Users,
                  title: "Verified Community",
                  description: "Connect with proven winners. Browse verified sellers, see real performance data, and subscribe to the best bettors in each sport.",
                  gradient: "from-orange-500 to-red-500"
                },
                {
                  icon: TrendingUp,
                  title: "Line Movement Data",
                  description: "Track closing line value, steam moves, and market inefficiencies. Get professional-grade data to maximize your edge.",
                  gradient: "from-indigo-500 to-blue-500"
                },
                {
                  icon: Zap,
                  title: "Real-time Sync",
                  description: "Your bets appear automatically within minutes. Set it up once and let TrueSharp handle the tracking while you focus on winning.",
                  gradient: "from-yellow-500 to-orange-500"
                }
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="h-full p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:border-white/20 hover:scale-105">
                    <dt className="flex items-center gap-x-4 text-xl font-semibold leading-7 text-white mb-4">
                      <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      {feature.title}
                    </dt>
                    <dd className="text-base leading-7 text-white/80">
                      {feature.description}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Enhanced Pricing Section */}
      <div className="py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Start free, upgrade when ready
            </h2>
            <p className="text-xl leading-8 text-white/80">
              Get started with essential tracking features, then unlock advanced analytics and monetization tools.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-2">
            {/* Free Tier */}
            <div className="group relative">
              <div className="h-full p-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold leading-8 text-white">Free Tracking</h3>
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <p className="text-white/70 mb-6">
                  Everything you need to start tracking your betting performance.
                </p>
                <p className="flex items-baseline gap-x-2 mb-8">
                  <span className="text-5xl font-bold tracking-tight text-white">$0</span>
                  <span className="text-lg font-semibold leading-6 text-white/70">/month</span>
                </p>
                <ul className="space-y-4 text-white/80 mb-8">
                  {[
                    "Unlimited bet tracking",
                    "Basic performance analytics",
                    "Automatic sportsbook sync",
                    "Monetize your Strategy",
                    "Mobile app access"
                  ].map((feature, index) => (
                    <li key={index} className="flex gap-x-3">
                      <CheckCircle className="h-6 w-5 flex-none text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl bg-white/10 px-4 py-3 text-center font-semibold text-white hover:bg-white/20 transition-colors duration-200"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-full p-8 bg-slate-900/90 backdrop-blur-sm rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold leading-8 text-white">TrueSharp Pro</h3>
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 rounded-full">
                    <Crown className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">POPULAR</span>
                  </div>
                </div>
                <p className="text-white/70 mb-6">
                  Advanced analytics and monetization tools for serious bettors.
                </p>
                <p className="flex items-baseline gap-x-2 mb-8">
                  <span className="text-5xl font-bold tracking-tight text-white">$19.99</span>
                  <span className="text-lg font-semibold leading-6 text-white/70">/month</span>
                </p>
                <ul className="space-y-4 text-white/80 mb-8">
                  {[
                    "Everything in Free",
                    "Advanced analytics engine",
                    "Line movement data",
                    "Custom reports & alerts"
                  ].map((feature, index) => (
                    <li key={index} className="flex gap-x-3">
                      <CheckCircle className="h-6 w-5 flex-none text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-center font-semibold text-white shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Social Proof */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Trusted by winning bettors
            </h2>
            <p className="mt-6 text-xl leading-8 text-white/80">
              Join thousands of sports bettors who trust TrueSharp to track their performance and grow their bankroll.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                quote: "TrueSharp showed me exactly where I was losing money. The analytics are incredible - I improved my ROI by 15% in just two months.",
                author: "@mikejohnson",
                role: "NBA Specialist",
                avatar: "MJ",
                color: "bg-blue-500"
              },
              {
                quote: "I've made over $3,000 selling my picks on TrueSharp. The verified tracking builds trust with subscribers instantly.",
                author: "@sharpbettor",
                role: "Verified Seller",
                avatar: "SR",
                color: "bg-green-500"
              },
              {
                quote: "Finally, a platform that shows real results. No more fake screenshots or made-up records. TrueSharp is the real deal.",
                author: "@alexdoyle",
                role: "CFB Expert",
                avatar: "AD",
                color: "bg-purple-500"
              }
            ].map((testimonial, index) => (
              <div key={index} className="group">
                <div className="h-full p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:border-white/20">
                  <div className="flex gap-x-1 text-yellow-400 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg leading-8 text-white mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-x-4">
                    <div className={`h-12 w-12 rounded-full ${testimonial.color} flex items-center justify-center`}>
                      <span className="text-sm font-semibold text-white">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-sm text-white/70">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <TrueSharpShield className="h-16 w-16" variant="light" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Ready to track like a pro?
            </h2>
            <p className="text-xl leading-8 text-white/80 mb-12">
              Join the only sports betting platform with 100% verified data. Start tracking your performance and building your reputation today.
            </p>
            <div className="flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="group rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl hover:bg-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="text-lg font-semibold leading-6 text-white/90 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
              >
                <span>Already have an account?</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <TrueSharpShield className="h-8 w-8" />
                <span className="text-xl font-bold text-white">TrueSharp</span>
              </div>
              <p className="text-white/70 max-w-md">
                The only verified sports betting platform. Track your real performance and turn your expertise into income.
              </p>
            </div>

            {/* Footer Links */}
            {[
              {
                title: "Product",
                links: [
                  { name: "Features", href: "#features" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Marketplace", href: "/marketplace" },
                  { name: "Analytics", href: "/analytics" }
                ]
              },
              {
                title: "Company",
                links: [
                  { name: "About", href: "/about" },
                  { name: "Blog", href: "/blog" },
                  { name: "Careers", href: "/careers" },
                  { name: "Contact", href: "/contact" }
                ]
              },
              {
                title: "Legal",
                links: [
                  { name: "Privacy", href: "/legal/privacy" },
                  { name: "Terms", href: "/legal/terms" },
                  { name: "Disclaimer", href: "/legal/disclaimer" }
                ]
              }
            ].map((column, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-white mb-6">{column.title}</h3>
                <ul className="space-y-4">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors duration-200">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-white/70">
              © 2025 TrueSharp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}