#!/usr/bin/env node

/**
 * Script to validate the pro status synchronization fix
 * This script checks for inconsistencies and provides detailed reporting
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validateProStatusSync() {
  console.log('🔍 Starting Pro Status Validation...\n')

  try {
    // 1. Check for users with active subscriptions but pro = 'no'
    console.log('1️⃣  Checking for users with active subscriptions but pro = "no"...')
    
    const { data: inconsistentUsers, error: inconsistentError } = await supabase
      .from('profiles')
      .select(`
        id, username, email, pro, updated_at,
        pro_subscriptions(
          id, status, current_period_end, stripe_subscription_id, 
          apple_original_transaction_id, plan, created_at
        )
      `)
      .eq('pro', 'no')

    if (inconsistentError) {
      console.error('❌ Error fetching profiles:', inconsistentError)
      return
    }

    const activeButWrongStatus = inconsistentUsers.filter(user => {
      return user.pro_subscriptions.some(sub => 
        sub.status === 'active' && new Date(sub.current_period_end) > new Date()
      )
    })

    console.log(`   Found ${activeButWrongStatus.length} users with active subscriptions but pro = "no"`)
    
    if (activeButWrongStatus.length > 0) {
      console.log('\n   Details:')
      activeButWrongStatus.forEach(user => {
        const activeSubs = user.pro_subscriptions.filter(sub => 
          sub.status === 'active' && new Date(sub.current_period_end) > new Date()
        )
        console.log(`   - ${user.username || user.email}: ${activeSubs.length} active subscription(s)`)
        activeSubs.forEach(sub => {
          const type = sub.stripe_subscription_id ? 'Stripe' : 'Apple'
          console.log(`     • ${type} ${sub.plan} (expires: ${sub.current_period_end})`)
        })
      })
    }

    // 2. Check for users with pro = 'yes' but no active subscriptions
    console.log('\n2️⃣  Checking for users with pro = "yes" but no active subscriptions...')
    
    const { data: proUsers, error: proError } = await supabase
      .from('profiles')
      .select(`
        id, username, email, pro, updated_at,
        pro_subscriptions(
          id, status, current_period_end, stripe_subscription_id, 
          apple_original_transaction_id, plan
        )
      `)
      .eq('pro', 'yes')

    if (proError) {
      console.error('❌ Error fetching pro users:', proError)
      return
    }

    const proButNoActiveSubsc = proUsers.filter(user => {
      const hasActiveSubscriptions = user.pro_subscriptions.some(sub => 
        sub.status === 'active' && new Date(sub.current_period_end) > new Date()
      )
      const hasAnySubscriptions = user.pro_subscriptions.length > 0
      
      // Only flag users who have expired subscriptions, not manual assignments (no subscriptions)
      return !hasActiveSubscriptions && hasAnySubscriptions
    })
    
    const manualProUsers = proUsers.filter(user => {
      const hasAnySubscriptions = user.pro_subscriptions.length > 0
      return !hasAnySubscriptions // Pro users with no subscriptions at all = manual assignment
    })

    console.log(`   Found ${proButNoActiveSubsc.length} users with pro = "yes" but only expired subscriptions`)
    console.log(`   Found ${manualProUsers.length} users with pro = "yes" via manual assignment (no subscriptions)`)
    
    if (proButNoActiveSubsc.length > 0) {
      console.log('\n   Users with expired subscriptions:')
      proButNoActiveSubsc.forEach(user => {
        console.log(`   - ${user.username || user.email}: ${user.pro_subscriptions.length} expired subscription(s)`)
        user.pro_subscriptions.forEach(sub => {
          const type = sub.stripe_subscription_id ? 'Stripe' : 'Apple'
          const expired = new Date(sub.current_period_end) <= new Date()
          console.log(`     • ${type} ${sub.plan} - ${sub.status} ${expired ? '(EXPIRED)' : ''}`)
        })
      })
    }
    
    if (manualProUsers.length > 0) {
      console.log('\n   Manual pro assignments (preserved):')
      manualProUsers.forEach(user => {
        console.log(`   - ${user.username || user.email}: Manual assignment`)
      })
    }

    // 3. Summary statistics
    console.log('\n3️⃣  Overall Statistics:')
    
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('pro')
    
    if (!allError) {
      const totalUsers = allProfiles.length
      const proUsersCount = allProfiles.filter(p => p.pro === 'yes').length
      const freeUsersCount = allProfiles.filter(p => p.pro === 'no').length
      
      console.log(`   • Total users: ${totalUsers}`)
      console.log(`   • Pro users: ${proUsersCount}`)
      console.log(`   • Free users: ${freeUsersCount}`)
      console.log(`   • Manual pro assignments: ${manualProUsers.length}`)
      console.log(`   • Users with inconsistent status: ${activeButWrongStatus.length + proButNoActiveSubsc.length}`)
    }

    // 4. Test the sync function on inconsistent users
    if (activeButWrongStatus.length > 0 || proButNoActiveSubsc.length > 0) {
      console.log('\n4️⃣  Testing sync function on inconsistent users...')
      
      const inconsistentUserIds = [
        ...activeButWrongStatus.map(u => u.id),
        ...proButNoActiveSubsc.map(u => u.id)
      ]

      console.log(`   Testing sync on ${inconsistentUserIds.length} users...`)
      
      for (const userId of inconsistentUserIds.slice(0, 3)) { // Test first 3 users
        console.log(`\n   Testing user: ${userId}`)
        
        const { data: syncResult, error: syncError } = await supabase
          .rpc('sync_user_pro_status', { p_user_id: userId })
        
        if (syncError) {
          console.log(`   ❌ Error: ${syncError.message}`)
        } else {
          console.log(`   ✅ Result: ${JSON.stringify(syncResult, null, 2)}`)
        }
      }
    }

    console.log('\n✅ Validation complete!')

    // 5. Return summary for potential automated fixing
    return {
      activeButWrongStatus: activeButWrongStatus.length,
      proButNoActiveSubsc: proButNoActiveSubsc.length,
      manualProUsers: manualProUsers ? manualProUsers.length : 0,
      totalInconsistent: activeButWrongStatus.length + proButNoActiveSubsc.length,
      needsFixing: (activeButWrongStatus.length + proButNoActiveSubsc.length) > 0
    }

  } catch (error) {
    console.error('❌ Validation failed:', error)
    return null
  }
}

async function fixAllInconsistencies() {
  console.log('\n🔧 Running automated fix for all inconsistencies...')
  
  try {
    const { data: fixResult, error: fixError } = await supabase
      .rpc('fix_all_pro_status_inconsistencies')
    
    if (fixError) {
      console.error('❌ Fix failed:', fixError)
      return false
    }
    
    console.log('✅ Fix completed:')
    console.log(JSON.stringify(fixResult, null, 2))
    
    return true
  } catch (error) {
    console.error('❌ Fix error:', error)
    return false
  }
}

// Main execution
async function main() {
  const validation = await validateProStatusSync()
  
  if (validation && validation.needsFixing) {
    console.log('\n🤔 Found inconsistencies. Would you like to run the automated fix?')
    console.log('This will update pro status for all affected users.')
    
    // In a real scenario, you'd prompt for user input
    // For now, let's run the fix automatically
    const fixed = await fixAllInconsistencies()
    
    if (fixed) {
      console.log('\n🔄 Re-running validation to confirm fix...')
      await validateProStatusSync()
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { validateProStatusSync, fixAllInconsistencies }