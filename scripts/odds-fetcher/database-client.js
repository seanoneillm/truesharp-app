import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export class SupabaseClient {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env file');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');
  }

  /**
   * Insert or update games in the database
   * Uses upsert to handle existing games
   */
  async upsertGames(gamesData) {
    if (!gamesData || gamesData.length === 0) {
      console.log('⚠️ No games data to insert');
      return { success: true, data: [], errors: [] };
    }

    console.log(`💾 Upserting ${gamesData.length} games...`);
    const results = { success: true, data: [], errors: [] };

    try {
      // Upsert games using the 'id' field as the conflict resolution
      const { data, error } = await this.supabase
        .from('games')
        .upsert(gamesData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Error upserting games:', error);
        results.success = false;
        results.errors.push(error);
        return results;
      }

      results.data = data || [];
      console.log(`✅ Successfully upserted ${results.data.length} games`);
      return results;

    } catch (error) {
      console.error('❌ Exception during games upsert:', error);
      results.success = false;
      results.errors.push(error);
      return results;
    }
  }

  /**
   * Insert odds data in batches to avoid query size limits
   */
  async upsertOdds(oddsData) {
    if (!oddsData || oddsData.length === 0) {
      console.log('⚠️ No odds data to insert');
      return { success: true, data: [], errors: [] };
    }

    console.log(`💾 Processing ${oddsData.length} odds entries in batches...`);
    const results = { success: true, data: [], errors: [] };
    const BATCH_SIZE = 100; // Process in smaller batches

    try {
      // Process odds in batches
      for (let i = 0; i < oddsData.length; i += BATCH_SIZE) {
        const batch = oddsData.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(oddsData.length / BATCH_SIZE)} (${batch.length} entries)`);

        // Get oddids for this batch
        const batchOddIds = batch.map(odd => odd.oddid).filter(Boolean);

        let newOdds = batch;
        if (batchOddIds.length > 0) {
          // Check if any odds in this batch already exist
          const { data: existingOdds, error: checkError } = await this.supabase
            .from('odds')
            .select('oddid')
            .in('oddid', batchOddIds);

          if (checkError) {
            console.error(`❌ Error checking existing odds for batch:`, checkError);
            results.errors.push(checkError);
            continue;
          }

          const existingOddIds = new Set(existingOdds?.map(odd => odd.oddid) || []);
          newOdds = batch.filter(odd => !existingOddIds.has(odd.oddid));
          
          if (existingOddIds.size > 0) {
            console.log(`� Batch: ${existingOddIds.size} existing, ${newOdds.length} new odds`);
          }
        }

        if (newOdds.length > 0) {
          // Insert only new odds from this batch
          const { data: insertedData, error: insertError } = await this.supabase
            .from('odds')
            .insert(newOdds)
            .select();

          if (insertError) {
            console.error(`❌ Error inserting batch:`, insertError);
            results.errors.push(insertError);
            continue;
          }

          if (insertedData) {
            results.data.push(...insertedData);
            console.log(`✅ Batch inserted: ${insertedData.length} odds entries`);
          }
        } else {
          console.log(`⏭️ Batch skipped: all odds already exist`);
        }

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < oddsData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
        console.log(`⚠️ Completed with ${results.errors.length} batch errors`);
      } else {
        console.log(`✅ Successfully processed all batches`);
      }
      
      // Log summary
      const lineCount = results.data.filter(odd => odd.line !== null && odd.line !== undefined).length;
      const scoreCount = results.data.filter(odd => odd.score !== null && odd.score !== undefined).length;
      console.log(`📊 Final summary: ${results.data.length} total inserted, ${lineCount} with line values, ${scoreCount} with scores`);
      
      return results;

    } catch (error) {
      console.error('❌ Exception during batch odds processing:', error);
      results.success = false;
      results.errors.push(error);
      return results;
    }
  }

  /**
   * Insert both games and odds data in a transaction-like manner
   */
  async upsertGameAndOddsData(normalizedData) {
    console.log('🔄 Starting batch upsert of games and odds...');
    
    const results = {
      games: { success: true, data: [], errors: [] },
      odds: { success: true, data: [], errors: [] },
      overall_success: true
    };

    try {
      // First, upsert games
      results.games = await this.upsertGames(normalizedData.games);
      
      if (!results.games.success) {
        console.error('❌ Games upsert failed, skipping odds');
        results.overall_success = false;
        return results;
      }

      // Then, upsert odds
      results.odds = await this.upsertOdds(normalizedData.odds);
      
      if (!results.odds.success) {
        console.error('❌ Odds upsert failed');
        results.overall_success = false;
      }

      if (results.overall_success) {
        console.log('🎉 Batch upsert completed successfully!');
        console.log(`📊 Summary: ${results.games.data.length} games, ${results.odds.data.length} odds entries`);
      }

      return results;

    } catch (error) {
      console.error('❌ Exception during batch upsert:', error);
      results.overall_success = false;
      results.games.errors.push(error);
      return results;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      console.log('🔍 Testing database connection...');
      
      const { data, error } = await this.supabase
        .from('games')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection test successful');
      return true;

    } catch (error) {
      console.error('❌ Database connection test exception:', error);
      return false;
    }
  }

  /**
   * Get recent games for verification
   */
  async getRecentGames(limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .order('game_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent games:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Exception fetching recent games:', error);
      return [];
    }
  }

  /**
   * Get recent odds for verification
   */
  async getRecentOdds(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('odds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent odds:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Exception fetching recent odds:', error);
      return [];
    }
  }

  /**
   * Clean up old data (optional maintenance function)
   */
  async cleanupOldData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      console.log(`🧹 Cleaning up data older than ${daysOld} days (before ${cutoffDate.toISOString()})`);

      // Clean up old odds first (due to foreign key constraints)
      const { error: oddsError } = await this.supabase
        .from('odds')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (oddsError) {
        console.error('❌ Error cleaning up old odds:', oddsError);
        return false;
      }

      // Then clean up old games
      const { error: gamesError } = await this.supabase
        .from('games')
        .delete()
        .lt('game_time', cutoffDate.toISOString());

      if (gamesError) {
        console.error('❌ Error cleaning up old games:', gamesError);
        return false;
      }

      console.log('✅ Cleanup completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception during cleanup:', error);
      return false;
    }
  }
}

export default SupabaseClient;