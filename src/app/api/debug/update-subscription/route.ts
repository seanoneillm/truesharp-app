import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, updates } = await request.json()

    if (!subscription_id) {
      return NextResponse.json(
        {
          error: 'subscription_id required',
        },
        { status: 400 }
      )
    }

    console.log('🔄 Updating subscription:', subscription_id)
    console.log('📝 Updates:', updates)

    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single()

    if (fetchError || !currentSub) {
      return NextResponse.json(
        {
          error: 'Subscription not found',
          subscription_id,
        },
        { status: 404 }
      )
    }

    console.log('📋 Current subscription:', currentSub)

    // Prepare update data
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // If frequency is being changed, update the price based on strategy pricing
    if (updates.frequency && updates.frequency !== currentSub.frequency) {
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .select('pricing_weekly, pricing_monthly, pricing_yearly')
        .eq('id', currentSub.strategy_id)
        .single()

      if (strategyError || !strategy) {
        return NextResponse.json(
          {
            error: 'Strategy not found for price calculation',
            strategy_id: currentSub.strategy_id,
          },
          { status: 400 }
        )
      }

      // Update price based on new frequency
      switch (updates.frequency) {
        case 'weekly':
          updateData.price = strategy.pricing_weekly || 0
          break
        case 'monthly':
          updateData.price = strategy.pricing_monthly || 0
          break
        case 'yearly':
          updateData.price = strategy.pricing_yearly || 0
          break
      }

      console.log(`💰 Updated price for ${updates.frequency}: $${updateData.price}`)
    }

    // Update the subscription
    const { data: updatedSub, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update subscription',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    console.log('✅ Subscription updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      before: currentSub,
      after: updatedSub,
      changes: updateData,
    })
  } catch (error) {
    console.error('Update subscription API error:', error)
    return NextResponse.json(
      {
        error: 'Update failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
