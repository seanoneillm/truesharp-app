/**
 * Test script to verify sport normalization for NCAAB/NCAAM/NCAAMB variations
 * Run with: node test-sport-normalization.js
 */

// Simple test function for sport normalization logic
function normalizeLeague(league) {
  const normalized = league.toLowerCase().trim()

  // Treat NCAAB, NCAAM, and NCAAMB as the same league
  if (
    normalized === 'ncaam' ||
    normalized === 'ncaamb' ||
    normalized === "ncaa men's basketball" ||
    normalized === 'college basketball' ||
    normalized === 'ncaa basketball'
  ) {
    return 'NCAAB'
  }

  // Return original league in uppercase for consistency
  return league.toUpperCase()
}

// Test cases for sport normalization
const testCases = [
  // NCAAB variations
  { input: 'NCAAB', expected: 'NCAAB' },
  { input: 'ncaab', expected: 'NCAAB' },
  { input: 'NCAAM', expected: 'NCAAB' },
  { input: 'ncaam', expected: 'NCAAB' },
  { input: 'NCAAMB', expected: 'NCAAB' },
  { input: 'ncaamb', expected: 'NCAAB' },
  { input: "NCAA Men's Basketball", expected: 'NCAAB' },
  { input: "ncaa men's basketball", expected: 'NCAAB' },
  { input: 'College Basketball', expected: 'NCAAB' },
  { input: 'college basketball', expected: 'NCAAB' },
  { input: 'NCAA Basketball', expected: 'NCAAB' },
  { input: 'ncaa basketball', expected: 'NCAAB' },

  // Other sports should remain unchanged (but uppercased)
  { input: 'NFL', expected: 'NFL' },
  { input: 'nfl', expected: 'NFL' },
  { input: 'NBA', expected: 'NBA' },
  { input: 'nba', expected: 'NBA' },
  { input: 'MLB', expected: 'MLB' },
  { input: 'mlb', expected: 'MLB' },
]

console.log('🏀 Testing Sport Normalization for NCAAB/NCAAM/NCAAMB variations\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = normalizeLeague(testCase.input)
  const success = result === testCase.expected

  if (success) {
    console.log(`✅ Test ${index + 1}: "${testCase.input}" → "${result}"`)
    passed++
  } else {
    console.log(
      `❌ Test ${index + 1}: "${testCase.input}" → "${result}" (expected "${testCase.expected}")`
    )
    failed++
  }
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All tests passed! Sport normalization is working correctly.')
  console.log('\n📝 Key normalization rules:')
  console.log('   • NCAAM → NCAAB')
  console.log('   • NCAAMB → NCAAB')
  console.log('   • "NCAA Men\'s Basketball" → NCAAB')
  console.log('   • "College Basketball" → NCAAB')
  console.log('   • "NCAA Basketball" → NCAAB')
  console.log('   • Other sports remain unchanged (but uppercased)')
} else {
  console.log('❌ Some tests failed. Please check the normalization logic.')
  process.exit(1)
}
