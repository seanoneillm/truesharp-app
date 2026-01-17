'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  RefreshCw,
  Plus,
  Trash2,
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface CreatorCode {
  id: string
  code: string
  is_active: boolean
  created_at: string
  creator_user_id: string
  creator_username: string
  creator_email: string
  signup_count: number
}

export function CreatorCodesManager() {
  const [codes, setCodes] = useState<CreatorCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [newCreatorUserId, setNewCreatorUserId] = useState('')
  const [newCode, setNewCode] = useState('')

  const fetchCodes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/creator-codes')
      const data = await response.json()

      if (data.success) {
        setCodes(data.data)
      } else {
        setError(data.error || 'Failed to fetch creator codes')
      }
    } catch (err) {
      setError('Network error fetching creator codes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleCreateCode = async () => {
    if (!newCreatorUserId.trim() || !newCode.trim()) {
      setError('Please fill in both fields')
      return
    }

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/creator-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_user_id: newCreatorUserId.trim(),
          code: newCode.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Created code: ${data.data.code}`)
        setNewCreatorUserId('')
        setNewCode('')
        fetchCodes()
      } else {
        setError(data.error || 'Failed to create code')
      }
    } catch (err) {
      setError('Network error creating code')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (codeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/creator-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      const data = await response.json()

      if (data.success) {
        fetchCodes()
      } else {
        setError(data.error || 'Failed to update code')
      }
    } catch (err) {
      setError('Network error updating code')
    }
  }

  const handleDeleteCode = async (codeId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete the code "${code}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/creator-codes/${codeId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Code deleted successfully')
        fetchCodes()
      } else {
        setError(data.error || 'Failed to delete code')
      }
    } catch (err) {
      setError('Network error deleting code')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Creator Codes
          </div>
          <Button
            onClick={fetchCodes}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {/* Create New Code Form */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <h4 className="mb-3 font-medium">Add New Creator Code</h4>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              value={newCreatorUserId}
              onChange={e => setNewCreatorUserId(e.target.value)}
              placeholder="Creator User ID (UUID)"
              className="flex-1 bg-white"
            />
            <Input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="Code (e.g., SHARP20)"
              className="w-full sm:w-40 bg-white"
              maxLength={20}
            />
            <Button
              onClick={handleCreateCode}
              disabled={isCreating || !newCreatorUserId.trim() || !newCode.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? 'Creating...' : 'Add Code'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Codes are 3-20 characters. Alphanumeric, underscores, and hyphens allowed.
          </p>
        </div>

        {/* Codes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Creator</th>
                <th className="pb-2 font-medium text-center">Signups</th>
                <th className="pb-2 font-medium">Created</th>
                <th className="pb-2 font-medium text-center">Status</th>
                <th className="pb-2 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No creator codes yet
                  </td>
                </tr>
              ) : (
                codes.map(code => (
                  <tr key={code.id} className="border-b">
                    <td className="py-3">
                      <span className="rounded bg-indigo-100 px-2 py-1 font-mono text-indigo-800">
                        {code.code}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{code.creator_username}</div>
                        <div className="text-xs text-gray-500">{code.creator_email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">
                        {code.signup_count}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {formatDate(code.created_at)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(code.id, code.is_active)}
                        className="inline-flex items-center"
                      >
                        {code.is_active ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <Button
                        onClick={() => handleDeleteCode(code.id, code.code)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {codes.length > 0 && (
          <div className="text-sm text-gray-500">
            Total signups via creator codes: {codes.reduce((sum, c) => sum + c.signup_count, 0)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
