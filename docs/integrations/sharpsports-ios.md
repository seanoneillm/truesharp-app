# SharpSports iOS Integration Guide

This document maps the web app's SharpSports implementation to iOS using the SharpSports iOS SDK.

## Web App Implementation Analysis

### Current Flow (Web)
1. **Manage Sportsbooks Button**: Located in `src/app/analytics/page.tsx:1314`
2. **Click Handler**: `handleLinkSportsbooks()` function at line 487
3. **Backend Calls**:
   - `POST /api/sharpsports/extension-auth` → Gets extension auth token
   - `GET /api/sharpsports/script-config` → Gets public key
   - `POST /api/sharpsports/context` → Gets context ID (cid)
4. **UI Flow**: Opens `https://ui.sharpsports.io/link/{cid}` in popup window
5. **Popup Monitoring**: Monitors popup close to reload accounts

### Key Endpoints Used by Web App

#### `/api/sharpsports/context` 
- **Purpose**: Generates context ID for SharpSports UI
- **Input**: `userId`, `extensionAuthToken`, `extensionVersion`, `redirectUrl`
- **Output**: `{ contextId: "ctx_xxx", success: true }`
- **API Call**: `POST https://api.sharpsports.io/v1/context`

#### `/api/sharpsports/extension-auth`
- **Purpose**: Gets extension auth tokens for browser extension
- **Input**: `userId`
- **Output**: `{ extensionAuthToken: "token_xxx", expiresAt: "..." }`
- **API Call**: `POST https://api.sharpsports.io/v1/extension/auth`

#### `/api/sharpsports/script-config`
- **Purpose**: Returns public key for extension scripts
- **Output**: `{ publicKey: "a4e27d45042947e7967146c26973bbd4a4e27d45" }`

## iOS Integration Mapping

### New Mobile Endpoint Created

#### `/api/sharpsports/mobile-auth-token`
- **Purpose**: Provides mobile auth token for iOS SDK
- **Input**: `?internalId=user_id` (query parameter)
- **Output**: `{ mobileAuthToken: "token_xxx", success: true, internalId: "..." }`
- **API Call**: `POST https://api.sharpsports.io/v1/mobile-auth`
- **Location**: `src/app/api/sharpsports/mobile-auth-token/route.ts`

### iOS Implementation Requirements

#### 1. Add SharpSports iOS SDK
```swift
// Package.swift or Xcode → Swift Package Manager
// Add: https://github.com/sgoodbets/sharpsports-spm
import SharpSportsMobile
```

#### 2. iOS AnalyticsScreen Integration
**Current**: `ios-app/src/screens/main/AnalyticsScreen.tsx:123`
```typescript
const handleManageSportsbooks = () => {
  Alert.alert(
    'Manage Sportsbooks',
    'SharpSports integration coming soon!',
    [{ text: 'OK' }]
  );
};
```

**New Implementation**: Replace with native iOS SDK flow

#### 3. iOS Flow Mapping

| Web Step | iOS Equivalent |
|----------|----------------|
| Extension auth token | Mobile auth token from `/api/sharpsports/mobile-auth-token` |
| Context generation | `SharpSportsMobile.shared.context()` |
| Open popup | Present `WKWebView` with SDK scripts |
| Monitor popup close | `SharpSportsMobileDelegate` callbacks |
| Refresh accounts | `sharpSportsMobile.refresh()` |

### Required iOS Environment Variables

The iOS app needs access to the same environment variables as the web app:
- `SHARPSPORTS_API_KEY` - Already in web app, reused by mobile endpoint
- `SHARPSPORTS_PUBLIC_KEY` - Used by iOS SDK (value: "a4e27d45042947e7967146c26973bbd4a4e27d45")

## Implementation Plan

### Phase 1: Backend (✅ Complete)
- [x] Created `/api/sharpsports/mobile-auth-token` endpoint
- [x] Reuses existing API key from web app
- [x] Handles alternative endpoints and graceful fallbacks

### Phase 2: iOS Native Integration
- [ ] Add SharpSports iOS SDK package to Xcode project
- [ ] Modify `AnalyticsScreen.tsx` to use native implementation
- [ ] Implement SDK initialization and auth token flow
- [ ] Create WebView integration with SDK scripts
- [ ] Wire refresh functionality

### Phase 3: Testing & QA
- [ ] Test token fetch from mobile endpoint
- [ ] Test SDK context generation
- [ ] Test WebView portal presentation
- [ ] Test refresh functionality with alert handling
- [ ] Verify account linking callback flow

## Key Differences: Web vs iOS

### Web Approach
- Uses browser extension + script injection
- Extension auth tokens for browser capabilities
- Popup window for UI
- Direct script manipulation

### iOS Approach  
- Uses native iOS SDK
- Mobile auth tokens for SDK capabilities
- WKWebView with SDK script injection
- Native presentation/dismissal callbacks

### Shared Components
- Same backend API endpoints (with new mobile auth endpoint)
- Same SharpSports context generation
- Same UI URL: `https://ui.sharpsports.io/link/{cid}`
- Same account linking and refresh flow

## Next Steps

1. **Add iOS SDK Package**: Install SharpSports iOS SDK via Swift Package Manager
2. **Implement Native Handler**: Replace alert placeholder with SDK implementation
3. **Configure WebView**: Set up WKWebView with SDK script injection
4. **Handle Callbacks**: Implement delegate methods for presentation/dismissal
5. **Wire Refresh**: Connect refresh button to SDK refresh methods
6. **Test Integration**: Verify end-to-end flow works as expected

## Testing Endpoints

Use these for testing the mobile flow:

```bash
# Test mobile auth token
curl -X GET "https://yourserver.com/api/sharpsports/mobile-auth-token?internalId=test-user-id"

# Expected response:
{
  "success": true,
  "mobileAuthToken": "mob_token_xxx",
  "internalId": "test-user-id"
}
```

The implementation reuses the existing web app's SharpSports integration infrastructure while adapting it for the iOS SDK's requirements.