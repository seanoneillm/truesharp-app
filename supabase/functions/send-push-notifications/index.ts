import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface PushNotificationRequest {
  type: 'strategy_bets'
  strategyId: string
  sellerName: string
  strategyName: string
  betCount: number
  message?: string
}

interface ExpoMessage {
  to: string
  title: string
  body: string
  data: Record<string, any>
  sound: string
  priority: 'high' | 'normal'
}

interface ExpoResponse {
  data: Array<{
    id?: string
    status: 'ok' | 'error'
    message?: string
    details?: any
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendExpoPushNotifications(messages: ExpoMessage[]): Promise<ExpoResponse> {
  if (messages.length === 0) {
    return { data: [] }
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      throw new Error(`Expo API responded with ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending push notifications:', error)
    throw error
  }
}

async function getSubscribersWithPushTokens(supabase: any, strategyId: string) {
  const { data: subscribers, error } = await supabase
    .from('subscriptions')
    .select(`
      subscriber_id,
      profiles!subscriptions_subscriber_id_fkey(
        id,
        username,
        expo_push_token,
        notifications_enabled,
        push_token_environment
      )
    `)
    .eq('strategy_id', strategyId)
    .eq('status', 'active')
    .eq('profiles.notifications_enabled', true)
    .not('profiles.expo_push_token', 'is', null)

  if (error) {
    console.error('Error fetching subscribers:', error)
    throw error
  }

  return subscribers || []
}

async function createNotificationRecords(
  supabase: any, 
  notifications: Array<{
    user_id: string
    type: string
    title: string
    message: string
    metadata: Record<string, any>
  }>
) {
  if (notifications.length === 0) return []

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select('id, user_id')

  if (error) {
    console.error('Error creating notification records:', error)
    throw error
  }

  return data || []
}

async function updateNotificationStatus(
  supabase: any,
  notificationId: string,
  status: string,
  ticketId?: string
) {
  const updateData: any = {
    delivery_status: status,
    sent_at: new Date().toISOString()
  }

  if (ticketId) {
    updateData.expo_ticket_id = ticketId
  }

  const { error } = await supabase
    .from('notifications')
    .update(updateData)
    .eq('id', notificationId)

  if (error) {
    console.error('Error updating notification status:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, strategyId, sellerName, strategyName, betCount, message }: PushNotificationRequest = await req.json()

    if (!strategyId || !sellerName || !strategyName || !betCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: strategyId, sellerName, strategyName, betCount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`📱 Sending push notifications for strategy: ${strategyName} (${strategyId})`)

    // Get subscribers with push tokens
    const subscribers = await getSubscribersWithPushTokens(supabase, strategyId)
    
    if (subscribers.length === 0) {
      console.log('No subscribers with push tokens found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscribers with push tokens found',
          subscribersNotified: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${subscribers.length} subscribers with push tokens`)

    // Create notification records first
    const notificationRecords = subscribers.map(sub => ({
      user_id: sub.subscriber_id,
      type: 'strategy_bets',
      title: 'New Strategy Bets',
      message: message || `${sellerName} posted ${betCount} bet${betCount > 1 ? 's' : ''} to ${strategyName} — View Now`,
      metadata: {
        strategy_id: strategyId,
        strategy_name: strategyName,
        seller_name: sellerName,
        bet_count: betCount,
        deep_link: `truesharp://subscriptions?strategy=${strategyId}`
      }
    }))

    const createdNotifications = await createNotificationRecords(supabase, notificationRecords)
    console.log(`Created ${createdNotifications.length} notification records`)

    // Prepare Expo push messages
    const expoMessages: ExpoMessage[] = subscribers.map((sub, index) => ({
      to: sub.profiles.expo_push_token,
      title: 'New Strategy Bets',
      body: message || `${sellerName} posted ${betCount} bet${betCount > 1 ? 's' : ''} to ${strategyName} — View Now`,
      data: {
        type: 'strategy_bets',
        strategyId: strategyId,
        strategyName: strategyName,
        sellerName: sellerName,
        betCount: betCount,
        deepLink: `truesharp://subscriptions?strategy=${strategyId}`,
        notificationId: createdNotifications[index]?.id
      },
      sound: 'default',
      priority: 'high'
    }))

    // Send push notifications
    console.log(`Sending ${expoMessages.length} push notifications...`)
    const pushResponse = await sendExpoPushNotifications(expoMessages)

    // Update notification status based on Expo response
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < pushResponse.data.length; i++) {
      const result = pushResponse.data[i]
      const notificationRecord = createdNotifications[i]

      if (result.status === 'ok') {
        successCount++
        if (notificationRecord?.id) {
          await updateNotificationStatus(supabase, notificationRecord.id, 'sent', result.id)
        }
      } else {
        errorCount++
        if (notificationRecord?.id) {
          await updateNotificationStatus(supabase, notificationRecord.id, 'failed')
        }
        console.error(`Push notification failed for user ${subscribers[i]?.subscriber_id}:`, result.message)
      }
    }

    console.log(`✅ Push notification results: ${successCount} sent, ${errorCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        subscribersNotified: successCount,
        totalSubscribers: subscribers.length,
        failedNotifications: errorCount,
        message: `Successfully sent notifications to ${successCount} out of ${subscribers.length} subscribers`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send push notifications',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})