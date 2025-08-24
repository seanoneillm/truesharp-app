import type { BetSlipBet } from '@/contexts/BetSlipContext';
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer';
import { submitBet } from '@/lib/services/betting';
import type { Bet } from '@/lib/services/betting/types';
import { NextRequest, NextResponse } from 'next/server';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Bet submission API called');
    
    // Log cookies for debugging
    const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value;
    const refreshTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token-code-verifier')?.value;
    
    console.log('🍪 Cookie debug:', {
      hasAuthToken: !!authTokenCookie,
      hasRefreshToken: !!refreshTokenCookie,
      authTokenPreview: authTokenCookie?.substring(0, 50) + '...' || 'none'
    });
    
    // Parse request body
    const body = await request.json();
    const { bets, stake, userId: clientUserId } = body;
    
    console.log('📝 Request data:', { 
      betsCount: bets?.length, 
      stake, 
      hasClientUserId: !!clientUserId,
      timestamp: new Date().toISOString() 
    });

    // Validate request data
    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid bets data' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!stake || typeof stake !== 'number' || stake < 1 || stake > 10000) {
      return NextResponse.json(
        { success: false, error: 'Stake must be between $1 and $10,000' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user from session
    console.log('🔄 Creating Supabase client...');
    const supabase = await createServerSupabaseClient(request);
    console.log('✅ Supabase client created');

    console.log('🔐 Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔐 Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id?.substring(0, 8) + '...' || 'undefined...', 
      userEmail: user?.email,
      authError: authError?.message || 'Auth session missing!'
    });

    let finalUser = user;

    if (authError || !user) {
      console.log('❌ Authentication failed, trying session refresh...');
      
      // Check if we have a refresh token in cookies
      const refreshTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token-code-verifier');
      const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token');
      
      console.log('🔍 Cookie analysis:', {
        hasRefreshTokenCookie: !!refreshTokenCookie,
        hasAuthTokenCookie: !!authTokenCookie,
        refreshTokenLength: refreshTokenCookie?.value?.length || 0,
        authTokenLength: authTokenCookie?.value?.length || 0
      });
      
      // Try to refresh the session if we have a refresh token
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        console.log('🔄 Session refresh result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          refreshError: refreshError?.message
        });
        
        if (!refreshError && session?.user) {
          finalUser = session.user;
          console.log('✅ Successfully refreshed session');
        } else {
          // If session refresh fails, try creating a service role client to validate user
          console.log('🔄 Trying service role validation as fallback...');
          
          const { createClient } = await import('@supabase/supabase-js');
          const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          // Get user ID from any available cookie data
          let userId = null;
          if (authTokenCookie?.value) {
            try {
              // Try to extract user ID from JWT token
              const tokenValue = authTokenCookie.value;
              const tokenParts = tokenValue.split('.');
              if (tokenParts.length === 3 && tokenParts[1]) {
                const payload = JSON.parse(atob(tokenParts[1]));
                userId = payload.sub;
                console.log('📋 Extracted user ID from token:', userId?.substring(0, 8) + '...');
              }
            } catch {
              console.log('⚠️ Could not extract user ID from token');
            }
          }
          
          if (userId) {
            // Validate that this user exists in our database
            const { data: userProfile, error: profileError } = await serviceSupabase
              .from('profiles')
              .select('id, email')
              .eq('id', userId)
              .single();
              
            if (!profileError && userProfile) {
              console.log('✅ User validated via service role');
              finalUser = {
                id: userId,
                email: userProfile.email,
                aud: 'authenticated',
                role: 'authenticated',
                email_confirmed_at: new Date().toISOString(),
                app_metadata: {},
                user_metadata: {},
                identities: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            } else {
              console.log('❌ User validation failed:', profileError?.message);
              return NextResponse.json(
                { 
                  success: false, 
                  error: 'Authentication required. Please log in again.',
                  details: 'User validation failed'
                },
                { status: 401, headers: corsHeaders }
              );
            }
          } else if (clientUserId) {
            // Use client-provided user ID as fallback
            console.log('🔄 Trying client-provided user ID validation...');
            const { data: userProfile, error: profileError } = await serviceSupabase
              .from('profiles')
              .select('id, email')
              .eq('id', clientUserId)
              .single();
              
            if (!profileError && userProfile) {
              console.log('✅ User validated via client-provided ID');
              finalUser = {
                id: clientUserId,
                email: userProfile.email,
                aud: 'authenticated',
                role: 'authenticated',
                email_confirmed_at: new Date().toISOString(),
                app_metadata: {},
                user_metadata: {},
                identities: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            } else {
              console.log('❌ Client user validation failed:', profileError?.message);
              return NextResponse.json(
                { 
                  success: false, 
                  error: 'Authentication required. Please log in again.',
                  details: 'Client user validation failed'
                },
                { status: 401, headers: corsHeaders }
              );
            }
          } else {
            console.log('❌ Session refresh failed:', refreshError?.message);
            return NextResponse.json(
              { 
                success: false, 
                error: 'Authentication required. Please log in again.',
                details: refreshError?.message || authError?.message || 'No valid session found'
              },
              { status: 401, headers: corsHeaders }
            );
          }
        }
      } catch (refreshException) {
        console.log('❌ Session refresh exception:', refreshException);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required. Please log in again.',
            details: 'Session refresh failed'
          },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    if (!finalUser) {
      console.log('❌ No valid user found after all attempts');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required. Please log in again.',
          details: 'User authentication failed'
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate bet structure
    const validatedBets: Bet[] = bets.map((bet: BetSlipBet, index: number) => {
      if (!bet.id || !bet.gameId || !bet.sport || !bet.homeTeam || !bet.awayTeam || 
          !bet.gameTime || !bet.marketType || !bet.selection || !bet.odds || !bet.sportsbook) {
        throw new Error(`Invalid bet structure at index ${index}`);
      }

      return {
        id: bet.id,
        gameId: bet.gameId,
        sport: bet.sport,
        homeTeam: bet.homeTeam,
        awayTeam: bet.awayTeam,
        gameTime: bet.gameTime,
        marketType: bet.marketType,
        selection: bet.selection,
        odds: Number(bet.odds),
        line: bet.line ? Number(bet.line) : 0, // Default to 0 instead of undefined
        sportsbook: bet.sportsbook,
        description: bet.description || `${bet.selection} ${bet.odds > 0 ? '+' : ''}${bet.odds}`
      };
    });

    // Submit bet using our backend functions with service role for database operations
    console.log('💰 Submitting bet:', { 
      userId: finalUser.id, 
      betsCount: validatedBets.length, 
      stake 
    });
    
    // Create service role client for database operations to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const result = await submitBet(serviceSupabase, finalUser.id, validatedBets, stake);
    
    console.log('📊 Bet submission result:', result);

    if (result.success) {
      return NextResponse.json(result, { status: 200, headers: corsHeaders });
    } else {
      return NextResponse.json(result, { status: 400, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Error in bet submission API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}