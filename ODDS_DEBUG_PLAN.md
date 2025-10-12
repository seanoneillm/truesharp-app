# Odds Fetch System Debug & Fix Plan

## PROBLEM STATEMENT

The logs show thousands of odds found from the API, but the database only ends up with a couple
thousand rows. Many leagues and player props are missing.

## DEBUGGING PROCESS

### Phase 1: Database State Analysis (Run FIRST)

```sql
-- Run this in Supabase SQL Editor BEFORE testing
-- /Users/seanoneill/Desktop/truesharp/debug-odds-fetch-system.sql
```

### Phase 2: System Integrity Check

```sql
-- Run this to verify triggers exist and are working
-- /Users/seanoneill/Desktop/truesharp/check-triggers-function.sql
```

### Phase 3: API & Processing Debug

1. Use the admin panel debug button (Debug Odds System)
2. Or call the API directly: `POST /api/debug-odds-simple`

### Phase 4: Run Actual Odds Fetch (30 seconds)

1. Use admin panel "Fetch All Leagues (Dual Table)" button
2. Monitor console logs for detailed output

### Phase 5: Post-Fetch Analysis

```sql
-- Run debug-odds-fetch-system.sql again to see changes
```

## KEY THINGS TO CHECK

### 1. Database Triggers

- `manage_odds_duplicates()` function exists
- `manage_open_odds_duplicates()` function exists
- Both triggers are ENABLED
- Unique constraints are in place

### 2. API Response Analysis

- How many events returned from API?
- How many odds per event?
- Are all markets (ML, spread, total, player props) present?
- Are alternate lines being processed?

### 3. Data Processing Pipeline

- How many records attempted to insert?
- How many were rejected by triggers?
- Are duplicates being handled correctly?
- Are NULL line values handled properly?

### 4. Expected vs Actual Counts

For a typical MLB game, we should see:

- Main lines: ~6-10 (ML, spread, total for multiple sportsbooks)
- Player props: ~50-200 (depending on game importance)
- Alternate lines: ~20-50 (alt spreads, alt totals)
- **Total per game: 75-250+ odds**

For 20 games across all leagues = 1,500-5,000+ odds expected

## COMMON ISSUES & FIXES

### Issue 1: Triggers Not Working

```sql
-- Check trigger status
SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger
WHERE tgname LIKE '%odds_duplicates%';

-- Re-create if missing
\i database-triggers-odds-management.sql
```

### Issue 2: API Rate Limiting

- Look for 429 status codes in logs
- Increase delays between requests
- Reduce batch sizes

### Issue 3: Data Type Mismatches

- Check for odds values > 9999 (filtered out)
- Verify line values are strings, not numbers
- Check for NULL handling in unique constraints

### Issue 4: Game Status Filtering

- Games that have started are skipped
- Check game_time vs current time
- Verify status field values

### Issue 5: Duplicate Detection Logic

Current logic: duplicates = same (eventid, oddid, line)

- Moneylines: line = NULL
- Spreads/Totals: line = "1.5", "-2.5", etc.
- Player props: line varies by prop type

## EXPECTED LOG OUTPUT

### Good Fetch (what we want to see):

```
🎯 Fetching odds for MLB...
✅ MLB completed: 15 games processed, 5 games skipped (already started)
📍 Processing main line for oddId: abc123
🔄 Found 12 alternate lines for abc123 from fanduel
🔍 Attempting to insert 1,247 total records for game xyz
✅ Open odds: 1,183 records processed by triggers
✅ Current odds: 1,183 records processed by triggers
```

### Bad Fetch (what we're seeing):

```
🎯 Fetching odds for MLB...
⚠️ No odds records generated for game xyz
❌ Error inserting into odds: duplicate key violation
📊 SUMMARY: 12 games processed, 23 total odds (WAY TOO LOW)
```

## ACTION ITEMS

1. **RUN DIAGNOSTIC SQL** - Get baseline state
2. **TEST API DEBUG** - Verify API is returning data
3. **CHECK TRIGGERS** - Make sure they exist and work
4. **RUN 30-SECOND FETCH** - With detailed logging
5. **COMPARE EXPECTED vs ACTUAL** - Identify the gap
6. **FIX IDENTIFIED ISSUES** - Based on findings

## FILES INVOLVED

- `/src/app/api/fetch-odds-dual-table/route.ts` - Main fetch logic
- `/database-triggers-odds-management.sql` - Trigger definitions
- `/src/app/api/debug-odds-simple/route.ts` - Debug API
- `/debug-odds-fetch-system.sql` - Diagnostic queries
- `/test-specific-eventid.sql` - Single game testing

Run this systematic process to identify exactly where odds are being lost!
