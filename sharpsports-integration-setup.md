# SharpSports Integration Setup Guide

## Overview

This integration allows users to link their sportsbook accounts via SharpSports BetSync and
automatically sync their betting data.

## Environment Variables

Add this to your `.env.local` file:

```env
# SharpSports API Configuration
SHARPSPORTS_API_KEY=your_sharpsports_sandbox_api_key_here
NODE_ENV=development  # Use 'production' for live environment
```

## Sandbox vs Production URLs

### Development/Sandbox (NODE_ENV=development):

- **Booklink UI**: `https://sandbox-booklink.sharpsports.io`
- **API Base**: `https://sandbox-api.sharpsports.io`
- **Your ngrok URL**: `https://ddb528ce02c4.ngrok-free.app`
- **Webhook URL**: `https://ddb528ce02c4.ngrok-free.app/api/sharpsports/webhook`
- **Callback URL**: `https://ddb528ce02c4.ngrok-free.app/api/sharpsports/accounts`

### Production (NODE_ENV=production):

- **Booklink UI**: `https://booklink.sharpsports.io`
- **API Base**: `https://api.sharpsports.io`
- **Webhook URL**: `https://yourdomain.com/api/sharpsports/webhook`

## Database Schema

The integration requires the `bettor_account` table (already created based on your schema) and uses
the existing `bets` table with the `external_bet_id` column for upserts.

## Webhook Configuration

Configure SharpSports to send webhooks to:

- Production: `https://yourdomain.com/api/sharpsports/webhook`
- Development: `https://your-ngrok-url.com/api/sharpsports/webhook`

Required webhook events:

- `refreshResponse.created`
- `bettorAccount.verified`

## API Endpoints Created

### 1. `/api/sharpsports/accounts`

- **GET**: Fetch linked bettor accounts for a user
- **POST**: Store new linked bettor account from Booklink UI

### 2. `/api/sharpsports/refresh`

- **POST**: Trigger refresh for all linked accounts
- Calls SharpSports API to initiate refresh
- Returns immediately; actual sync happens via webhook

### 3. `/api/sharpsports/sync`

- **POST**: Manual sync for testing/development
- Directly fetches and processes betSlips
- Use for testing without waiting for webhooks

### 4. `/api/sharpsports/webhook`

- **POST**: Handle SharpSports webhooks
- Processes `refreshResponse.created` and `bettorAccount.verified` events
- Automatically syncs betSlips when refresh completes

## Frontend Integration

### Analytics Page

The SharpSportsIntegration component has been added to the Analytics page with:

- **Link Sportsbooks**: Opens Booklink UI popup/iframe
- **Refresh Accounts**: Triggers account refresh via API
- **Account Status**: Shows linked and verified accounts
- **Manual Sync** (dev only): Direct sync for testing

### Component Features

- Real-time account status display
- Error handling and loading states
- Automatic account refresh after linking
- Development/testing manual sync button

## Data Mapping

SharpSports betSlips are mapped to your `bets` table as follows:

| SharpSports Field               | Your Column        | Notes                              |
| ------------------------------- | ------------------ | ---------------------------------- |
| `betSlip.id` or `bet.id`        | `external_bet_id`  | Stable identifier for upserts      |
| `event.sport`                   | `sport`            | Normalized sport name              |
| `event.league`                  | `league`           | League/competition name            |
| `proposition`                   | `bet_type`         | spread/total/moneyline/player_prop |
| `bookDescription`               | `bet_description`  | Human readable description         |
| `oddsAmerican`                  | `odds`             | American odds format               |
| `atRisk`                        | `stake`            | Amount wagered                     |
| `atRisk + toWin`                | `potential_payout` | Total potential return             |
| `status`                        | `status`           | pending/won/lost/cancelled/void    |
| `timePlaced`                    | `placed_at`        | When bet was placed                |
| `dateClosed`                    | `settled_at`       | When bet was settled               |
| `event.startTime`               | `game_date`        | Game/event start time              |
| `event.contestantHome.fullName` | `home_team`        | Home team name                     |
| `event.contestantAway.fullName` | `away_team`        | Away team name                     |
| `position`                      | `side`             | over/under/home/away               |
| `line`                          | `line_value`       | Point spread or total line         |
| `book.name`                     | `sportsbook`       | Sportsbook name                    |
| Calculated                      | `profit`           | Actual profit/loss when settled    |

## Parlay Handling

- Multi-bet betSlips are treated as parlays
- Each leg gets its own row in `bets` table
- Shared `parlay_id` links all legs together
- `external_bet_id` format: `{betSlipId}-{betId}` for parlay legs

## Error Handling

- All API endpoints include comprehensive error logging
- Frontend shows user-friendly error messages
- Webhook failures are logged but don't break the flow
- Upsert logic prevents duplicate bets

## Testing

1. Use the manual sync endpoint for immediate testing
2. Check webhook delivery in SharpSports dashboard
3. Monitor logs for sync progress and errors
4. Verify bet data appears correctly in analytics

## Security Notes

- All endpoints support service role fallback authentication
- Webhook endpoint uses service role for database access
- API key is server-side only
- User data is properly isolated by user_id

## Next Steps

1. Add your SharpSports API key to environment variables
2. Configure webhook URLs in SharpSports dashboard
3. Test the integration with linked test accounts
4. Monitor logs during initial rollout
