import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { feedback_text } = await request.json()

    if (!feedback_text || typeof feedback_text !== 'string' || feedback_text.trim() === '') {
      return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        feedback_text: feedback_text.trim(),
      })
      .select()

    if (error) {
      console.error('Error inserting feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error in feedback API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error in feedback API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}