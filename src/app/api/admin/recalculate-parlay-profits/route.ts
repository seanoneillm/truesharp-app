import { NextRequest, NextResponse } from 'next/server'
import { recalculateAllParlayProfits, recalculateUserParlayProfits, validateParlayProfits } from '@/lib/utils/recalculate-parlay-profits'

// POST /api/admin/recalculate-parlay-profits - Recalculate parlay profits for all bets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body

    // Basic auth check (you might want to add proper admin authentication)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes(process.env.ADMIN_API_KEY || 'admin-key')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    switch (action) {
      case 'recalculate_all':
        console.log('🔄 Admin API - Recalculating all parlay profits')
        const allResult = await recalculateAllParlayProfits(supabaseUrl, supabaseKey)
        
        return NextResponse.json({
          success: allResult.success,
          message: `Recalculation completed. ${allResult.updated} bets updated.`,
          details: allResult,
        })

      case 'recalculate_user':
        if (!userId) {
          return NextResponse.json({ error: 'userId required for user recalculation' }, { status: 400 })
        }
        
        console.log(`🔄 Admin API - Recalculating parlay profits for user: ${userId}`)
        const userResult = await recalculateUserParlayProfits(supabaseUrl, supabaseKey, userId)
        
        return NextResponse.json({
          success: userResult.success,
          message: `User recalculation completed. ${userResult.updated} bets updated.`,
          details: userResult,
        })

      case 'validate':
        console.log('🔍 Admin API - Validating parlay profit calculations')
        const validateResult = await validateParlayProfits(supabaseUrl, supabaseKey)
        
        return NextResponse.json({
          success: validateResult.success,
          message: validateResult.success 
            ? 'All sample parlays have correct profit calculations!'
            : `Found ${validateResult.issues.length} issues`,
          details: validateResult,
        })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: recalculate_all, recalculate_user, or validate' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Admin API - Parlay profit recalculation error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

// GET /api/admin/recalculate-parlay-profits - Get information about parlay profit issues
export async function GET() {
  try {
    // Basic usage information
    return NextResponse.json({
      message: 'Parlay Profit Recalculation API',
      usage: {
        description: 'This API helps fix parlay profit calculations in the database',
        endpoints: {
          'POST with action: "recalculate_all"': 'Recalculate profits for all bets',
          'POST with action: "recalculate_user"': 'Recalculate profits for specific user (requires userId)',
          'POST with action: "validate"': 'Validate current profit calculations on sample data'
        },
        authentication: 'Requires Authorization header with admin API key',
        example: {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_ADMIN_API_KEY',
            'Content-Type': 'application/json'
          },
          body: {
            action: 'recalculate_all'
          }
        }
      },
      parlay_rules: {
        description: 'How parlay profits are calculated',
        rules: [
          '1. If ANY leg loses, entire parlay loses (profit = -stake)',
          '2. If ALL legs win, profit = (stake × combined_decimal_odds) - stake',
          '3. If any leg is voided but none lost, parlay pushes (profit = 0)',
          '4. If any leg is pending, profit = null',
          '5. Only first leg of parlay records profit, others get 0 (prevents double counting)'
        ]
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get API information',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}