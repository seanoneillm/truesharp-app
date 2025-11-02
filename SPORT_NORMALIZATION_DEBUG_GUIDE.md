# Sport Normalization Debug & Test Guide

## 🚨 ISSUE IDENTIFIED

If SmartFilters show NCAAMB bets when you select NCAAB, but strategy creation doesn't include them,
there's a mismatch between how filtering works in analytics vs strategy creation.

**SmartFilters**: Use iOS client-side `normalizeLeague()` function ✅  
**Strategy Creation**: Sends filters to web API for server-side filtering ❓

## Changes Made

### 1. Enhanced Web API Debugging (`/src/app/api/strategies/route.ts`)

- Added detailed logging to show exactly what bets exist in the database
- Added specific logging for college basketball bet detection
- Added test query after sport filter to show if any bets match
- Enhanced sport normalization for NCAAB/NCAAM/NCAAMB variations

### 2. iOS App Updates

- Added NCAAM and NCAAMB options to league selection (`filterConfig.ts`)
- Enhanced sport normalization in filter conversion (`strategyValidation.ts`)
- Updated analytics service to apply normalization (`supabaseAnalytics.ts`)

## Testing Steps

### Step 1: Check Your Database Bets

1. Go to your Supabase database
2. Run this query to see what college basketball bets you have:

```sql
SELECT id, sport, league, bet_type, status, created_at
FROM bets
WHERE user_id = 'your-user-id'
  AND (
    sport ILIKE '%ncaa%' OR sport ILIKE '%college%' OR
    sport ILIKE '%ncaab%' OR sport ILIKE '%ncaam%' OR sport ILIKE '%ncaamb%' OR
    league ILIKE '%ncaa%' OR league ILIKE '%college%' OR
    league ILIKE '%ncaab%' OR league ILIKE '%ncaam%' OR league ILIKE '%ncaamb%'
  )
ORDER BY created_at DESC
LIMIT 20;
```

This will show you exactly what sport/league values your college basketball bets have.

### Step 2: Test Strategy Creation with Debugging

1. **Deploy the updated API** with enhanced logging:
   - The web API now has extensive debug logging
   - When you create a strategy, check the server logs

2. **Create a test strategy in the iOS app**:
   - Go to Analytics → Strategies Tab
   - Click "Create Strategy"
   - Set the league filter to one of: NCAAB, NCAAM, or NCAAMB
   - Create the strategy

3. **Check the server logs** - you should see output like:

   ```
   🏀 Found X college basketball bets:
      Bet 123: sport="NCAAM", league="NCAAM"
      Bet 456: sport="NCAAB", league="NCAAB"

   🏀 Sport variations to match: ['NCAAB', 'NCAAM', 'NCAAMB', ...]
   🏀 Bets found after sport filter: X
   ```

### Step 3: Verify Strategy Creation

1. **Check if bets were added to strategy_bets table**:

```sql
SELECT sb.*, b.sport, b.league, b.bet_type
FROM strategy_bets sb
JOIN bets b ON b.id = sb.bet_id
WHERE sb.strategy_id = 'your-new-strategy-id'
LIMIT 10;
```

2. **Verify the strategy was created**:

```sql
SELECT * FROM strategies WHERE id = 'your-new-strategy-id';
```

## Expected Behavior

✅ **What Should Happen:**

- When you create a strategy with "NCAAB" filter
- It should find and include bets with ANY of these sport/league values:
  - NCAAB, NCAAM, NCAAMB
  - ncaab, ncaam, ncaamb
  - "College Basketball", "NCAA Basketball", etc.

❌ **What Might Go Wrong:**

- Database has college basketball bets but they use different naming
- API filtering logic has an issue
- Normalization not being applied correctly

## Debugging the Issue

If no bets are still being added, check the server logs for:

1. **"User has X total bets"** - Shows what bets exist
2. **"Found X college basketball bets"** - Shows college basketball detection
3. **"Sport variations to match"** - Shows what values we're searching for
4. **"Bets found after sport filter"** - Shows if filtering worked

The logs will tell us exactly where the issue is:

- No college basketball bets in database → Need to check data source
- College basketball bets exist but filter doesn't match → Normalization issue
- Filter matches bets but they're not inserted → Database insertion issue

## Quick Manual Test

You can also test the normalization logic directly in the browser console:

```javascript
function normalizeLeague(league) {
  const normalized = league.toLowerCase().trim()
  if (
    normalized === 'ncaam' ||
    normalized === 'ncaamb' ||
    normalized === "ncaa men's basketball" ||
    normalized === 'college basketball' ||
    normalized === 'ncaa basketball'
  ) {
    return 'NCAAB'
  }
  return league.toUpperCase()
}

// Test cases
console.log(normalizeLeague('NCAAM')) // Should output 'NCAAB'
console.log(normalizeLeague('NCAAMB')) // Should output 'NCAAB'
console.log(normalizeLeague("NCAA Men's Basketball")) // Should output 'NCAAB'
```

## Next Steps

1. Try creating a strategy with NCAAB filter
2. Check the server logs for the debug output
3. Report back what you see in the logs - this will help identify the exact issue
4. If needed, we can add more specific debugging or fix the identified problem
