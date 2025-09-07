'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) {
      setSubmitResult('❌ Please enter your feedback')
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('feedback')
        .insert({
          feedback_text: feedback.trim(),
        })

      if (error) {
        console.error('Error submitting feedback:', error)
        setSubmitResult('❌ Error submitting feedback. Please try again.')
      } else {
        setFeedback('')
        setSubmitResult('✅ Thank you for your feedback!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setSubmitResult('❌ Unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Feedback</h1>
              <p className="text-sm text-blue-100">Help us improve TrueSharp</p>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="feedback" className="mb-2 block text-sm font-medium text-slate-700">
                Share your feedback, suggestions, or report issues
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think... What features would you like to see? What could we improve?"
                rows={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Your feedback helps us build a better platform for everyone
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2"
              >
                <Send className={`mr-2 h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>

            {submitResult && (
              <div
                className={`rounded-lg p-4 ${
                  submitResult.startsWith('✅')
                    ? 'border border-green-200 bg-green-50 text-green-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <p className="font-medium">{submitResult}</p>
              </div>
            )}
          </form>
        </Card>

        {/* Info Section */}
        <Card className="p-6">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">What kind of feedback are we looking for?</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Feature requests and suggestions for improvements</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Bug reports and technical issues</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>User experience feedback and interface suggestions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>General thoughts on how we can make TrueSharp better</span>
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}