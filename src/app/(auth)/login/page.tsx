'use client'

import { LoginForm } from '@/components/auth/login-form'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import Link from 'next/link'

export default function LoginPage() {
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
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to your verified sports betting account
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8">
          <LoginForm />
        </div>

        {/* Additional Links */}
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 text-slate-500">
                Need help?
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href="/help"
              className="block text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              Visit our Help Center
            </Link>
            <Link
              href="/contact"
              className="block text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
