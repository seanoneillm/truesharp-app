# Seller Profile Implementation Test Plan

## Setup Required
1. **Run the SQL Migration:**
   ```sql
   -- Execute the SQL in create-seller-profiles-table.sql in your Supabase console
   ```

2. **Verify Supabase Storage:**
   - Ensure the 'images' bucket exists in Supabase Storage
   - Verify RLS policies allow authenticated users to upload

## Testing Steps

### 1. Test API Endpoints
```bash
# Test getting seller profile (replace 'username' with actual username)
curl "http://localhost:3000/api/seller-profile?username=testuser"
```

### 2. Test Seller Profile Page
1. Navigate to `/marketplace/[username]` where username is a valid seller
2. Verify the page displays:
   - Profile header with banner and profile image
   - Bio text (if available)
   - Strategy cards using the existing StrategyCard component
   - Copy Profile Link button
   - Subscribe buttons with authentication check

### 3. Test Profile Editor
1. **From Sell Page:**
   - Go to `/sell`
   - Click "Customize Profile" button in header
   - Modal should open

2. **From Topbar Menu:**
   - Click user profile dropdown
   - Click "Customize Seller Profile"
   - Modal should open

3. **In Modal:**
   - Upload profile image (test file size/type validation)
   - Upload banner image
   - Enter bio text (test 500 char limit)
   - Save profile
   - Verify data persists

### 4. Test Authentication Flow
1. **Not Logged In:**
   - Visit seller profile page
   - Click subscribe button
   - Should redirect to login

2. **Logged In:**
   - Visit seller profile page
   - Click subscribe button
   - Should open subscription modal

## Expected Behavior

### Seller Profile Page (`/marketplace/[username]`)
- ✅ Clean, professional layout
- ✅ Banner image (gray default if none)
- ✅ Circle profile photo (avatar default if none)
- ✅ Username display
- ✅ Bio text (blank if none)
- ✅ Strategy cards in grid format
- ✅ Copy Profile Link functionality
- ✅ Subscribe buttons with auth check

### Profile Editor
- ✅ Modal opens from Sell page and Topbar
- ✅ Image upload with validation (5MB, JPEG/PNG/WebP)
- ✅ Bio text area with character limit
- ✅ Save/Cancel functionality
- ✅ Loading states during upload/save

### API Endpoints
- ✅ GET `/api/seller-profile?username=X` - Fetch seller data
- ✅ POST `/api/seller-profile` - Update seller profile
- ✅ POST `/api/seller-profile/upload-image` - Upload images

## Files Created/Modified

### New Files:
- `create-seller-profiles-table.sql` - Database migration
- `src/app/api/seller-profile/route.ts` - Main API endpoint
- `src/app/api/seller-profile/upload-image/route.ts` - Image upload
- `src/components/seller/seller-profile-editor.tsx` - Profile editor modal
- `src/components/ui/label.tsx` - Label component

### Modified Files:
- `src/app/marketplace/[username]/page.tsx` - Complete rewrite for new design
- `src/app/sell/page.tsx` - Added Customize Profile button
- `src/components/layout/user-profile-menu.tsx` - Added profile menu item
- `src/components/ui/dialog.tsx` - Added DialogDescription component

## Database Schema
The `seller_profiles` table stores customization data:
- `user_id` (FK to profiles.id) - Owner of the profile
- `bio` - Custom bio text
- `profile_img` - URL to profile image in Supabase Storage
- `banner_img` - URL to banner image in Supabase Storage
- `updated_at` - Last modified timestamp

## Future Enhancements
- Image cropping/resizing on upload
- More banner templates
- Social media links
- Profile themes
- Analytics integration