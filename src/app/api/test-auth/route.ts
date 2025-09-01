// Test auth context from app
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Test 1: Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test 2: Check what auth.uid() returns in a query
    const { data: authTest } = await supabase
      .rpc('get_auth_uid')
      .single()
      .catch(() => null)

    // Test 3: Try a simple select to see if RLS works
    const { data: profileSelect, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id || '')
      .single()

    // Test 4: Try a simple update
    const { data: updateTest, error: updateError } = await supabase
      .from('profiles')
      .update({ bio: 'App test - ' + new Date().toISOString() })
      .eq('id', user?.id || '')

    return NextResponse.json({
      auth_user: user ? { id: user.id, email: user.email } : null,
      auth_error: authError?.message || null,
      profile_select: { data: profileSelect, error: selectError?.message || null },
      update_test: { data: updateTest, error: updateError?.message || null },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function - create this if it doesn't exist
// This function can be created in Supabase SQL editor:
/*
CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql;
*/