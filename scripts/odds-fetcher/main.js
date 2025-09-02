import dotenv from 'dotenv'
import { SportsGameOddsAPI } from './api-client.js'
import { DataNormalizer } from './data-normalizer.js'
import { SupabaseClient } from './database-client.js'

dotenv.config()

export class OddsFetcher {
  constructor(options = {}) {
    this.testMode = options.testMode || false
    this.verbose = options.verbose || false

    console.log(`🚀 OddsFetcher initialized in ${this.testMode ? 'TEST' : 'INSERT'} mode`)

    try {
      this.apiClient = new SportsGameOddsAPI()
      this.normalizer = new DataNormalizer()
      this.dbClient = new SupabaseClient()
    } catch (error) {
      console.error('❌ Failed to initialize OddsFetcher:', error.message)
      throw error
    }
  }

  async run(leagues = ['MLB'], startsAfter = '2025-08-14', startsBefore = '2025-08-15') {
    // Support both single league string and array of leagues
    const leagueList = typeof leagues === 'string' ? [leagues] : leagues

    console.log('🎯 Starting odds fetching process...')
    console.log(`📅 Leagues: ${leagueList.join(', ')}, Period: ${startsAfter} to ${startsBefore}`)
    console.log(
      `🔧 Mode: ${this.testMode ? 'TEST (logging only)' : 'INSERT (will save to database)'}`
    )
    console.log('═'.repeat(80))

    const startTime = Date.now()
    let success = false

    try {
      // Step 1: Test database connection (always do this)
      if (!this.testMode) {
        console.log('🔍 Testing database connection...')
        const connectionOk = await this.dbClient.testConnection()
        if (!connectionOk) {
          throw new Error('Database connection failed')
        }
        console.log('✅ Database connection verified')
      }

      // Step 2: Fetch data from API
      console.log('📡 Fetching events from Sports Game Odds API...')
      const rawEvents = await this.fetchEventsForLeagues(leagueList, startsAfter, startsBefore)

      if (!rawEvents || rawEvents.length === 0) {
        console.log('⚠️ No events retrieved from API')
        return { success: true, message: 'No events to process' }
      }

      // Step 3: Normalize the data
      console.log('🔄 Normalizing data...')
      this.normalizer.resetOddsTracking()
      const normalizedData = this.normalizer.normalizeEventsBatch(rawEvents)

      // Step 4: Log results
      this.logResults(normalizedData, rawEvents)

      // Step 5: Insert/test based on mode
      if (this.testMode) {
        console.log('🧪 TEST MODE: Data normalized successfully, skipping database insert')
        console.log('💡 To enable database insert, set testMode: false or run with --insert flag')
        success = true
      } else {
        console.log('💾 Inserting data into database...')
        const insertResults = await this.dbClient.upsertGameAndOddsData(normalizedData)

        if (insertResults.overall_success) {
          console.log('✅ Data successfully inserted into database')
          await this.showDatabaseSummary()
          success = true
        } else {
          console.error('❌ Database insertion failed')
          this.logErrors(insertResults)
          success = false
        }
      }

      const duration = (Date.now() - startTime) / 1000
      console.log('═'.repeat(80))
      console.log(`🏁 Process completed in ${duration.toFixed(2)} seconds`)
      console.log(`📊 Final Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`)

      return {
        success,
        normalizedData,
        duration,
        eventsProcessed: rawEvents.length,
      }
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000
      console.error('❌ Fatal error in odds fetching process:', error.message)
      console.error('═'.repeat(80))
      console.error(`🏁 Process failed after ${duration.toFixed(2)} seconds`)

      if (this.verbose) {
        console.error('🐛 Full error details:', error)
      }

      return {
        success: false,
        error: error.message,
        duration,
        eventsProcessed: 0,
      }
    }
  }

  async fetchEventsForLeagues(leagues, startsAfter, startsBefore) {
    // For efficiency, use the multi-league fetch that combines leagues in one API call
    if (leagues.length > 1) {
      console.log(`📡 Fetching multiple leagues in single API call: ${leagues.join(', ')}`)
      return await this.apiClient.fetchMultipleLeagues(leagues, startsAfter, startsBefore)
    } else if (leagues.length === 1) {
      return await this.fetchEventsByLeague(leagues[0], startsAfter, startsBefore)
    } else {
      throw new Error('No leagues specified')
    }
  }

  async fetchEventsByLeague(league, startsAfter, startsBefore) {
    const leagueMap = {
      MLB: () => this.apiClient.fetchMLBEvents(startsAfter, startsBefore),
      NFL: () => this.apiClient.fetchNFLEvents(startsAfter, startsBefore),
      NBA: () => this.apiClient.fetchNBAEvents(startsAfter, startsBefore),
      NHL: () => this.apiClient.fetchNHLEvents(startsAfter, startsBefore),
      NCAAF: () => this.apiClient.fetchNCAAFEvents(startsAfter, startsBefore),
      NCAAB: () => this.apiClient.fetchNCAABEvents(startsAfter, startsBefore),
      MLS: () => this.apiClient.fetchMLSEvents(startsAfter, startsBefore),
      UCL: () => this.apiClient.fetchUCLEvents(startsAfter, startsBefore),
    }

    const fetchFunction = leagueMap[league.toUpperCase()]
    if (!fetchFunction) {
      throw new Error(
        `Unsupported league: ${league}. Supported: ${Object.keys(leagueMap).join(', ')}`
      )
    }

    return await fetchFunction()
  }

  logResults(normalizedData, rawEvents) {
    console.log('📋 PROCESSING SUMMARY')
    console.log('─'.repeat(40))
    console.log(`📥 Raw events fetched: ${rawEvents.length}`)
    console.log(`🎮 Games normalized: ${normalizedData.games.length}`)
    console.log(`📊 Odds entries normalized: ${normalizedData.odds.length}`)

    if (this.verbose && normalizedData.games.length > 0) {
      console.log('\n📝 Sample Games:')
      normalizedData.games.slice(0, 3).forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.away_team_name} @ ${game.home_team_name}`)
        console.log(`     Game ID: ${game.id}, Time: ${game.game_time}`)
      })
    }

    if (this.verbose && normalizedData.odds.length > 0) {
      console.log('\n📈 Sample Odds:')
      normalizedData.odds.slice(0, 5).forEach((odd, index) => {
        console.log(`  ${index + 1}. ${odd.marketname} - ${odd.bettypeid} (${odd.sideid})`)
        console.log(`     Odds: ${odd.bookodds}, Game: ${odd.eventid}`)
      })
    }
  }

  logErrors(insertResults) {
    if (insertResults.games.errors.length > 0) {
      console.error('❌ Games insertion errors:')
      insertResults.games.errors.forEach((error, index) => {
        console.error(`  ${index + 1}.`, error.message || error)
      })
    }

    if (insertResults.odds.errors.length > 0) {
      console.error('❌ Odds insertion errors:')
      insertResults.odds.errors.forEach((error, index) => {
        console.error(`  ${index + 1}.`, error.message || error)
      })
    }
  }

  async showDatabaseSummary() {
    try {
      const recentGames = await this.dbClient.getRecentGames(3)
      const recentOdds = await this.dbClient.getRecentOdds(5)

      console.log('\n📊 DATABASE SUMMARY')
      console.log('─'.repeat(40))
      console.log(`🎮 Recent games in database: ${recentGames.length}`)
      recentGames.forEach((game, index) => {
        console.log(
          `  ${index + 1}. ${game.away_team_name} @ ${game.home_team_name} (${game.status})`
        )
      })

      console.log(`📈 Recent odds in database: ${recentOdds.length}`)
      recentOdds.forEach((odd, index) => {
        console.log(`  ${index + 1}. ${odd.market_name || 'N/A'} - ${odd.bet_type_id || 'N/A'}`)
      })
    } catch (error) {
      console.warn('⚠️ Could not fetch database summary:', error.message)
    }
  }

  // Convenience methods for different leagues and multi-sport fetching
  async fetchMLB(startsAfter, startsBefore) {
    return this.run(['MLB'], startsAfter, startsBefore)
  }

  async fetchNFL(startsAfter, startsBefore) {
    return this.run(['NFL'], startsAfter, startsBefore)
  }

  async fetchNBA(startsAfter, startsBefore) {
    return this.run(['NBA'], startsAfter, startsBefore)
  }

  async fetchNHL(startsAfter, startsBefore) {
    return this.run(['NHL'], startsAfter, startsBefore)
  }

  async fetchNCAAF(startsAfter, startsBefore) {
    return this.run(['NCAAF'], startsAfter, startsBefore)
  }

  async fetchNCAAB(startsAfter, startsBefore) {
    return this.run(['NCAAB'], startsAfter, startsBefore)
  }

  async fetchMLS(startsAfter, startsBefore) {
    return this.run(['MLS'], startsAfter, startsBefore)
  }

  async fetchUCL(startsAfter, startsBefore) {
    return this.run(['UCL'], startsAfter, startsBefore)
  }

  async fetchAllSports(startsAfter, startsBefore) {
    return this.run(
      ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL'],
      startsAfter,
      startsBefore
    )
  }
}

// CLI execution when run directly
async function main() {
  const args = process.argv.slice(2)

  // Parse command line arguments
  const testMode = args.includes('--test') || args.includes('-t')
  const insertMode = args.includes('--insert') || args.includes('-i')
  const verbose = args.includes('--verbose') || args.includes('-v')

  // Get league argument
  const leagueIndex = args.findIndex(arg => ['--league', '-l'].includes(arg))
  const leagueArg = leagueIndex !== -1 && args[leagueIndex + 1] ? args[leagueIndex + 1] : 'ALL'

  // Parse leagues - support comma-separated values or ALL for all sports
  let leagues
  if (leagueArg.toUpperCase() === 'ALL') {
    leagues = ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL']
  } else {
    leagues = leagueArg.split(',').map(l => l.trim().toUpperCase())
  }

  // Get date arguments
  const startIndex = args.findIndex(arg => ['--start', '-s'].includes(arg))
  const endIndex = args.findIndex(arg => ['--end', '-e'].includes(arg))
  const startsAfter =
    startIndex !== -1 && args[startIndex + 1] ? args[startIndex + 1] : '2025-08-14'
  const startsBefore = endIndex !== -1 && args[endIndex + 1] ? args[endIndex + 1] : '2025-08-15'

  // Determine mode (default to test unless insert is explicitly specified)
  const finalTestMode = insertMode ? false : testMode ? true : true // Default to test mode

  console.log('🎯 OddsFetcher CLI')
  console.log('═'.repeat(50))

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node main.js [options]')
    console.log('')
    console.log('Options:')
    console.log('  --test, -t      Run in test mode (default, logs only)')
    console.log('  --insert, -i    Run in insert mode (saves to database)')
    console.log('  --verbose, -v   Enable verbose logging')
    console.log('  --league, -l    Leagues to fetch (ALL, MLB,NBA,NFL, etc.) [default: ALL]')
    console.log('  --start, -s     Start date (YYYY-MM-DD) [default: 2025-08-14]')
    console.log('  --end, -e       End date (YYYY-MM-DD) [default: 2025-08-15]')
    console.log('  --help, -h      Show this help message')
    console.log('')
    console.log('Examples:')
    console.log('  node main.js --test --league ALL')
    console.log('  node main.js --insert --league MLB,NBA,NFL --start 2025-08-15 --end 2025-08-16')
    console.log('  node main.js --insert --league MLB --verbose')
    return
  }

  try {
    const fetcher = new OddsFetcher({ testMode: finalTestMode, verbose })
    const result = await fetcher.run(leagues, startsAfter, startsBefore)

    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('💥 CLI execution failed:', error.message)
    process.exit(1)
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default OddsFetcher
