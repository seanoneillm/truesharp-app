'use client'

import { validateEmail } from '@/lib/auth/validation'
import { useAuth } from '@/lib/hooks/use-auth'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PasswordReset } from './password-reset'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [urlMessage, setUrlMessage] = useState<string | null>(null)
  const [urlMessageType, setUrlMessageType] = useState<'success' | 'error'>('error')

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const router = useRouter()

  // Check for URL parameters (verification success/error messages) and handle tokens
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if there's a token in the URL hash (for email verification and magic links)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        if (accessToken && type) {
          setIsLoading(true)
          setUrlMessage('Processing authentication...')
          setUrlMessageType('success')
          
          try {
            // Import supabase client
            const { createClient } = await import('@/lib/supabase')
            const supabase = createClient()
            
            // Get the current session to check if user is authenticated
            const { data, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('Session check error:', error)
              setUrlMessage('Authentication error occurred.')
              setUrlMessageType('error')
            } else if (data.session) {
              console.log('User authenticated successfully, redirecting to dashboard')
              setUrlMessage('Successfully authenticated! Redirecting...')
              setUrlMessageType('success')
              
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname)
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                router.push('/dashboard')
              }, 1000)
              return
            } else {
              setUrlMessage('Authentication failed. Please try again.')
              setUrlMessageType('error')
            }
          } catch (error) {
            console.error('Authentication processing error:', error)
            setUrlMessage('An error occurred during authentication.')
            setUrlMessageType('error')
          } finally {
            setIsLoading(false)
          }
          return
        }
      }

      // Handle regular URL parameters (existing logic)
      const error = searchParams.get('error')
      const message = searchParams.get('message')
      const verified = searchParams.get('verified')

      if (verified === 'true') {
        setUrlMessage('Email verified successfully! You can now sign in.')
        setUrlMessageType('success')
      } else if (error && message) {
        setUrlMessage(message)
        setUrlMessageType('error')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      if (result.error) {
        setErrors({ general: result.error })
      } else {
        // Success - redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Message (verification success/error) */}
        {urlMessage && (
          <div
            className={`rounded-xl border p-4 ${
              urlMessageType === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div
              className={`flex items-center ${
                urlMessageType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {urlMessageType === 'success' ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              <span className="text-sm">{urlMessage}</span>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full appearance-none rounded-xl border bg-white/70 py-3 pl-10 pr-3 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full appearance-none rounded-xl border bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center rounded-lg pr-3 transition-colors hover:bg-slate-100"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              ) : (
                <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-900">
              Remember me
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordReset(true)}
            className="text-sm text-blue-600 transition-colors hover:text-blue-500"
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      {/* Password Reset Modal */}
      <PasswordReset isOpen={showPasswordReset} onClose={() => setShowPasswordReset(false)} />
    </>
  )
}
