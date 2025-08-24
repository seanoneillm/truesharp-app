import axios from 'axios';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root (two levels up)
dotenv.config({ path: join(__dirname, '../../.env.local') });

const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
const baseUrl = 'https://api.sportsgameodds.com/v2/events';

export class SportsGameOddsAPI {
  constructor() {
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_ODDS_API_KEY is required in .env file');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(params, retryCount = 0) {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: { 'X-API-Key': this.apiKey },
        params,
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error) {
      console.error(`API request failed (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
        return this.makeRequest(params, retryCount + 1);
      }
      
      throw error;
    }
  }

  async fetchEvents(leagueID, startsAfter, startsBefore) {
    console.log(`📡 Fetching ${leagueID} events from ${startsAfter} to ${startsBefore}`);
    
    let nextCursor = null;
    let allEventData = [];
    let pageCount = 0;

    do {
      try {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount}${nextCursor ? ` (cursor: ${nextCursor.substring(0, 20)}...)` : ''}`);
        
        const params = {
          leagueID,
          startsAfter,
          startsBefore
        };
        
        // Only add cursor if it exists
        if (nextCursor) {
          params.cursor = nextCursor;
        }

        const data = await this.makeRequest(params);
        
        if (!data || !data.data) {
          console.warn('⚠️ No data received from API');
          break;
        }

        console.log(`✅ Page ${pageCount}: Retrieved ${data.data.length} events`);
        allEventData = allEventData.concat(data.data);
        nextCursor = data?.nextCursor;

        // Safety check to prevent infinite loops
        if (pageCount > 100) {
          console.warn('⚠️ Maximum page limit reached (100), stopping fetch');
          break;
        }

      } catch (error) {
        console.error(`❌ Error fetching page ${pageCount}:`, error.message);
        
        // If it's a rate limit error, throw it up
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        
        // For other errors, we might want to continue or break depending on severity
        if (error.response?.status >= 500) {
          console.error('🔥 Server error, stopping fetch');
          break;
        }
        
        // For client errors, we might want to continue with what we have
        console.error('⚠️ Client error, continuing with partial data');
        break;
      }
    } while (nextCursor);

    console.log(`🎯 Total events fetched: ${allEventData.length} across ${pageCount} pages`);
    return allEventData;
  }

  async fetchMultipleLeagues(leagues, startsAfter, startsBefore) {
    console.log(`📡 Fetching multiple leagues: ${leagues.join(', ')} from ${startsAfter} to ${startsBefore}`);
    
    // Use comma-separated leagues in a single API call for efficiency
    const leagueID = leagues.join(',');
    return this.fetchEvents(leagueID, startsAfter, startsBefore);
  }

  async fetchMLBEvents(startsAfter, startsBefore) {
    return this.fetchEvents('MLB', startsAfter, startsBefore);
  }

  async fetchNFLEvents(startsAfter, startsBefore) {
    return this.fetchEvents('NFL', startsAfter, startsBefore);
  }

  async fetchNBAEvents(startsAfter, startsBefore) {
    return this.fetchEvents('NBA', startsAfter, startsBefore);
  }

  async fetchNHLEvents(startsAfter, startsBefore) {
    return this.fetchEvents('NHL', startsAfter, startsBefore);
  }

  async fetchNCAAFEvents(startsAfter, startsBefore) {
    return this.fetchEvents('NCAAF', startsAfter, startsBefore);
  }

  async fetchNCAABEvents(startsAfter, startsBefore) {
    return this.fetchEvents('NCAAB', startsAfter, startsBefore);
  }

  async fetchMLSEvents(startsAfter, startsBefore) {
    return this.fetchEvents('MLS', startsAfter, startsBefore);
  }

  async fetchUCLEvents(startsAfter, startsBefore) {
    return this.fetchEvents('UCL', startsAfter, startsBefore);
  }

  async fetchAllSportsEvents(startsAfter, startsBefore) {
    return this.fetchMultipleLeagues(['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL'], startsAfter, startsBefore);
  }
}

export default SportsGameOddsAPI;