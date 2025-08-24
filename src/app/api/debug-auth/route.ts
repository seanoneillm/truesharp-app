import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth - Starting...');
    
    // Log auth cookies
    const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value;
    const refreshTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token-code-verifier')?.value;
    
    console.log('🍪 Auth cookies:', {
      hasAuthToken: !!authTokenCookie,
      hasRefreshToken: !!refreshTokenCookie,
      authTokenPreview: authTokenCookie?.substring(0, 20) + '...' || 'none'
    });
    
    // Try to create supabase client
    const supabase = await createServerSupabaseClient(request);
    console.log('✅ Supabase client created successfully');
    
    // Try to get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔐 Auth result:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...',
      userEmail: user?.email,
      authError: authError?.message
    });
    
    return NextResponse.json({
      success: true,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      hasAuthToken: !!authTokenCookie
    });
    
  } catch (error) {
    console.error('❌ Debug Auth Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}