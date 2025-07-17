"use client"
import { useAuth } from '@/lib/hooks/use-auth'
import { Eye, EyeOff, Lock, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// TrueSharp Shield Component
const TrueSharpShield = ({ className = "h-6 w-6", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill={`url(#shieldGradient-${variant})`} 
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

export default function EnhancedLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

const { signIn } = useAuth()
const router = useRouter()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  
  // Get form data
  const formData = new FormData(e.target as HTMLFormElement)
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rememberMe = formData.get('remember-me') === 'on'

  try {
    const result = await signIn(email, password, rememberMe)
    
    if (result.error) {
      // Show error message (you can add error state)
      console.error('Login error:', result.error)
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div>
            <Link href="/" className="flex items-center space-x-3 group">
              <TrueSharpShield className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                TrueSharp
              </span>
            </Link>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </button>
              </div>
            </form>

            {/* Demo Access */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-500">Demo Access</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white/70 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 hover:scale-105"
                >
                  Try Demo Dashboard
                </Link>
                <p className="mt-2 text-xs text-slate-500 text-center">
                  Explore TrueSharp with sample data - no signup required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Stats/Benefits */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
          <div className="max-w-md text-center text-white p-8">
            <TrendingUp className="h-16 w-16 text-green-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">
              Track Like a Pro
            </h3>
            <p className="text-green-100 mb-8">
              Join thousands of bettors using TrueSharp to track performance, analyze trends, and monetize their expertise.
            </p>

            {/* Sample Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-green-400/20">
              <h4 className="text-lg font-semibold mb-4">Platform Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-green-300">2.4M+</div>
                  <div className="text-green-100">Bets Tracked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">15+</div>
                  <div className="text-green-100">Sportsbooks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">89%</div>
                  <div className="text-green-100">User Retention</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">$2.1M</div>
                  <div className="text-green-100">Seller Earnings</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-3 animate-pulse"></div>
                Advanced analytics and insights
              </div>
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-3 animate-pulse"></div>
                Verified performance tracking
              </div>
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-3 animate-pulse"></div>
                Marketplace to buy/sell picks
              </div>
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-3 animate-pulse"></div>
                Community of proven winners
              </div>
            </div>

            {/* Success Stories */}
            <div className="mt-8 text-left">
              <div className="bg-white/5 rounded-lg p-4 border border-green-400/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-xs font-bold">MK</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">@mikekelly</div>
                    <div className="text-xs text-green-300">MLB Specialist</div>
                  </div>
                </div>
                <p className="text-sm text-green-100">
                  "Increased my ROI by 23% using TrueSharp's analytics. The line movement data is game-changing."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}