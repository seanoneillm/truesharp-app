#!/usr/bin/env node

/**
 * Comprehensive script to fetch odds for all supported sports
 * Usage: node fetch-all-sports.js [--test|--insert] [--date YYYY-MM-DD]
 */

import OddsFetcher from './odds-fetcher/main.js'

async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  const testMode = !args.includes('--insert')
  const dateIndex = args.findIndex(arg => arg === '--date')
  const baseDate =
    dateIndex !== -1 && args[dateIndex + 1]
      ? args[dateIndex + 1]
      : new Date().toISOString().split('T')[0]

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 1)
  const endDate = nextDate.toISOString().split('T')[0]

  console.log('🎯 Comprehensive Sports Odds Fetcher')
  console.log('═'.repeat(50))
  console.log(`📅 Fetching odds from ${baseDate} to ${endDate}`)
  console.log(`🔧 Mode: ${testMode ? 'TEST (logging only)' : 'INSERT (save to database)'}`)
  console.log('')

  // All supported leagues with SportsGameOdds API
  const allLeagues = ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL']

  console.log('📊 Sports to fetch:')
  allLeagues.forEach((league, index) => {
    console.log(`  ${index + 1}. ${league}`)
  })
  console.log('')

  try {
    const fetcher = new OddsFetcher({
      testMode,
      verbose: true,
    })

    console.log('🚀 Starting comprehensive fetch...')
    const result = await fetcher.run(allLeagues, baseDate, endDate)

    if (result.success) {
      console.log('')
      console.log('✅ SUCCESS: All sports data fetched successfully!')
      console.log(`📊 Processed ${result.eventsProcessed} total events`)
      console.log(`⏱️ Total time: ${result.duration.toFixed(2)} seconds`)

      if (testMode) {
        console.log('')
        console.log('💡 To save to database, run with --insert flag:')
        console.log('   node fetch-all-sports.js --insert')
      }
    } else {
      console.log('')
      console.log('❌ FAILED: Error during fetch process')
      console.log(`❌ Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('')
    console.error('💥 FATAL ERROR:', error.message)
    console.error('')
    console.error('🐛 Debug info:')
    console.error('  - Check your API keys in .env.local')
    console.error('  - Verify database connection')
    console.error('  - Check rate limits')
    process.exit(1)
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Comprehensive Sports Odds Fetcher')
  console.log('')
  console.log('Usage: node fetch-all-sports.js [options]')
  console.log('')
  console.log('Options:')
  console.log('  --test       Run in test mode (default - logs only)')
  console.log('  --insert     Run in insert mode (saves to database)')
  console.log('  --date DATE  Start date (YYYY-MM-DD) [default: today]')
  console.log('  --help, -h   Show this help')
  console.log('')
  console.log('Examples:')
  console.log('  node fetch-all-sports.js                    # Test mode, today')
  console.log('  node fetch-all-sports.js --insert           # Save to DB, today')
  console.log('  node fetch-all-sports.js --test --date 2025-08-15')
  console.log('')
  console.log('Supported Sports:')
  console.log('  MLB, NBA, NFL, MLS, NHL, NCAAF, NCAAB, UCL')
  process.exit(0)
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
