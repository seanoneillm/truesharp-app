'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Bell, 
  Send,
  Users,
  AlertCircle
} from 'lucide-react'

interface NotificationSenderProps {
  className?: string
}

export function NotificationSender({ className }: NotificationSenderProps) {
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState('truesharp_announcement')

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setSendResult('❌ Error: Title and message are required')
      return
    }

    setIsSending(true)
    setSendResult(null)
    
    try {
      console.log('📢 Sending notification to all users...')
      
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          recipient_type: 'all_users'
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSendResult(`✅ Successfully sent notification to ${data.userCount || 'all'} users. ${data.message || ''}`)
        setTitle('')
        setMessage('')
      } else {
        setSendResult(`❌ Error: ${data.error || 'Failed to send notification'}`)
      }
    } catch (error) {
      console.error('❌ Notification send error:', error)
      setSendResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  const ResultDisplay = ({ result }: { result: string | null }) => {
    if (!result) return null
    
    const isSuccess = result.startsWith('✅')
    return (
      <div
        className={`mt-4 rounded-lg border p-3 ${
          isSuccess
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}
      >
        <p className="font-mono text-sm">{result}</p>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Send notifications to all TrueSharp users. Notifications will be delivered as push notifications and shown in the app.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Notification Type</label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="truesharp_announcement">TrueSharp Announcement</SelectItem>
                <SelectItem value="new_subscriber">New Subscriber</SelectItem>
                <SelectItem value="collaboration_request">Collaboration Request</SelectItem>
                <SelectItem value="wagerwave_review">WagerWave Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter notification title..."
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter your notification message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Important</p>
                <p className="text-xs text-yellow-700">
                  This will send a push notification to all users with the app installed and notifications enabled.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {(title.trim() || message.trim()) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{title || 'Notification Title'}</p>
                    <p className="text-gray-600 text-sm mt-1">{message || 'Notification message'}</p>
                    <p className="text-xs text-gray-400 mt-2">From: TrueSharp</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSendNotification}
              disabled={isSending || !title.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className={`mr-2 h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
              <Users className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send to All Users'}
            </Button>
          </div>

          <ResultDisplay result={sendResult} />
        </div>
      </CardContent>
    </Card>
  )
}