# Comprehensive Odds Fetch Debug & Fix Report

## Issues Identified

### 1. **MAJOR: Double Filtering Logic Conflict**
- **Problem**: Fetch function pre-filters records before insert, but triggers also filter during insert
- **Impact**: Player props and other odds getting excluded by double-filtering
- **Location**: `fetch-odds-dual-table/route.ts` lines 333-364

### 2. **CRITICAL: Wrong Trigger Logic for open_odds**
- **Problem**: Uses `<=` instead of `<` for timestamp comparison
- **Impact**: Records with same timestamp get rejected instead of preserving oldest
- **Location**: `database-triggers-odds-management.sql` line 30

### 3. **CONSTRAINT CONFLICT: Duplicate Unique Constraints**
- **Problem**: Both full `(eventid, oddid, line)` and partial `(eventid, oddid) WHERE line IS NULL` constraints exist
- **Impact**: Potential constraint violations and confusion
- **Location**: Table definitions

### 4. **DATA INCONSISTENCY: Line Value Normalization**
- **Problem**: Inconsistent handling of NULL vs 'null' string vs undefined
- **Impact**: Incorrect duplicate detection
- **Location**: Multiple locations in fetch logic

## Root Cause Analysis

The system was designed with triggers to handle ALL duplicate logic, but the fetch function still contains manual duplicate checking from before triggers existed. This creates a "double jeopardy" situation where odds can be filtered out twice:

1. First by fetch logic (lines 351-354)
2. Then by database triggers

Player props are particularly affected because they often have NULL lines and complex market structures.

## Comprehensive Fixes

### Fix 1: Remove Manual Duplicate Logic from Fetch Function
### Fix 2: Correct Trigger Timestamp Logic  
### Fix 3: Simplify Database Constraints
### Fix 4: Standardize Line Value Handling
### Fix 5: Add Comprehensive Logging for Debugging

See individual fix files for implementation details.

## Testing Strategy

1. **Before fixes**: Count existing odds by type
2. **Apply fixes**: Run database updates and deploy new fetch logic
3. **Test fetch**: Run odds fetch and monitor logs
4. **Verify results**: Compare odds counts and check for missing player props
5. **Performance check**: Ensure triggers perform well under load

## Expected Outcomes

After fixes:
- All player props should appear in tables
- No more double-filtering of odds
- Proper timestamp-based duplicate handling
- Consistent line value normalization
- Better logging for future debugging