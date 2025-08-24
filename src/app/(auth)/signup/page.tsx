'use client'

import { SignUpForm } from '@/components/auth/signup-form'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <TrueSharpShield className="h-10 w-10 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              TrueSharp
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join the verified sports betting community
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="mt-8">
          <SignUpForm />
        </div>

        {/* What happens next section */}
        <div className="mt-8">
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
              Complete your profile setup
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-medium text-xs">3</span>
              </div>
              Start tracking your betting performance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
