# Pro Status Synchronization Logic

## Overview
This document explains the updated pro status synchronization logic that preserves manual pro assignments while preventing race conditions between Stripe and Apple subscription webhooks.

## Decision Matrix

| Scenario | Active Stripe | Active Apple | Any Subscriptions | Current Pro | Action | Result |
|----------|:-------------:|:------------:|:----------------:|:-----------:|:------:|:------:|
| Active subscription | ✅ | ❌ | ✅ | any | Update | `pro = 'yes'` |
| Active subscription | ❌ | ✅ | ✅ | any | Update | `pro = 'yes'` |
| Both active | ✅ | ✅ | ✅ | any | Update | `pro = 'yes'` |
| Expired subs only | ❌ | ❌ | ✅ | `'yes'` | Update | `pro = 'no'` |
| Expired subs only | ❌ | ❌ | ✅ | `'no'` | None | `pro = 'no'` |
| No subscriptions | ❌ | ❌ | ❌ | `'yes'` | **Preserve** | `pro = 'yes'` |
| No subscriptions | ❌ | ❌ | ❌ | `'no'` | **Preserve** | `pro = 'no'` |

## Key Features

### 1. Manual Assignment Preservation
- Users with `pro = 'yes'` and **NO subscriptions** are considered manual assignments
- These statuses are preserved regardless of webhook events
- Useful for comps, testing, or special access grants

### 2. Cross-Platform Compatibility
- Checks **both** Stripe and Apple subscriptions before updating status
- Prevents race conditions where one expired subscription removes pro status despite active subscription on other platform

### 3. Comprehensive Sync Function
```sql
-- Returns: 'yes', 'no', or 'preserve'
should_user_have_pro_status(user_id)

-- Safely updates pro status with detailed logging
sync_user_pro_status(user_id)
```

### 4. Audit Trail
- All pro status changes are logged to `pro_status_audit` table
- Includes reason, subscription context, and change source

## Usage Examples

### Webhook Integration
```typescript
// OLD (problematic) - direct update
await supabase
  .from('profiles')
  .update({ pro: 'no' })
  .eq('id', userId)

// NEW (safe) - centralized sync
const { data: syncResult, error: syncError } = await supabase
  .rpc('sync_user_pro_status', { p_user_id: userId })
```

### Admin Tools
```bash
# Check for inconsistencies
GET /api/admin/sync-pro-status

# Dry run fix
POST /api/admin/sync-pro-status
{ "syncAll": true, "dryRun": true }

# Apply fixes
POST /api/admin/sync-pro-status
{ "syncAll": true }
```

### Validation Script
```bash
node validate-pro-status-fix.js
```

## Database Functions

### Core Functions
- `should_user_have_pro_status(UUID)` - Returns sync decision
- `sync_user_pro_status(UUID)` - Safely updates single user
- `fix_all_pro_status_inconsistencies()` - Batch fix all users

### Audit Functions
- `log_pro_status_change()` - Manual audit logging
- Auto-trigger on profile updates

## Manual Assignment Workflow

1. **Grant manual pro access:**
   ```sql
   UPDATE profiles SET pro = 'yes' WHERE id = 'user-id';
   ```

2. **Status is preserved:**
   - User has no subscriptions → `sync_user_pro_status()` returns 'preserve'
   - Webhooks won't override manual assignment

3. **Later subscription:**
   - User subscribes → status remains 'yes' (subscription reinforces manual grant)
   - User's subscription expires → status reverts to 'no' (manual grant overridden by subscription logic)

## Migration Notes

### Files Modified
- `src/app/api/webhooks/stripe/route.ts` - Uses centralized sync
- `src/app/api/apple-webhooks/route.ts` - Uses centralized sync + service role

### Files Added
- `fix-pro-status-sync.sql` - Database functions
- `src/app/api/admin/sync-pro-status/route.ts` - Admin management API
- `validate-pro-status-fix.js` - Validation tools

### Deployment Steps
1. Run `fix-pro-status-sync.sql` in Supabase SQL editor
2. Deploy updated webhook code
3. Run validation: `node validate-pro-status-fix.js`
4. Fix any existing inconsistencies via admin API

## Troubleshooting

### Common Issues
1. **User has active subscription but pro='no'**
   - Cause: Race condition from old webhook logic
   - Fix: Run `sync_user_pro_status(user_id)`

2. **Manual assignment overridden**
   - Check: Does user have any subscription records?
   - If yes: Subscription logic takes precedence
   - If no: Should be preserved (check for bugs)

3. **Webhook errors**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check function permissions in Supabase

### Monitoring
- Monitor `pro_status_audit` table for unexpected changes
- Set up alerts for frequent status flips
- Regular validation runs via admin API