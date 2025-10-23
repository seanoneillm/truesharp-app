# Clean Admin Controls Components

This directory contains the cleaned and streamlined admin controls for essential system operations.

## Components

### `CleanControlsTab`
A clean, organized interface for the three core admin functions without debug clutter.

**Features:**
- **Odds Management**: Fetch current odds from all supported leagues
- **Bet Settlement**: Process completed games and settle pending bets  
- **SharpSports Integration**: Sync bettors, match profiles, and refresh user bets
- Clean error handling with visual feedback
- Proper loading states and result displays
- Responsive design optimized for admin workflows

## Core Functions

### 1. Odds Management
- Fetches odds from all 9 supported leagues (MLB, NBA, WNBA, NFL, NHL, NCAAF, NCAAB, MLS, UCL)
- Uses dual-table strategy for comprehensive data coverage
- Real-time feedback with success/error indicators

**API Endpoint:** `/api/fetch-odds-dual-table`

### 2. Bet Settlement
- Processes completed games from yesterday and today
- Updates bet statuses based on game results
- Automatic profit/loss calculations

**API Endpoint:** `/api/settle-bets`

### 3. SharpSports Integration
Three-step sync process:

#### Step 1: Sync Bettors
- Fetches all bettors from SharpSports API
- **API:** `/api/sharpsports/fetch-accounts`

#### Step 2: Match Profiles  
- Matches SharpSports bettor profiles to platform users
- **API:** `/api/sharpsports/fetch-bettor-profiles`

#### Step 3: Refresh User Bets
- Updates bet data for a specific user ID
- **API:** `/api/sharpsports/refresh-user-bets`

## UI Improvements

### Removed Clutter
- ❌ Debug functions and verbose logging
- ❌ Unnecessary explanatory text  
- ❌ Redundant state displays
- ❌ Complex cooldown timers

### Enhanced UX
- ✅ Clean card-based layout
- ✅ Consistent visual feedback
- ✅ Clear action buttons with loading states
- ✅ Grouped related functions logically
- ✅ Improved mobile responsiveness

## Usage

```tsx
import { CleanControlsTab } from '@/components/admin/controls'

function AdminPage() {
  return (
    <TabsContent value="controls">
      <CleanControlsTab />
    </TabsContent>
  )
}
```

## Key Benefits

1. **Simplified Interface**: Focus on essential functions only
2. **Better Organization**: Logical grouping of related operations  
3. **Improved Reliability**: Consistent error handling and feedback
4. **Mobile Friendly**: Responsive design for various screen sizes
5. **Maintainable**: Clean code without legacy debugging functions

The cleaned controls tab maintains all essential functionality while providing a much more professional and streamlined admin experience.