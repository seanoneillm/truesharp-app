'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Store } from 'lucide-react'

export default function SellPageSimple() {
  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Seller Dashboard
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Manage your strategies, picks, and revenue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
            <p className="text-2xl font-bold text-green-600">$0</p>
            <p className="text-sm text-gray-500">Monthly earnings</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscribers</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500">Active subscribers</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategies</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Monetized strategies</p>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="p-8 text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Seller Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Start monetizing your betting strategies and build your subscriber base.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Strategy
            </Button>
            <Button variant="outline">
              Learn More
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
