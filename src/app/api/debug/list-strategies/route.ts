import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('id, name, user_id, pricing_monthly')
      .limit(5)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      count: strategies?.length || 0,
      strategies: strategies || []
    })

  } catch (error) {
    console.error('❌ Error listing strategies:', error)
    return NextResponse.json({
      error: 'Failed to list strategies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}