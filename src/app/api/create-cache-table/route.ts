import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create user_performance_cache table
    const { error } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_performance_cache (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          total_bets INTEGER DEFAULT 0,
          won_bets INTEGER DEFAULT 0,
          lost_bets INTEGER DEFAULT 0,
          total_profit DECIMAL(10,2) DEFAULT 0.00,
          total_stake DECIMAL(10,2) DEFAULT 0.00,
          win_rate DECIMAL(5,2) DEFAULT 0.00,
          roi DECIMAL(5,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(user_id)
        );

        ALTER TABLE public.user_performance_cache ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own performance cache" ON public.user_performance_cache;
        CREATE POLICY "Users can view own performance cache" ON public.user_performance_cache
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Service role can manage all performance caches" ON public.user_performance_cache;
        CREATE POLICY "Service role can manage all performance caches" ON public.user_performance_cache
          FOR ALL USING (current_setting('role') = 'service_role');
      `
    })

    if (error) {
      console.error('Error creating performance cache table:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User performance cache table created successfully'
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error creating table'
    })
  }
}
