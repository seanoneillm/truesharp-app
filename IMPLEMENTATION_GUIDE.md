# Step-by-Step Implementation Guide for Odds Fetch Fixes

## Overview
This guide walks you through applying the comprehensive fixes to resolve missing player prop odds in your dual table odds fetch system.

## Pre-Implementation Steps

### 1. Backup Current State
```bash
# Create backup of current odds counts
psql -d your_database -f verify-odds-fetch-fixes.sql > baseline_results.txt
```

### 2. Document Current Issues
- Note down current player prop counts from both tables
- Save sample of current log output from odds fetch
- Record any specific missing odds types you've observed

## Implementation Steps

### Step 1: Apply Database Trigger Fixes
**Duration**: 5 minutes
**Downtime**: None (triggers update instantly)

```bash
# Apply the corrected trigger functions
psql -d your_database -f fix-database-triggers-comprehensive.sql
```

**Verification**:
```sql
-- Check triggers are active
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table IN ('odds', 'open_odds');
```

### Step 2: Deploy Updated Fetch Function  
**Duration**: 2 minutes
**Downtime**: None

The fetch function has already been updated in:
- `/src/app/api/fetch-odds-dual-table/route.ts`

Key changes made:
- ✅ Removed manual duplicate filtering
- ✅ Added proper line value normalization  
- ✅ Enhanced logging for debugging
- ✅ Let database triggers handle ALL duplicate logic

**Verification**: 
- Check that the `normalizeLineValue` function exists
- Confirm `saveOddsDataWithDualTables` no longer has manual filtering

### Step 3: Test Small Scale
**Duration**: 10 minutes

1. **Test triggers manually**:
```sql
-- Run trigger test section from verify-odds-fetch-fixes.sql
```

2. **Test fetch on limited data**:
   - Go to admin page
   - Run odds fetch 
   - Monitor logs for new detailed output
   - Check for "CRITICAL FIX" and "📊 Odds breakdown" log messages

### Step 4: Full Production Test
**Duration**: 15 minutes

1. **Run complete odds fetch**:
   - Use admin page button to trigger full fetch
   - Monitor application logs closely
   - Look for player prop counts in new breakdown logs

2. **Verify results**:
```bash
psql -d your_database -f verify-odds-fetch-fixes.sql > after_fix_results.txt
```

## Expected Results

### Before Fixes
- Few or no player prop odds
- Logs showing high "deduplicated" counts
- Records being filtered out by manual duplicate checking

### After Fixes  
- Significant increase in player prop odds
- Logs showing "records processed by triggers" 
- "📊 Odds breakdown" showing player prop counts
- Trigger notices in database logs (if enabled)

### Specific Log Changes
**OLD LOGS**:
```
🔍 Deduplicated X database constraint duplicates
📊 Attempting to upsert Y deduplicated records
```

**NEW LOGS**:
```
📊 Odds breakdown - Main lines: X, Alt lines: Y, Player props: Z
✅ Open odds: N records processed by triggers
✅ Current odds: M records processed by triggers  
```

## Troubleshooting

### Issue: Still Missing Player Props
**Causes**: 
- API not returning player props for selected leagues
- Player props being filtered at API level

**Debug**:
```sql
-- Check if ANY player props exist
SELECT COUNT(*) FROM odds WHERE marketname ILIKE '%player%' OR bettypeid ILIKE '%player%';

-- Check raw API response structure in logs
```

### Issue: Constraint Violations
**Symptoms**: Error messages about duplicate keys
**Solution**: 
```sql
-- Check for existing constraint conflicts
SELECT eventid, oddid, line, COUNT(*) 
FROM odds 
GROUP BY eventid, oddid, line 
HAVING COUNT(*) > 1;
```

### Issue: Trigger Performance
**Symptoms**: Slow fetch operations
**Solution**:
```sql
-- Disable trigger logging
-- Change RAISE NOTICE to RAISE DEBUG in trigger functions
```

## Monitoring and Validation

### Daily Checks (Post-Implementation)
1. **Verify player prop counts remain stable**:
```sql
SELECT COUNT(*) FROM odds WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%';
```

2. **Check for any constraint violations**:
```sql
SELECT COUNT(*) FROM information_schema.check_constraints WHERE constraint_name LIKE '%odds%';
```

3. **Monitor fetch performance**:
   - Time taken for full fetch
   - Number of records processed
   - Any error rates

### Weekly Reviews
- Compare odds counts week-over-week
- Review any new missing odds types
- Check database trigger performance

## Rollback Plan

If issues occur, you can rollback by:

1. **Restore original trigger functions**:
```sql
-- Use the original database-triggers-odds-management.sql
-- But you'll need to fix the <= vs < issue manually
```

2. **Restore original fetch logic**:
   - Revert the changes to `saveOddsDataWithDualTables`
   - Keep the manual duplicate filtering

3. **Clear problematic data**:
```sql
-- If needed, clear recent fetches and re-run
DELETE FROM odds WHERE fetched_at > 'YYYY-MM-DD HH:MM:SS';
DELETE FROM open_odds WHERE fetched_at > 'YYYY-MM-DD HH:MM:SS';
```

## Success Metrics

### Quantitative
- **Player prop increase**: 5x-10x more player prop odds
- **Total odds increase**: 20-50% more total odds records
- **Error reduction**: Fewer "duplicate" error messages in logs

### Qualitative  
- Clean, informative logs showing breakdown by odds type
- No more manual duplicate filtering conflicts
- Proper historical data preservation in open_odds table

## Next Steps

After successful implementation:
1. **Monitor for 1 week** to ensure stability
2. **Document any new patterns** in player prop availability
3. **Consider expanding** to additional sportsbook sources
4. **Review performance** and optimize if needed

---

**Questions or Issues?**
- Check the verification SQL results
- Review application logs for specific error messages
- Compare before/after odds counts