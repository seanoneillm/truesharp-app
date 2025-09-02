# TrueSharp Odds Fetcher

A comprehensive Node.js system to fetch, normalize, and insert odds data from the Sports Game Odds
API into Supabase.

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains:

   ```bash
   NEXT_PUBLIC_ODDS_API_KEY=your_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies**: Install dependencies (if not already done):
   ```bash
   cd scripts/odds-fetcher
   npm install
   ```

### Test Mode (Safe - Logs Only)

```bash
# Test MLB data fetching (default)
npm run test

# Test specific league with verbose output
node main.js --test --league NFL --verbose --start 2025-08-15 --end 2025-08-16
```

### Production Mode (Inserts to Database)

```bash
# Fetch and insert MLB data
npm run fetch-mlb

# Fetch specific date range for NBA
node main.js --insert --league NBA --start 2025-08-15 --end 2025-08-16

# Fetch with verbose logging
node main.js --insert --league NFL --verbose
```

## 📊 System Architecture

### Core Components

1. **`api-client.js`** - Handles API fetching with pagination and error handling
2. **`data-normalizer.js`** - Normalizes API data to match database schema
3. **`database-client.js`** - Manages Supabase insertion with upsert logic
4. **`main.js`** - Orchestrates the entire process

### Data Flow

```
Sports Game Odds API → Fetch → Normalize → Insert/Log → Supabase
```

## 🎯 Features

### API Fetching

- ✅ Full pagination support (handles cursor-based pagination)
- ✅ Exponential backoff retry logic
- ✅ Rate limiting handling
- ✅ Support for MLB, NFL, NBA, NHL
- ✅ Configurable date ranges

### Data Normalization

- ✅ Converts API format to database schema
- ✅ Handles null values properly
- ✅ Maps team names and IDs consistently
- ✅ Tracks oddID entries (max 2 per oddID)

### Database Operations

- ✅ Upsert logic for games (prevents duplicates)
- ✅ Smart odds insertion (first entry kept, second overwritten)
- ✅ Transaction-like batch operations
- ✅ Database connection testing

### Modes

- ✅ **Test Mode**: Safe logging-only mode for verification
- ✅ **Insert Mode**: Production mode that saves to database
- ✅ **Verbose Mode**: Detailed logging and sample data display

## 📋 CLI Usage

### Command Line Options

```bash
node main.js [options]

Options:
  --test, -t      Run in test mode (default, logs only)
  --insert, -i    Run in insert mode (saves to database)
  --verbose, -v   Enable verbose logging
  --league, -l    League to fetch (MLB, NFL, NBA, NHL) [default: MLB]
  --start, -s     Start date (YYYY-MM-DD) [default: 2025-08-14]
  --end, -e       End date (YYYY-MM-DD) [default: 2025-08-15]
  --help, -h      Show help message
```

### Examples

```bash
# Test MLB for specific dates
node main.js --test --league MLB --start 2025-08-14 --end 2025-08-15

# Insert NFL data with verbose logging
node main.js --insert --league NFL --verbose

# Quick test of current system
npm run test

# Production fetch for different leagues
npm run fetch-mlb
npm run fetch-nfl
npm run fetch-nba
npm run fetch-nhl
```

## 🗃️ Database Schema

### Games Table

```sql
sport TEXT           -- 'baseball', 'football', etc.
home_team TEXT       -- team_key format (lowercase_underscore)
away_team TEXT       -- team_key format (lowercase_underscore)
home_team_name TEXT  -- full team name
away_team_name TEXT  -- full team name
game_time TIMESTAMPTZ-- game start time
status TEXT          -- 'scheduled', 'live', 'final', etc.
home_score INT       -- null for future games
away_score INT       -- null for future games
id VARCHAR(100)      -- Sports Game Odds eventID
league VARCHAR(50)   -- 'MLB', 'NFL', etc.
```

### Odds Table

```sql
game_id              -- foreign key to games.id
odd_id               -- Sports Game Odds oddID
market_name          -- API market name
bet_type_id          -- API bet type (ml, sp, ou, etc.)
side_id              -- API side (home, away, over, under)
sportsbook_id        -- API sportsbook identifier
book_odds            -- odds value from API
book_spread          -- spread value (if applicable)
book_over_under      -- total value (if applicable)
timestamp            -- when odds were fetched
raw_data             -- full API response for debugging
```

## 🔧 Configuration

### Supported Leagues

- **MLB** - Major League Baseball
- **NFL** - National Football League
- **NBA** - National Basketball Association
- **NHL** - National Hockey League

### Date Format

- Use ISO date format: `YYYY-MM-DD`
- Example: `2025-08-14`

### Environment Variables

```bash
# Required
NEXT_PUBLIC_ODDS_API_KEY=your_sportsgameodds_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NODE_ENV=development
```

## 🚦 Error Handling

### API Errors

- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Issues**: Multiple retry attempts
- **Server Errors**: Graceful degradation
- **Invalid Responses**: Skip and continue processing

### Database Errors

- **Connection Issues**: Early detection and clear error messages
- **Constraint Violations**: Logged but processing continues
- **Transaction Failures**: Atomic rollback

### Data Validation

- **Missing Fields**: Default values or null handling
- **Invalid Dates**: Fallback to current timestamp
- **Malformed Data**: Skip invalid entries, log warnings

## 📊 Output Examples

### Test Mode Output

```
🎯 Starting odds fetching process...
📅 League: MLB, Period: 2025-08-14 to 2025-08-15
🔧 Mode: TEST (logging only)

📡 Fetching events from Sports Game Odds API...
✅ Page 1: Retrieved 8 events
🎯 Total events fetched: 8 across 1 pages

🔄 Normalizing data...
📋 Normalized game: ha1jpK3tnMWk0GbJsa13 - Los Angeles Dodgers @ Los Angeles Angels
📊 Normalized 744 odds entries for game ha1jpK3tnMWk0GbJsa13

📋 PROCESSING SUMMARY
────────────────────────────────────────
📥 Raw events fetched: 8
🎮 Games normalized: 8
📊 Odds entries normalized: 5076

🧪 TEST MODE: Data normalized successfully, skipping database insert
🏁 Process completed in 3.60 seconds
📊 Final Status: ✅ SUCCESS
```

### Insert Mode Output

```
🎯 Starting odds fetching process...
🔧 Mode: INSERT (will save to database)

🔍 Testing database connection...
✅ Database connection verified

📡 Fetching events from Sports Game Odds API...
💾 Upserting 8 games...
✅ Successfully upserted 8 games

💾 Processing 5076 odds entries...
✅ Successfully processed all odds data

🎉 Batch upsert completed successfully!
📊 Summary: 8 games, 5076 odds entries

📊 DATABASE SUMMARY
────────────────────────────────────────
🎮 Recent games in database: 3
📈 Recent odds in database: 5
```

## 🛠️ Maintenance

### Cleanup Old Data

The system includes a cleanup function to remove old data:

```javascript
import { SupabaseClient } from './database-client.js'

const dbClient = new SupabaseClient()
// Remove data older than 30 days
await dbClient.cleanupOldData(30)
```

### Monitor Database Size

Check recent insertions:

```javascript
const recentGames = await dbClient.getRecentGames(10)
const recentOdds = await dbClient.getRecentOdds(20)
```

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check `.env.local` has `NEXT_PUBLIC_ODDS_API_KEY`
   - Verify the key is valid and not expired

2. **"Database connection failed"**
   - Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Verify Supabase project is active
   - Check database tables exist

3. **"No events retrieved"**
   - Verify date range has games scheduled
   - Check API rate limits
   - Try different league/date combination

4. **"Rate limit exceeded"**
   - Wait and retry
   - Reduce frequency of API calls
   - Check API plan limits

### Debug Mode

Run with verbose logging to see detailed information:

```bash
node main.js --test --verbose --league MLB
```

## 📈 Performance

### Benchmarks

- **8 MLB games**: ~3.6 seconds (test mode)
- **5,076 odds entries**: Processed in same timeframe
- **Database insertion**: Additional ~2-3 seconds

### Optimization Tips

- Use test mode first to validate data
- Run during off-peak hours for better API response
- Consider rate limiting for large date ranges
- Use cleanup function periodically to manage database size

## 🔄 Integration with TrueSharp

This odds fetcher integrates seamlessly with the existing TrueSharp codebase:

- **Database Schema**: Matches existing `games` and `odds` tables
- **Supabase Client**: Uses same configuration as main app
- **Environment**: Shares `.env.local` configuration
- **API Integration**: Can be triggered from existing API routes

### Automated Execution

Consider setting up cron jobs or scheduled functions to run this automatically:

```bash
# Daily MLB fetch at 6 AM
0 6 * * * cd /path/to/truesharp/scripts/odds-fetcher && npm run fetch-mlb

# Test run every hour during season
0 * * * * cd /path/to/truesharp/scripts/odds-fetcher && npm run test
```
