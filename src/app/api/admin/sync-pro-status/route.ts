import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin endpoint to manually sync pro status for specific users or all users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, syncAll = false, dryRun = false } = body

    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔄 Admin Pro Status Sync Request:', { 
      userIds: userIds?.length || 'none', 
      syncAll, 
      dryRun 
    })

    if (syncAll) {
      // Sync all users with subscriptions
      console.log('🔄 Syncing pro status for all users with subscriptions...')
      
      if (dryRun) {
        // Just return what would be changed without making changes
        const { data: allUsers, error: fetchError } = await supabase
          .from('profiles')
          .select(`
            id, username, email, pro,
            pro_subscriptions(
              id, status, current_period_end, stripe_subscription_id, 
              apple_original_transaction_id, plan
            )
          `)

        if (fetchError) {
          return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        const inconsistentUsers = []
        
        for (const user of allUsers) {
          const hasActiveSubscription = user.pro_subscriptions.some(sub => 
            sub.status === 'active' && new Date(sub.current_period_end) > new Date()
          )
          const hasAnySubscription = user.pro_subscriptions.length > 0
          
          let shouldBePro = 'preserve'
          if (hasActiveSubscription) {
            shouldBePro = 'yes'
          } else if (hasAnySubscription) {
            shouldBePro = 'no'
          }
          // If no subscriptions at all, preserve current status (manual assignment)
          
          const needsUpdate = shouldBePro !== 'preserve' && user.pro !== shouldBePro
          
          if (needsUpdate) {
            inconsistentUsers.push({
              id: user.id,
              username: user.username,
              email: user.email,
              currentStatus: user.pro,
              shouldBeStatus: shouldBePro,
              activeSubscriptions: user.pro_subscriptions.filter(sub => 
                sub.status === 'active' && new Date(sub.current_period_end) > new Date()
              ).length,
              totalSubscriptions: user.pro_subscriptions.length,
              reason: hasActiveSubscription ? 'has_active_subs' : 'has_expired_subs_only'
            })
          }
        }

        return NextResponse.json({
          success: true,
          dryRun: true,
          usersToUpdate: inconsistentUsers.length,
          details: inconsistentUsers
        })
        
      } else {
        // Actually run the fix
        const { data: fixResult, error: fixError } = await supabase
          .rpc('fix_all_pro_status_inconsistencies')

        if (fixError) {
          console.error('❌ Fix all failed:', fixError)
          return NextResponse.json({ error: fixError.message }, { status: 500 })
        }

        console.log('✅ Fixed all inconsistencies:', fixResult)

        return NextResponse.json({
          success: true,
          result: fixResult
        })
      }
      
    } else if (userIds && Array.isArray(userIds)) {
      // Sync specific users
      console.log(`🔄 Syncing pro status for ${userIds.length} specific users...`)
      
      const results = []
      
      for (const userId of userIds) {
        try {
          if (dryRun) {
            // Check what would change without making changes
            const { data: shouldBeProResult, error: checkError } = await supabase
              .rpc('should_user_have_pro_status', { p_user_id: userId })

            if (checkError) {
              results.push({ userId, error: checkError.message })
              continue
            }

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('pro, username, email')
              .eq('id', userId)
              .single()

            if (profileError) {
              results.push({ userId, error: profileError.message })
              continue
            }

            const needsUpdate = shouldBeProResult !== 'preserve' && profile.pro !== shouldBeProResult

            results.push({
              userId,
              username: profile.username,
              email: profile.email,
              currentStatus: profile.pro,
              expectedStatus: shouldBeProResult,
              needsUpdate,
              preservedManualAssignment: shouldBeProResult === 'preserve',
              dryRun: true
            })
            
          } else {
            // Actually sync the user
            const { data: syncResult, error: syncError } = await supabase
              .rpc('sync_user_pro_status', { p_user_id: userId })

            if (syncError) {
              results.push({ userId, error: syncError.message })
            } else {
              results.push({ userId, result: syncResult })
            }
          }
        } catch (error) {
          results.push({ 
            userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      return NextResponse.json({
        success: true,
        dryRun,
        usersSynced: userIds.length,
        results
      })
      
    } else {
      return NextResponse.json(
        { error: 'Either provide userIds array or set syncAll to true' }, 
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Admin sync error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// GET endpoint to check for inconsistencies without fixing
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Checking for pro status inconsistencies...')

    // Get all profiles with their subscription data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, username, email, pro, updated_at,
        pro_subscriptions(
          id, status, current_period_end, stripe_subscription_id, 
          apple_original_transaction_id, plan, created_at
        )
      `)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const inconsistencies = {
      activeSubsButNoProStatus: [],
      proStatusButNoActiveSubs: [],
      summary: {
        totalUsers: profiles.length,
        proUsers: 0,
        freeUsers: 0,
        usersWithSubscriptions: 0,
        activeSubscriptions: 0
      }
    }

    for (const profile of profiles) {
      // Count summary stats
      if (profile.pro === 'yes') inconsistencies.summary.proUsers++
      if (profile.pro === 'no') inconsistencies.summary.freeUsers++
      if (profile.pro_subscriptions.length > 0) inconsistencies.summary.usersWithSubscriptions++

      // Check for active subscriptions
      const activeSubscriptions = profile.pro_subscriptions.filter(sub => 
        sub.status === 'active' && new Date(sub.current_period_end) > new Date()
      )
      
      inconsistencies.summary.activeSubscriptions += activeSubscriptions.length

      // Check for inconsistencies
      const hasActiveSubscriptions = activeSubscriptions.length > 0

      if (hasActiveSubscriptions && profile.pro === 'no') {
        inconsistencies.activeSubsButNoProStatus.push({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          activeSubscriptions: activeSubscriptions.map(sub => ({
            id: sub.id,
            type: sub.stripe_subscription_id ? 'Stripe' : 'Apple',
            plan: sub.plan,
            expiresAt: sub.current_period_end
          }))
        })
      }

      if (!hasActiveSubscriptions && profile.pro === 'yes') {
        // Only flag as inconsistent if they have expired subscriptions
        // If they have no subscriptions at all, it's a manual assignment (preserve it)
        if (profile.pro_subscriptions.length > 0) {
          inconsistencies.proStatusButNoActiveSubs.push({
            id: profile.id,
            username: profile.username,
            email: profile.email,
            isManualAssignment: false, // Has subscriptions but they're expired
            expiredSubscriptions: profile.pro_subscriptions.map(sub => ({
              id: sub.id,
              type: sub.stripe_subscription_id ? 'Stripe' : 'Apple',
              status: sub.status,
              plan: sub.plan,
              expiredAt: sub.current_period_end
            }))
          })
        }
        // Users with pro='yes' and NO subscriptions at all are manual assignments - don't flag as inconsistent
      }
    }

    return NextResponse.json({
      success: true,
      inconsistencies,
      hasInconsistencies: (
        inconsistencies.activeSubsButNoProStatus.length > 0 ||
        inconsistencies.proStatusButNoActiveSubs.length > 0
      )
    })

  } catch (error) {
    console.error('❌ Admin check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}