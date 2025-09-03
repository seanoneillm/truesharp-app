import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()

    // Check if API key is configured
    console.log('All env keys:', Object.keys(process.env).sort())
    console.log(
      'BREVO env variables:',
      Object.keys(process.env).filter(key => key.includes('BREVO'))
    )
    console.log('BREVO_API_KEY exists:', !!process.env.BREVO_API_KEY)
    console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY?.length)
    console.log(
      'BREVO_API_KEY starts with xkeysib:',
      process.env.BREVO_API_KEY?.startsWith('xkeysib-')
    )

    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    console.log('Attempting to subscribe:', { email, firstName })
    console.log('Using API key:', process.env.BREVO_API_KEY ? 'Present' : 'Missing')

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FNAME: firstName,
        },
        listIds: [3], // Your actual Brevo list ID
      }),
    })

    console.log('Brevo response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Brevo API error:', { status: response.status, data: errorData })

      // Handle specific Brevo errors
      if (response.status === 400) {
        return NextResponse.json(
          { error: errorData?.message || 'Invalid request to Brevo' },
          { status: 400 }
        )
      } else if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid Brevo API key' }, { status: 401 })
      } else if (response.status === 404) {
        return NextResponse.json({ error: 'Brevo list not found - check list ID' }, { status: 404 })
      }

      return NextResponse.json(
        { error: 'Failed to subscribe - check server logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Subscription error:', error.message)
    return NextResponse.json({ error: 'Failed to subscribe - check server logs' }, { status: 500 })
  }
}
