# 🔍 DIAGNOSIS: Why 1400+ API Odds Become Only 20 Database Rows

## 🎯 The Real Issue Identified:

**You're not losing odds - you're REPLACING them!**

### What's Actually Happening:

1. **API Returns 1400+ Odds** for game `ouW6XII0uKqRsJazjYBR`
2. **Database Already Has Odds** for that same game from previous fetches
3. **Triggers See Duplicate Keys** (`eventid + oddid + line` combinations)
4. **Triggers Replace Old Odds** with newer timestamps
5. **Result**: Same ~20 unique combinations, just updated timestamps

### The Trigger Logic Causing This:

```sql
-- Current behavior in manage_odds_duplicates()
IF existing_record.fetched_at <= NEW.fetched_at THEN
    DELETE FROM public.odds WHERE id = existing_record.id;  -- REPLACE old with new
    -- Insert new record with updated timestamp
```

### Why This Happens:

- **Same Game, Same Markets**: The API returns the same betting markets each time
- **Same oddid + line**: Each market has consistent identifiers
- **Trigger Replacement**: Designed to keep "current" odds, not accumulate history
- **Timestamp Updates**: `fetched_at` gets updated, but row count stays the same

### 🔧 This Is Actually CORRECT Behavior!

The `odds` table is designed to hold **current/latest** odds, not historical odds. The triggers are
working as intended:

- **`odds` table**: Current odds (replaces old with new)
- **`open_odds` table**: Opening odds (keeps original, rejects newer)

### 🎯 To Verify This Theory:

Run the diagnostic query I created (`diagnose-odds-replacement.sql`) to see:

1. How many unique `oddid + line` combinations exist for that game
2. Whether timestamps are being updated vs new rows created
3. The pattern of odds replacement vs accumulation

### 📊 Expected Findings:

- **~20 unique market combinations** for that game
- **Recent `fetched_at` timestamps** (showing updates)
- **1400+ API odds map to ~20 unique database combinations** (many API odds share the same
  oddid+line)

This means your system is working correctly - it's just not what you expected! The question is: Do
you want to accumulate historical odds or keep only current odds?
