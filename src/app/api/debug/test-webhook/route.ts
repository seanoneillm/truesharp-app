import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🧪 Testing webhook with mock data...')

    // Create a mock checkout.session.completed event
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_mock_session_123',
          customer: 'cus_mock_customer_123',
          subscription: 'sub_mock_subscription_123',
          payment_status: 'paid',
          status: 'complete',
          metadata: {
            strategy_id: '95a38163-d111-49d7-8489-f15be448c655', // Use an existing strategy ID
            subscriber_id: '28991397-dae7-42e8-a822-0dffc6ff49b7', // Use an existing user ID
            seller_id: '0e16e4f5-f206-4e62-8282-4188ff8af48a', // Use an existing seller ID
            frequency: 'monthly',
            seller_connect_account_id: 'acct_1S48mwJvV9fUMgsu'
          }
        }
      }
    }

    console.log('📦 Mock event:', JSON.stringify(mockEvent, null, 2))

    // Send to the actual webhook handler
    const webhookResponse = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature_for_testing'
      },
      body: JSON.stringify(mockEvent)
    })

    const responseText = await webhookResponse.text()
    console.log('🔄 Webhook response status:', webhookResponse.status)
    console.log('🔄 Webhook response:', responseText)

    return NextResponse.json({
      success: true,
      test_event: mockEvent,
      webhook_response: {
        status: webhookResponse.status,
        body: responseText
      }
    })

  } catch (error) {
    console.error('❌ Test webhook error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint ready. Send POST request to test.',
    instructions: [
      'POST to this endpoint to send a mock webhook event',
      'This will test your webhook handler without going through Stripe',
      'Mock event includes sample strategy subscription data'
    ]
  })
}