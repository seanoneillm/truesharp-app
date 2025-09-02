import { mlbOddsAnalyzer } from '../src/lib/services/mlb-odds-analyzer'

async function testMLBDataAnalysis() {
  try {
    console.log('🧪 Testing MLB odds analysis for 8/15/24...')

    const mlbGameData = await mlbOddsAnalyzer.getMLBGamesWithOrganizedOdds()

    console.log(`📊 Found ${mlbGameData.length} MLB games`)

    mlbGameData.forEach((gameData, index) => {
      const { game, organizedOdds, oddsMetadata } = gameData

      console.log(`\n🏁 Game ${index + 1}: ${game.away_team_name} @ ${game.home_team_name}`)
      console.log(`   Time: ${new Date(game.game_time).toLocaleString()}`)
      console.log(`   Total Odds: ${oddsMetadata.totalOdds}`)
      console.log(`   Sportsbooks: ${oddsMetadata.sportsbooks.join(', ')}`)

      console.log('   📊 Main Lines:')
      console.log(`     Moneyline: ${organizedOdds.mainLines.moneyline.length} odds`)
      console.log(`     Run Line: ${organizedOdds.mainLines.runLine.length} odds`)
      console.log(`     Totals: ${organizedOdds.mainLines.totals.length} odds`)

      console.log('   👤 Player Props:')
      console.log(`     Hitting: ${organizedOdds.playerProps.hitting.length} props`)
      console.log(`     Pitching: ${organizedOdds.playerProps.pitching.length} props`)
      console.log(`     Fielding: ${organizedOdds.playerProps.fielding.length} props`)
      console.log(`     General: ${organizedOdds.playerProps.general.length} props`)

      console.log('   🏟️ Team Props:')
      console.log(`     Team Totals: ${organizedOdds.teamProps.teamTotals.length} props`)
      console.log(`     First to Score: ${organizedOdds.teamProps.firstToScore.length} props`)
      console.log(`     Innings: ${organizedOdds.teamProps.innings.length} props`)
      console.log(`     Advanced: ${organizedOdds.teamProps.advanced.length} props`)

      console.log('   🎯 Game Props:')
      console.log(`     Game Flow: ${organizedOdds.gameProps.gameFlow.length} props`)
      console.log(`     Timing: ${organizedOdds.gameProps.timing.length} props`)
      console.log(`     Special: ${organizedOdds.gameProps.special.length} props`)

      console.log(
        `   📋 Market Types: ${oddsMetadata.marketTypes.slice(0, 5).join(', ')}${oddsMetadata.marketTypes.length > 5 ? '...' : ''}`
      )
    })
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testMLBDataAnalysis()
