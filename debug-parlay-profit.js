// Debug script to test parlay insertion and check profit values
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hidzkmhywpxcikwhpynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZHprbWh5d3B4Y2lrd2hweW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA1NzI2MjQsImV4cCI6MjAxNjE0ODYyNH0.5nDulrWZ8YtuQrlKhmlqqKjrV7MZRhOL6lFBPy9esDI'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data that mimics a parlay
const testBets = [
  {
    id: 'test-bet-1',
    gameId: 'game-1',
    sport: 'americanfootball_nfl',
    homeTeam: 'Patriots',
    awayTeam: 'Bills',
    gameTime: '2024-12-08T18:00:00Z',
    marketType: 'americanfootball_nfl-game-1-ml-home',
    selection: 'Patriots',
    odds: -110,
    sportsbook: 'test',
    description: 'Patriots ML'
  },
  {
    id: 'test-bet-2', 
    gameId: 'game-2',
    sport: 'americanfootball_nfl',
    homeTeam: 'Cowboys',
    awayTeam: 'Eagles',
    gameTime: '2024-12-08T21:00:00Z',
    marketType: 'americanfootball_nfl-game-2-ml-away',
    selection: 'Eagles',
    odds: +150,
    sportsbook: 'test',
    description: 'Eagles ML'
  }
]

async function testParlayInsertion() {
  try {
    console.log('🧪 Testing parlay insertion to debug profit values...')
    
    const response = await fetch('https://truesharp.io/api/bets/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see the logic
      },
      body: JSON.stringify({
        bets: testBets,
        stake: 100,
        userId: 'test-user'
      })
    })
    
    const result = await response.json()
    console.log('API Response:', result)
    
  } catch (error) {
    console.error('Error testing parlay insertion:', error)
  }
}

testParlayInsertion()