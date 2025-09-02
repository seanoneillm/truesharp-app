'use client'

import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { validatePassword } from '@/lib/auth/validation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if we have the required parameters from the reset link
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(calculatePasswordStrength(newPassword))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Please enter a valid password')
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (error) {
      console.error('Password update error:', error)
      setError('An unexpected error occurred. Please try again.')
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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <Link href="/" className="group inline-flex items-center space-x-3">
              <TrueSharpShield className="h-10 w-10 transition-transform duration-200 group-hover:scale-110" />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
                TrueSharp
              </span>
            </Link>
          </div>

          <div className="py-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Password updated successfully
            </h2>
            <p className="mb-6 text-slate-600">
              Your password has been updated. You&apos;ll be redirected to the login page shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-base font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-cyan-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="group inline-flex items-center space-x-3">
            <TrueSharpShield className="h-10 w-10 transition-transform duration-200 group-hover:scale-110" />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
              TrueSharp
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-slate-600">Enter your new password below</p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              New Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={handlePasswordChange}
                className="block w-full appearance-none rounded-xl border border-slate-300 bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your new password"
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
            {password && (
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
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="block w-full appearance-none rounded-xl border border-slate-300 bg-white/70 py-3 pl-10 pr-10 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your new password"
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
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-slate-600 transition-colors hover:text-blue-600"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
