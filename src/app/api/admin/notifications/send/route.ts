import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a', 
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function POST(request: NextRequest) {
  try {
    console.log('📢 Admin Send Notification API: Processing notification send request')
    
    const body = await request.json()
    const { title, message, notification_type = 'truesharp_announcement', recipient_type = 'all_users' } = body
    
    // Validate input
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      )
    }
    
    if (title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title must be 100 characters or less' },
        { status: 400 }
      )
    }
    
    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Message must be 500 characters or less' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceRoleClient()
    
    // Get all users who should receive notifications (for now, all active users)
    console.log('👥 Fetching users to send notifications to...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, expo_push_token, notifications_enabled, push_token_environment')
      .eq('notifications_enabled', true)
      .not('expo_push_token', 'is', null)
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found with notifications enabled and push tokens' },
        { status: 400 }
      )
    }
    
    console.log(`📋 Found ${users.length} users to notify`)
    
    // Create notification records for each user
    const notificationRecords = users.map(user => ({
      user_id: user.id,
      notification_type,
      sender_type: 'truesharp',
      sender_id: null, // TrueSharp notifications don't have a specific sender user
      title: title.trim(),
      message: message.trim(),
      metadata: {},
      delivery_status: 'pending',
      sent_at: null // Will be updated after sending push notification
    }))
    
    // Insert notification records
    console.log('💾 Creating notification records in database...')
    const { data: createdNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationRecords)
      .select('id, user_id')
    
    if (insertError) {
      console.error('❌ Error creating notification records:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create notification records' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Created ${createdNotifications?.length || 0} notification records`)
    
    // Prepare push notification messages
    const pushMessages = users
      .filter(user => user.expo_push_token)
      .map(user => ({
        to: user.expo_push_token,
        title: title,
        body: message,
        data: {
          notificationType: notification_type,
          senderType: 'truesharp'
        },
        channelId: 'default', // For Android
        priority: 'high' as const
      }))
    
    // Send push notifications via Expo
    let sentCount = 0
    let failedCount = 0
    
    if (pushMessages.length > 0) {
      console.log(`📤 Sending ${pushMessages.length} push notifications via Expo...`)
      
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pushMessages)
        })
        
        const pushResults = await response.json()
        
        if (response.ok && pushResults.data) {
          // Process results and update notification records
          const updatePromises = pushResults.data.map(async (result: any, index: number) => {
            const notificationId = createdNotifications?.[index]?.id
            if (!notificationId) return
            
            if (result.status === 'ok') {
              sentCount++
              // Update notification as sent
              await supabase
                .from('notifications')
                .update({
                  delivery_status: 'sent',
                  sent_at: new Date().toISOString(),
                  expo_ticket_id: result.id
                })
                .eq('id', notificationId)
            } else {
              failedCount++
              // Update notification as failed
              await supabase
                .from('notifications')
                .update({
                  delivery_status: 'failed',
                  metadata: { error: result.details?.error || 'Unknown error' }
                })
                .eq('id', notificationId)
            }
          })
          
          await Promise.all(updatePromises)
        }
      } catch (pushError) {
        console.error('❌ Error sending push notifications:', pushError)
        failedCount = pushMessages.length
        
        // Update all notifications as failed
        if (createdNotifications) {
          await supabase
            .from('notifications')
            .update({
              delivery_status: 'failed',
              metadata: { error: 'Push notification service error' }
            })
            .in('id', createdNotifications.map(n => n.id))
        }
      }
    }
    
    const successMessage = `Sent notifications to ${users.length} users. Push notifications: ${sentCount} sent, ${failedCount} failed.`
    console.log(`✅ ${successMessage}`)
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      userCount: users.length,
      pushNotifications: {
        sent: sentCount,
        failed: failedCount
      }
    })
    
  } catch (error) {
    console.error('❌ Unexpected error in send notification API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}