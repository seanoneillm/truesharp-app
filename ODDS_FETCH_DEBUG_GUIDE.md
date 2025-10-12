# Odds Fetch System Debugging Guide

## The Problem

The logs show thousands of odds found from the API, but the database only ends up with a couple
thousand rows. Many leagues and player props are missing.

## How to Debug This Issue

### Step 1: Run Pre-Fetch Diagnostics

1. Go to the Admin page in your app
2. Navigate to the "Controls" tab
3. Click "Quick Debug" to run initial system checks

**What to look for:**

- Current odds table count
- Current open_odds table count
- API connectivity test
- Database trigger status

### Step 2: Run 30-Second Controlled Test

1. In the same "Debug Odds System" section
2. Click "30s Controlled Test"
3. This will fetch a small sample and track every step

**What this test reveals:**

- Exact number of odds returned by API
- How many records are prepared for database insert
- Insert success/failure rates
- Database trigger behavior
- Where odds are being lost

### Step 3: Analyze the Results

The test will categorize the problem into one of these:

#### Problem Type 1: "NO EVENTS FROM API"

- **Issue:** API connection or league configuration
- **Fix:** Check API key, verify league mappings in `/api/fetch-odds-dual-table/route.ts`

#### Problem Type 2: "EVENTS BUT NO ODDS"

- **Issue:** API returns games but no odds data
- **Fix:** Check API response structure, verify `includeAltLines=true` parameter

#### Problem Type 3: "ODDS EXIST BUT INSERTS FAIL"

- **Issue:** Database constraints or permissions
- **Fix:** Check database triggers, run `database-triggers-odds-management.sql`

#### Problem Type 4: "HIGH INSERT FAILURE RATE"

- **Issue:** Duplicate constraints too aggressive
- **Fix:** Review unique constraints `(eventid, oddid, line)`

#### Problem Type 5: "INSERTS SUCCESS BUT NO DB GROWTH"

- **Issue:** Triggers deleting all new inserts
- **Fix:** Check trigger functions in database

#### Problem Type 6: "SYSTEM WORKING"

- **Issue:** Scale expectation mismatch
- **Fix:** Run full 9-league fetch and measure actual vs expected

### Step 4: Full System Test

Once the controlled test passes:

1. Run the full "Fetch All Leagues (Dual Table)"
2. Monitor for 30 seconds using the Quick Debug before and after
3. Compare expected vs actual odds counts

### Step 5: Deep Dive Analysis

If problems persist, run the comprehensive SQL debug script:

```sql
-- Use the debug-odds-fetch-system.sql file
-- Run this in Supabase SQL Editor before and after fetch
```

## Common Issues and Fixes

### Issue: API Returns 0 Odds

**Symptoms:** Events found but no odds in events **Root Cause:** API not including odds data
**Fix:** Verify `includeAltLines=true` and check API documentation

### Issue: All Inserts Rejected as Duplicates

**Symptoms:** High duplicate rejection rate on fresh data **Root Cause:** Incorrect duplicate
detection logic **Fix:** Review trigger functions, ensure proper timestamp comparison

### Issue: Player Props Missing

**Symptoms:** Only main lines (ML, spread, total) in database **Root Cause:** Player prop parsing or
market type filtering **Fix:** Check `processOddRecord` function in dual-table route

### Issue: Sportsbook Odds Missing

**Symptoms:** Only `bookodds` populated, no FanDuel/DraftKings etc. **Root Cause:** Sportsbook
mapping in `byBookmaker` processing **Fix:** Verify sportsbook name mapping in odds processing

### Issue: Alternate Lines Missing

**Symptoms:** Only main lines, no alternate spreads/totals **Root Cause:** Alt lines not being
processed separately **Fix:** Check `altLines` processing in `processOddRecord`

## Expected Numbers (for validation)

For a typical day with all 9 leagues active:

- **Games:** 50-200 games total
- **Main Lines:** 150-600 odds (3 main markets per game)
- **Player Props:** 1,000-10,000 odds (varies by sport)
- **Alternate Lines:** 500-5,000 odds (multiple lines per market)
- **Sportsbook Entries:** 5,000-50,000 total (multiple books per odd)

**Total Expected:** 10,000-100,000 odds records per day

If you're seeing only 2,000-3,000 total, you're missing ~80-90% of odds.

## Next Steps

1. Run the 30-second test first
2. Identify which problem category you're in
3. Apply the specific fix for that problem type
4. Re-test with full fetch
5. Use SQL debug script for detailed analysis if needed

The debugging tools will pinpoint exactly where in the pipeline odds are being lost.
