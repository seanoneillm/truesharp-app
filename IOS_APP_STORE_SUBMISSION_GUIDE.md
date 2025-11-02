# 🚀 iOS App Store Submission Checklist

## ✅ Pre-Submission Verification

### App Configuration ✅

- [x] App name: "TrueSharp"
- [x] Bundle ID: `com.truesharp.app`
- [x] Version: 1.0.5
- [x] ASC App ID: 6753960332
- [x] EAS Project ID: b7fcc6cf-493b-4dc7-b4f0-9fb352129b01

### Technical Requirements ✅

- [x] iOS deployment target: 15.1+
- [x] Production environment configured
- [x] StoreKit subscription implementation
- [x] Associated domains configured
- [x] Privacy descriptions in Info.plist

### App Store Connect Requirements

Before building, ensure these are complete:

#### 🏢 Business Setup

- [ ] **Paid Apps Agreement** signed
- [ ] **Banking information** complete
- [ ] **Tax information** complete
- [ ] **Contact information** up to date

#### 📱 App Store Listing

- [ ] **App screenshots** (6.7", 6.5", 5.5" displays)
- [ ] **App description** written
- [ ] **Keywords** selected
- [ ] **Category** selected (Finance or Utilities)
- [ ] **Age rating** completed
- [ ] **Privacy policy URL** set
- [ ] **Support URL** set

#### 💰 In-App Purchases

- [ ] **Subscription products** created and approved:
  - [ ] `pro_subscription_month`
  - [ ] `pro_subscription_year`
- [ ] **Shared secret** generated and configured
- [ ] **App-Specific Shared Secret** noted for server

## 📋 Submission Steps

### Step 1: Build for Production

```bash
cd ios-app
npx eas build --platform ios --profile production
```

### Step 2: Submit to App Store

```bash
npx eas submit --platform ios --profile production
```

### Step 3: Configure in App Store Connect

- Upload build metadata
- Set release options
- Submit for review

## 🔍 Critical Checks Before Submission

### StoreKit Integration ✅

- [x] Receipt validation endpoint deployed
- [x] Database schema updated with subscription tracking
- [x] Production-first validation with sandbox fallback
- [x] Proper transaction finishing after server validation

### App Store Guidelines Compliance ✅

- [x] Subscription modal redesigned (Guideline 3.1.1 compliant)
- [x] No purchase-like language in modals
- [x] External website links via Safari
- [x] Clear subscription terms and pricing

### Privacy & Legal ✅

- [x] Privacy policy accessible
- [x] Terms of service accessible
- [x] Gambling help resources linked
- [x] Proper camera/photo permissions

## 🚨 Known Issues to Address

### Sport Normalization

- [ ] **URGENT**: College basketball strategy creation (NCAAB/NCAAM/NCAAMB)
- [ ] Test strategy creation with sample data before submission

## 📞 Support Information

### Required URLs

- **Privacy Policy**: https://truesharp.io/privacy
- **Support URL**: https://truesharp.io/support
- **Gambling Help**: https://www.ncpgambling.org

### Contact Information

- **App Store Connect Team**: seanoneill715
- **Bundle ID**: com.truesharp.app
- **SKU**: truesharp-ios-app

## 🎯 Next Steps

1. **Verify App Store Connect setup** (agreements, banking, products)
2. **Create screenshots and metadata**
3. **Build production version**
4. **Submit for review**
5. **Monitor review status**

## 📱 Testing Before Submission

### Final Test Checklist

- [ ] Login/registration flow
- [ ] Subscription purchase flow (TestFlight)
- [ ] Strategy creation and viewing
- [ ] Analytics and filtering
- [ ] Settings and profile management
- [ ] Terms/privacy links work
- [ ] App handles network errors gracefully
