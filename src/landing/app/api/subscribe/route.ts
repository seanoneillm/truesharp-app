import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()

    const response = await axios.post(
      'https://api.brevo.com/v3/contacts',
      {
        email: email,
        attributes: {
          FNAME: firstName,
        },
        listIds: [1], // Replace with your Brevo list ID
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Brevo API error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}