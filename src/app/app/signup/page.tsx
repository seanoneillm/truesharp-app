"use client"
import { useAuth } from '@/lib/hooks/use-auth'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
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

export default function EnhancedSignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    ageVerified: false
  })
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  const validatePassword = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    if (name === 'password') {
      setPasswordStrength(validatePassword(value))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms of service'
    }

    if (!formData.ageVerified) {
      newErrors.age = 'You must be 21 or older to use TrueSharp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

const { signUp } = useAuth()
const router = useRouter()

const handleSubmit = async () => {
  if (!validateForm()) return

  setIsLoading(true)
  
  try {
    const result = await signUp({
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      username: formData.username,
      displayName: formData.username, // or add displayName field
      termsAccepted: formData.termsAccepted,
      ageVerified: formData.ageVerified
    })
    
    if (result.error) {
      // Show error message
      console.error('Signup error:', result.error)
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Signup failed:', error)
  } finally {
    setIsLoading(false)
  }
}

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
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
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="space-y-6">
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
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80 ${
                      errors.email ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80 ${
                      errors.username ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.username}
                  </p>
                )}
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80 ${
                      errors.password ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Create a password"
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' : 
                        passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-10 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:bg-white/80 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms and Age Verification */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    id="terms"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-slate-900">
                    I agree to the{' '}
                    <Link href="/legal/terms" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.terms}
                  </p>
                )}

                <div className="flex items-start">
                  <input
                    id="age"
                    name="ageVerified"
                    type="checkbox"
                    checked={formData.ageVerified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5"
                  />
                  <label htmlFor="age" className="ml-2 block text-sm text-slate-900">
                    I am 21 years of age or older
                  </label>
                </div>
                {errors.age && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.age}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>

            {/* What happens next section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-500">What happens next?</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-xs">1</span>
                  </div>
                  Verify your email address
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-xs">2</span>
                  </div>
                  Connect your first sportsbook
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium text-xs">3</span>
                  </div>
                  Start tracking your bets automatically
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
          <div className="max-w-md text-center text-white p-8">
            <TrueSharpShield className="h-16 w-16 text-blue-300 mx-auto mb-6" variant="light" />
            <h3 className="text-2xl font-bold mb-4">
              100% Verified Data
            </h3>
            <p className="text-blue-100 mb-8">
              Your bets sync automatically from connected sportsbooks. No manual entry means no fake records - every stat is authentic and verified.
            </p>

            {/* Platform Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-blue-400/20">
              <h4 className="text-lg font-semibold mb-4">Join Our Community</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-blue-300">25K+</div>
                  <div className="text-blue-100">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">15+</div>
                  <div className="text-blue-100">Sportsbooks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">95%</div>
                  <div className="text-blue-100">Satisfaction</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">$5M+</div>
                  <div className="text-blue-100">Tracked Bets</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-blue-100">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                Automatic sportsbook integration
              </div>
              <div className="flex items-center text-blue-100">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                Real-time performance tracking
              </div>
              <div className="flex items-center text-blue-100">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                Professional analytics tools
              </div>
              <div className="flex items-center text-blue-100">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                Monetize your expertise
              </div>
            </div>

            {/* Success Story */}
            <div className="mt-8">
              <div className="bg-white/5 rounded-lg p-4 border border-blue-400/20">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-sm font-bold">JS</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">@johnsmith</div>
                    <div className="text-xs text-blue-300">NFL Expert</div>
                  </div>
                </div>
                <p className="text-sm text-blue-100 text-left">
                  "TrueSharp helped me turn my betting hobby into a $50k/year side business. The verified tracking builds instant credibility."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}