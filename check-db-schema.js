#!/usr/bin/env node

/**
 * Check actual database schema for pro_subscriptions table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    // Get table structure
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'pro_subscriptions' 
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.log('Trying alternative method...');
      // Try querying a single row to see column names
      const { data: sampleData, error: sampleError } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Cannot access table:', sampleError.message);
        return;
      }
      
      console.log('✅ pro_subscriptions table columns:');
      if (sampleData && sampleData.length > 0) {
        Object.keys(sampleData[0]).forEach(col => {
          console.log(`  - ${col}`);
        });
      } else {
        console.log('Table exists but is empty');
      }
    } else {
      console.log('✅ pro_subscriptions table schema:');
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();