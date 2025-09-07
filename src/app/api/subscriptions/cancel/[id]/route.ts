import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const subscriptionId = resolvedParams.id

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    // Create service role client for database operations to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get subscription and verify ownership
    const { data: subscription, error: fetchError } = await serviceSupabase
      .from('subscriptions')
      .select(`
        id, 
        stripe_subscription_id, 
        subscriber_id, 
        strategy_id,
        status,
        strategies!inner(name, user_id)
      `)
      .eq('id', subscriptionId)
      .eq('subscriber_id', user.id)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found or access denied' }, { status: 404 })
    }

    if (subscription.status === 'canceled' || subscription.status === 'inactive') {
      return NextResponse.json({ error: 'Subscription is already canceled' }, { status: 400 })
    }

    // Cancel subscription in Stripe
    if (subscription.stripe_subscription_id) {
      try {
        const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        console.log(`✅ Canceled Stripe subscription: ${subscription.stripe_subscription_id}`)
        console.log('Canceled subscription details:', {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          canceled_at: canceledSubscription.canceled_at,
        })
      } catch (stripeError) {
        console.error(`❌ Failed to cancel Stripe subscription ${subscription.stripe_subscription_id}:`, stripeError)
        return NextResponse.json({ 
          error: 'Failed to cancel subscription in Stripe',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
        }, { status: 500 })
      }
    }

    // Update subscription status in database
    const { error: updateError } = await serviceSupabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',  // Note: using 'cancelled' with double 'l' to match database constraint
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription status:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 })
    }

    console.log(`✅ Updated subscription ${subscriptionId} status to canceled`)

    return NextResponse.json({ 
      success: true,
      message: `Subscription to "${(subscription.strategies as any).name}" canceled successfully`,
      subscription: {
        id: subscription.id,
        strategy_name: (subscription.strategies as any).name,
        status: 'cancelled'
      }
    })

  } catch (error) {
    console.error('Error in DELETE subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}