'use client'

import { LegalModals } from '@/components/auth/legal-modals'
import { validateEmail, validatePassword, validateUsername } from '@/lib/auth/validation'
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

interface SignUpFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  ageVerified: boolean
}

interface FormErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  terms?: string
  age?: string
  general?: string
}

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showLegalModals, setShowLegalModals] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    ageVerified: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  const router = useRouter()

  // Real-time username availability checking
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))

    // Real-time validation
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    if (name === 'username' && typeof value === 'string') {
      // Debounced username checking
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current)
      }
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(value)
      }, 500)
    }

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
      newErrors.email = emailValidation.error
    }

    // Username validation
    const usernameValidation = validateUsername(formData.username)
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken'
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Legal compliance validation
    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the Terms of Service and Privacy Policy'
    }

    if (!formData.ageVerified) {
      newErrors.age = 'You must be 21 or older to use TrueSharp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (usernameAvailable === false) return

    setIsLoading(true)
    setErrors({})

    try {
      // Use server-side signup API instead of client-side auth
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          username: formData.username,
          displayName: formData.username,
          termsAccepted: formData.termsAccepted,
          ageVerified: formData.ageVerified,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErrors({ general: result.error || 'Signup failed' })
      } else {
        // Success - redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Signup failed:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (): string => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleInputChange}
              className={`block w-full appearance-none rounded-xl border bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username
                  ? 'border-red-300'
                  : usernameAvailable === true
                    ? 'border-green-300'
                    : usernameAvailable === false
                      ? 'border-red-300'
                      : 'border-slate-300'
              }`}
              placeholder="Choose a username (3-20 characters)"
            />
            {/* Username Status Indicator */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {usernameChecking && (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              )}
              {!usernameChecking && usernameAvailable === true && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {!usernameChecking && usernameAvailable === false && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          {errors.username && (
            <p className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.username}
            </p>
          )}
          {!errors.username && usernameAvailable === true && (
            <p className="mt-1 text-sm text-green-600">✓ Username is available</p>
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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full appearance-none rounded-xl border bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Create a secure password"
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 flex-1 rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength <= 2
                      ? 'text-red-600'
                      : passwordStrength <= 3
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`block w-full appearance-none rounded-xl border bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center rounded-lg pr-3 transition-colors hover:bg-slate-100"
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
            <p className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Legal Compliance */}
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              id="terms"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-slate-900">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowLegalModals(true)}
                className="text-blue-600 underline hover:text-blue-500"
              >
                Terms of Service and Privacy Policy
              </button>
            </label>
          </div>
          {errors.terms && (
            <p className="flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
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
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="age" className="ml-2 block text-sm text-slate-900">
              I am 21 years of age or older
            </label>
          </div>
          {errors.age && (
            <p className="flex items-center text-sm text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.age}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading || usernameChecking || usernameAvailable === false}
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      {/* Legal Modals */}
      <LegalModals isOpen={showLegalModals} onClose={() => setShowLegalModals(false)} />
    </>
  )
}
