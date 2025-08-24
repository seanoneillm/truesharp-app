import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOddsCount() {
  try {
    const { count, error } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Total odds in database:', count);
    }

    // Check recent odds (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: recentError } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);
    
    if (recentError) {
      console.error('Recent error:', recentError);
    } else {
      console.log('📊 Odds added in last hour:', recentCount);
    }
    
  } catch (error) {
    console.error('Exception:', error);
  }
}

checkOddsCount();
