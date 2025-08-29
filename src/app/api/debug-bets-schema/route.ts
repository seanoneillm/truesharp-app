import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Get the bets table schema by attempting to select with empty where clause
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .limit(0)

    if (error) {
      // Try to get schema info from error message
      console.log('Schema error:', error)
    }

    // Also try to get a sample row to see the actual structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('bets')
      .select('*')
      .limit(1)

    console.log('Sample bets data:', sampleData)
    console.log('Sample error:', sampleError)

    return NextResponse.json({
      success: true,
      schema: data,
      sampleData: sampleData,
      error: error?.message,
      sampleError: sampleError?.message
    })

  } catch (error) {
    console.error('Debug schema error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}