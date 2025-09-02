import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Crown,
  DollarSign,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

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

export default function EnhancedLandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex items-center lg:flex-1">
            <Link href="/" className="group -m-1.5 flex items-center space-x-3 p-1.5">
              <TrueSharpShield className="h-10 w-10 transition-transform duration-200 group-hover:scale-105" />
              <span className="text-2xl font-bold tracking-tight text-white">TrueSharp</span>
            </Link>
          </div>
          <div className="flex space-x-4 lg:flex-1 lg:justify-end">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold leading-6 text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-500 hover:shadow-xl"
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
              <div className="flex items-center space-x-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
                <TrueSharpShield className="h-6 w-6" variant="light" />
                <span className="text-sm font-medium text-white/90">
                  100% Verified Data Platform
                </span>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-7xl">
              The Only
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {' '}
                Verified
              </span>
              <br />
              Sports Betting Community
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-white/80">
              Track your real betting performance with automatic sportsbook sync. No fake records,
              no manual entry - just 100% authentic data. Turn your expertise into income by selling
              access to your stategy.
            </p>
            <div className="mt-12 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="group flex items-center space-x-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/25"
              >
                <span>Start Tracking Free</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="group flex items-center space-x-2 text-lg font-semibold leading-6 text-white/90 transition-colors duration-200 hover:text-white"
              >
                <span>Learn more</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '100%', label: 'Verified Data', icon: Shield },
              { value: '15+', label: 'Sportsbooks', icon: Target },
              { value: '$0', label: 'Setup Cost', icon: DollarSign },
              { value: '24/7', label: 'Auto Sync', icon: Zap },
            ].map((stat, index) => (
              <div key={index} className="group text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20">
                    <stat.icon className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="mb-1 text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl lg:text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <Trophy className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <h2 className="text-base font-semibold uppercase leading-7 tracking-wide text-blue-400">
              Everything you need
            </h2>
            <p className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Turn your strategy into a business
            </p>
            <p className="mt-6 text-xl leading-8 text-white/80">
              From tracking your performance to monetizing your expertise, TrueSharp provides
              everything you need to succeed in sports betting.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: '100% Verified Tracking',
                  description:
                    'Automatically sync with all major sportsbooks. Every bet is verified and authentic.',
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: BarChart3,
                  title: 'Advanced Analytics',
                  description:
                    'Deep dive into your performance with unlimited filters, trend analysis, and predictive insights. See what works and optimize your strategy.',
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  icon: DollarSign,
                  title: 'Monetize Your Picks',
                  description:
                    'Turn your expertise into recurring income. Monetize your strategy with verified track records that build trust with subscribers.',
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  icon: Users,
                  title: 'Verified Community',
                  description:
                    'Connect with proven winners. Browse verified sellers, see real performance data, and subscribe to the best bettors in each sport.',
                  gradient: 'from-orange-500 to-red-500',
                },
                {
                  icon: TrendingUp,
                  title: 'Line Movement Data',
                  description:
                    'Track closing line value, steam moves, and market inefficiencies. Get professional-grade data to maximize your edge.',
                  gradient: 'from-indigo-500 to-blue-500',
                },
                {
                  icon: Zap,
                  title: 'Real-time Sync',
                  description:
                    'Your bets appear automatically within minutes. Set it up once and let TrueSharp handle the tracking while you focus on winning.',
                  gradient: 'from-yellow-500 to-orange-500',
                },
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10">
                    <dt className="mb-4 flex items-center gap-x-4 text-xl font-semibold leading-7 text-white">
                      <div
                        className={`bg-gradient-to-br p-3 ${feature.gradient} rounded-2xl shadow-lg`}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      {feature.title}
                    </dt>
                    <dd className="text-base leading-7 text-white/80">{feature.description}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Enhanced Pricing Section */}
      <div className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Start free, upgrade when ready
            </h2>
            <p className="text-xl leading-8 text-white/80">
              Get started with essential tracking features, then unlock advanced analytics and
              monetization tools.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-2">
            {/* Free Tier */}
            <div className="group relative">
              <div className="h-full rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold leading-8 text-white">Free Tracking</h3>
                  <div className="rounded-xl bg-green-500/20 p-2">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <p className="mb-6 text-white/70">
                  Everything you need to start tracking your betting performance.
                </p>
                <p className="mb-8 flex items-baseline gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-white">$0</span>
                  <span className="text-lg font-semibold leading-6 text-white/70">/month</span>
                </p>
                <ul className="mb-8 space-y-4 text-white/80">
                  {[
                    'Unlimited bet tracking',
                    'Basic performance analytics',
                    'Automatic sportsbook sync',
                    'Monetize your Strategy',
                    'Mobile app access',
                  ].map((feature, index) => (
                    <li key={index} className="flex gap-x-3">
                      <CheckCircle className="h-6 w-5 flex-none text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl bg-white/10 px-4 py-3 text-center font-semibold text-white transition-colors duration-200 hover:bg-white/20"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="group relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-75 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative h-full rounded-3xl bg-slate-900/90 p-8 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold leading-8 text-white">TrueSharp Pro</h3>
                  <div className="flex items-center space-x-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1">
                    <Crown className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">POPULAR</span>
                  </div>
                </div>
                <p className="mb-6 text-white/70">
                  Advanced analytics and monetization tools for serious bettors.
                </p>
                <p className="mb-8 flex items-baseline gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-white">$19.99</span>
                  <span className="text-lg font-semibold leading-6 text-white/70">/month</span>
                </p>
                <ul className="mb-8 space-y-4 text-white/80">
                  {[
                    'Everything in Free',
                    'Advanced analytics engine',
                    'Line movement data',
                    'Custom reports & alerts',
                  ].map((feature, index) => (
                    <li key={index} className="flex gap-x-3">
                      <CheckCircle className="h-6 w-5 flex-none text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-center font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500"
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
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Trusted by winning bettors
            </h2>
            <p className="mt-6 text-xl leading-8 text-white/80">
              Join thousands of sports bettors who trust TrueSharp to track their performance and
              grow their bankroll.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                quote:
                  'TrueSharp showed me exactly where I was losing money. The analytics are incredible - I improved my ROI by 15% in just two months.',
                author: '@mikejohnson',
                role: 'NBA Specialist',
                avatar: 'MJ',
                color: 'bg-blue-500',
              },
              {
                quote:
                  "I've made over $3,000 selling my picks on TrueSharp. The verified tracking builds trust with subscribers instantly.",
                author: '@sharpbettor',
                role: 'Verified Seller',
                avatar: 'SR',
                color: 'bg-green-500',
              },
              {
                quote:
                  'Finally, a platform that shows real results. No more fake screenshots or made-up records. TrueSharp is the real deal.',
                author: '@alexdoyle',
                role: 'CFB Expert',
                avatar: 'AD',
                color: 'bg-purple-500',
              },
            ].map((testimonial, index) => (
              <div key={index} className="group">
                <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                  <div className="mb-6 flex gap-x-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mb-6 text-lg leading-8 text-white">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-x-4">
                    <div
                      className={`h-12 w-12 rounded-full ${testimonial.color} flex items-center justify-center`}
                    >
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
      <div className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <TrueSharpShield className="h-16 w-16" variant="light" />
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to track like a pro?
            </h2>
            <p className="mb-12 text-xl leading-8 text-white/80">
              Join the only sports betting platform with 100% verified data. Start tracking your
              performance and building your reputation today.
            </p>
            <div className="flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="group rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/25"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="group flex items-center space-x-2 text-lg font-semibold leading-6 text-white/90 transition-colors duration-200 hover:text-white"
              >
                <span>Already have an account?</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="mb-6 flex items-center space-x-3">
                <TrueSharpShield className="h-8 w-8" />
                <span className="text-xl font-bold text-white">TrueSharp</span>
              </div>
              <p className="max-w-md text-white/70">
                The only verified sports betting platform. Track your real performance and turn your
                expertise into income.
              </p>
            </div>

            {/* Footer Links */}
            {[
              {
                title: 'Product',
                links: [
                  { name: 'Features', href: '#features' },
                  { name: 'Pricing', href: '/pricing' },
                  { name: 'Marketplace', href: '/marketplace' },
                  { name: 'Analytics', href: '/analytics' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { name: 'About', href: '/about' },
                  { name: 'Blog', href: '/blog' },
                  { name: 'Careers', href: '/careers' },
                  { name: 'Contact', href: '/contact' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { name: 'Privacy', href: '/legal/privacy' },
                  { name: 'Terms', href: '/legal/terms' },
                  { name: 'Disclaimer', href: '/legal/disclaimer' },
                ],
              },
            ].map((column, index) => (
              <div key={index}>
                <h3 className="mb-6 text-sm font-semibold text-white">{column.title}</h3>
                <ul className="space-y-4">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors duration-200 hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/70">© 2025 TrueSharp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
