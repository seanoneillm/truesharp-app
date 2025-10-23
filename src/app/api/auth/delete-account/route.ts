import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user's authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { user_id } = await request.json();

    // Verify the user is trying to delete their own account
    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized: Cannot delete another user\'s account' }, { status: 403 });
    }

    console.log(`Starting account deletion for user: ${user_id}`);

    // 1. Delete user data in a specific order to respect foreign key constraints
    
    // Delete user settings
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', user_id);
    
    if (settingsError) {
      console.error('Error deleting user settings:', settingsError);
    }

    // Delete subscriptions (both as subscriber and seller)
    const { error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .or(`subscriber_id.eq.${user_id},seller_id.eq.${user_id}`);
    
    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    }

    // Delete pro subscriptions
    const { error: proSubscriptionsError } = await supabaseAdmin
      .from('pro_subscriptions')
      .delete()
      .eq('user_id', user_id);
    
    if (proSubscriptionsError) {
      console.error('Error deleting pro subscriptions:', proSubscriptionsError);
    }

    // Delete strategies (this will cascade delete strategy-related data)
    const { error: strategiesError } = await supabaseAdmin
      .from('strategies')
      .delete()
      .eq('user_id', user_id);
    
    if (strategiesError) {
      console.error('Error deleting strategies:', strategiesError);
    }

    // Delete bets
    const { error: betsError } = await supabaseAdmin
      .from('bets')
      .delete()
      .eq('user_id', user_id);
    
    if (betsError) {
      console.error('Error deleting bets:', betsError);
    }

    // Delete sportsbook connections
    const { error: sportsbooksError } = await supabaseAdmin
      .from('sportsbooks')
      .delete()
      .eq('user_id', user_id);
    
    if (sportsbooksError) {
      console.error('Error deleting sportsbooks:', sportsbooksError);
    }

    // Delete seller accounts
    const { error: sellerAccountsError } = await supabaseAdmin
      .from('seller_accounts')
      .delete()
      .eq('user_id', user_id);
    
    if (sellerAccountsError) {
      console.error('Error deleting seller accounts:', sellerAccountsError);
    }

    // Delete notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', user_id);
    
    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json({ error: 'Failed to delete profile data' }, { status: 500 });
    }

    // Finally, delete the auth user (this must be done with service role key)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    console.log(`Successfully deleted account for user: ${user_id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account successfully deleted' 
    });

  } catch (error) {
    console.error('Unexpected error during account deletion:', error);
    return NextResponse.json({ 
      error: 'Internal server error during account deletion' 
    }, { status: 500 });
  }
}