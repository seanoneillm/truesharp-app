'use client'

import { SignUpForm } from '@/components/auth/signup-form'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import Link from 'next/link'

export default function SignUpPage() {
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">Join the verified sports betting community</p>
          <p className="mt-1 text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
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
              <span className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 text-slate-500">
                What happens next?
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center text-sm text-slate-600">
              <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              Verify your email address
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              Complete your profile setup
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              Start tracking your betting performance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
