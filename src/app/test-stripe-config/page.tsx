'use client'

import { STRIPE_CONFIG } from '@/lib/stripe'
// import { PRO_FEATURES } from '@/lib/constants'
import { getProPlan, getAllProPlans, calculateYearlySavings } from '@/lib/stripe-pro-utils'

export default function TestStripeConfigPage() {
  const monthlyPlan = getProPlan('monthly')
  const yearlyPlan = getProPlan('yearly')
  const allPlans = getAllProPlans()
  const savings = calculateYearlySavings()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Stripe Configuration Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">TrueSharp Pro Product ID</h2>
          <p className="font-mono text-sm bg-white p-2 rounded border">
            {STRIPE_CONFIG.truesharpPro.productId}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Price Configuration</h2>
          <div className="space-y-2">
            <div>
              <strong>Monthly Price ID:</strong> 
              <span className="font-mono text-sm ml-2">
                {STRIPE_CONFIG.truesharpPro.monthlyPriceId || 'Not configured'}
              </span>
            </div>
            <div>
              <strong>Yearly Price ID:</strong> 
              <span className="font-mono text-sm ml-2">
                {STRIPE_CONFIG.truesharpPro.yearlyPriceId || 'Not configured'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Pro Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <h3 className="font-medium">{monthlyPlan.name}</h3>
              <p>Price: ${monthlyPlan.price}/month</p>
              <p className="text-sm text-gray-600">Price ID: {monthlyPlan.priceId || 'Not configured'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <h3 className="font-medium">{yearlyPlan.name}</h3>
              <p>Price: ${yearlyPlan.price}/year</p>
              <p className="text-sm text-gray-600">Price ID: {yearlyPlan.priceId || 'Not configured'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Yearly Savings Calculation</h2>
          <div className="bg-white p-3 rounded border">
            <p>Monthly plan × 12: ${savings.monthlyTotal}</p>
            <p>Yearly plan price: ${savings.yearlyPrice}</p>
            <p className="font-semibold text-green-600">
              Savings: ${savings.savings} ({savings.savingsPercentage}% off)
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">All Plans Summary</h2>
          <div className="space-y-2">
            {allPlans.map(plan => (
              <div key={plan.id} className="bg-white p-2 rounded border text-sm">
                {plan.name} - ${plan.price}/{plan.interval} - Product: {plan.productId}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-yellow-800">Configuration Status</h2>
          <div className="space-y-1 text-sm">
            <p>✅ Product ID configured: {STRIPE_CONFIG.truesharpPro.productId}</p>
            <p className={STRIPE_CONFIG.truesharpPro.monthlyPriceId ? "text-green-600" : "text-red-600"}>
              {STRIPE_CONFIG.truesharpPro.monthlyPriceId ? "✅" : "❌"} Monthly Price ID configured
            </p>
            <p className={STRIPE_CONFIG.truesharpPro.yearlyPriceId ? "text-green-600" : "text-red-600"}>
              {STRIPE_CONFIG.truesharpPro.yearlyPriceId ? "✅" : "❌"} Yearly Price ID configured
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}