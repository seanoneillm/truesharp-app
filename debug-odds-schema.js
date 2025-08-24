import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOddsTableSchema() {
  try {
    // First, let's look at some failing odds records to see what field is too long
    console.log('🔍 Checking recent odds records that might have failed...');
    
    // Get a sample of odds to see the data structure
    const { data: sampleOdds, error } = await supabase
      .from('odds')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching sample odds:', error);
    } else {
      console.log('📊 Sample odds records:', JSON.stringify(sampleOdds, null, 2));
    }
    
    // Try to find odds records with very long field values
    const { data: longRecords, error: longError } = await supabase
      .from('odds')
      .select('oddid, marketname, bettypeid, sideid, sportsbook, line')
      .limit(50);
      
    if (longError) {
      console.error('Error checking for long records:', longError);
    } else {
      console.log('📏 Recent odds records field lengths:');
      if (longRecords && longRecords.length > 0) {
        longRecords.forEach((record, i) => {
          console.log(`Record ${i + 1}:`, {
            oddid: record.oddid?.length || 0,
            marketname: record.marketname?.length || 0,
            bettypeid: record.bettypeid?.length || 0, 
            sideid: record.sideid?.length || 0,
            sportsbook: record.sportsbook?.length || 0,
            line: record.line?.length || 0
          });
          
          // Show any fields over 50 characters
          if (record.oddid?.length > 50) console.log('❌ LONG oddid:', record.oddid);
          if (record.marketname?.length > 50) console.log('❌ LONG marketname:', record.marketname);
          if (record.bettypeid?.length > 50) console.log('❌ LONG bettypeid:', record.bettypeid);
          if (record.sideid?.length > 50) console.log('❌ LONG sideid:', record.sideid);
          if (record.sportsbook?.length > 50) console.log('❌ LONG sportsbook:', record.sportsbook);
          if (record.line?.length > 50) console.log('❌ LONG line:', record.line);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOddsTableSchema();
