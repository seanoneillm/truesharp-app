import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fix = searchParams.get('fix') === 'true'
  
  try {
    console.log('🔍 Starting subscription sync check...')
    
    // Get all active subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100
    })
    
    const issues: any[] = []
    const fixes: any[] = []
    
    for (const subscription of stripeSubscriptions.data) {
      const metadata = subscription.metadata || {}
      
      // Check if this is a strategy subscription
      if (metadata.strategy_id && metadata.subscriber_id && metadata.seller_id) {
        const { data: dbSubscription } = await supabase
          .from('subscriptions')
          .select('id, status')
          .eq('stripe_subscription_id', subscription.id)
          .single()
          
        if (!dbSubscription) {
          const issue = {
            type: 'missing_strategy_subscription',
            stripe_id: subscription.id,
            metadata,
            created: subscription.created
          }
          issues.push(issue)
          
          if (fix) {
            // Attempt to create the missing subscription
            try {
              const { data: strategy } = await supabase
                .from('strategies')
                .select('pricing_weekly, pricing_monthly, pricing_yearly')
                .eq('id', metadata.strategy_id)
                .single()
                
              if (strategy) {
                let price = 0
                switch (metadata.frequency) {
                  case 'weekly':
                    price = strategy.pricing_weekly || 0
                    break
                  case 'monthly':
                    price = strategy.pricing_monthly || 0
                    break
                  case 'yearly':
                    price = strategy.pricing_yearly || 0
                    break
                }
                
                const subscriptionData = {
                  subscriber_id: metadata.subscriber_id,
                  seller_id: metadata.seller_id,
                  strategy_id: metadata.strategy_id,
                  stripe_subscription_id: subscription.id,
                  status: 'active',
                  frequency: metadata.frequency || 'monthly',
                  price,
                  currency: 'USD',
                  current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                  current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                  next_billing_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
                  stripe_customer_id: subscription.customer as string,
                }
                
                const { data: newSub, error } = await supabase
                  .from('subscriptions')
                  .insert(subscriptionData)
                  .select()
                  .single()
                  
                if (!error) {
                  fixes.push({
                    type: 'created_strategy_subscription',
                    subscription_id: newSub.id,
                    stripe_id: subscription.id
                  })
                  
                  // Update subscriber count
                  await supabase.rpc('increment_subscriber_count', {
                    strategy_id_param: metadata.strategy_id,
                  })
                }
              }
            } catch (fixError) {
              console.error('Failed to fix subscription:', fixError)
            }
          }
        }
      }
      
      // Check if this is a Pro subscription
      if (metadata.subscription_type === 'pro' && metadata.user_id) {
        const { data: dbProSubscription } = await supabase
          .from('pro_subscriptions')
          .select('id, status')
          .eq('stripe_subscription_id', subscription.id)
          .single()
          
        if (!dbProSubscription) {
          const issue = {
            type: 'missing_pro_subscription',
            stripe_id: subscription.id,
            metadata,
            created: subscription.created
          }
          issues.push(issue)
          
          if (fix) {
            // Attempt to create the missing Pro subscription
            try {
              const proSubscriptionData = {
                user_id: metadata.user_id,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                status: 'active',
                plan: metadata.plan || 'monthly',
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                price_id: subscription.items?.data?.[0]?.price?.id || null,
              }
              
              const { data: newProSub, error } = await supabase
                .from('pro_subscriptions')
                .insert(proSubscriptionData)
                .select()
                .single()
                
              if (!error) {
                fixes.push({
                  type: 'created_pro_subscription',
                  subscription_id: newProSub.id,
                  stripe_id: subscription.id
                })
                
                // Update profile pro status
                await supabase
                  .from('profiles')
                  .update({ pro: 'yes' })
                  .eq('id', metadata.user_id)
              }
            } catch (fixError) {
              console.error('Failed to fix Pro subscription:', fixError)
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      issues_found: issues.length,
      fixes_applied: fix ? fixes.length : 0,
      issues,
      fixes: fix ? fixes : [],
      message: fix 
        ? `Sync completed. Found ${issues.length} issues, fixed ${fixes.length}.`
        : `Sync check completed. Found ${issues.length} issues. Add ?fix=true to attempt fixes.`
    })
    
  } catch (error) {
    console.error('Subscription sync error:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}