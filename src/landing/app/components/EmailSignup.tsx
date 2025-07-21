'use client'

import axios from 'axios'
import { useState } from 'react'

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      console.log('Submitting form:', { email, firstName })
      const response = await axios.post('/api/subscribe', {
        email,
        firstName,
      })

      console.log('Response:', response.data)
      if (response.data.success) {
        setMessage('Success! You\'re on the list for early access and launch updates.')
        setEmail('')
        setFirstName('')
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      console.error('Error response:', error.response?.data)
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white text-center mb-6">Sign Up for Early Access</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-blue-700 disabled:to-cyan-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              'Subscribe for Launch Updates'
            )}
          </button>
        </form>
        
        {message && (
          <div className={`mt-6 p-4 rounded-xl ${
            message.includes('Success') 
              ? 'bg-green-500/20 text-green-100 border border-green-400/20' 
              : 'bg-red-500/20 text-red-100 border border-red-400/20'
          }`}>
            <div className="flex items-center">
              {message.includes('Success') ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}
        
        <p className="text-blue-200 text-sm text-center mt-6">
          Be the first to know when TrueSharp launches. Get exclusive early access and launch updates.
        </p>
      </div>
    </div>
  )
}