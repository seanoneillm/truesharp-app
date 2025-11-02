# TrueSharp iOS Subscription Testing Plan

## **Testing Environment Setup**

### 1. StoreKit Testing File

- Location: `ios-app/TrueSharp.storekit`
- Products configured: `pro_subscription_month`, `pro_subscription_year`
- Use in Xcode Simulator for local testing

### 2. Sandbox Testing

- Create sandbox Apple ID in App Store Connect
- Use TestFlight builds for device testing
- Test both production and sandbox receipt validation

## **Test Scenarios**

### **Scenario 1: Happy Path Purchase**

**Environment**: Xcode Simulator with StoreKit testing file **Steps**:

1. Launch app in Xcode Simulator
2. Navigate to subscription screen
3. Select monthly subscription
4. Complete purchase flow
5. Verify success message appears
6. Check database for subscription record
7. Verify profile.pro = 'yes'

**Expected Results**:

- Purchase completes in ~2-5 seconds
- Success message shows validation info
- Database contains correct subscription data
- Receipt validation status = 'validated'

### **Scenario 2: Sandbox Receipt Delays**

**Environment**: TestFlight build on device with sandbox Apple ID **Steps**:

1. Install TestFlight build
2. Sign in with sandbox Apple ID
3. Attempt purchase
4. Monitor for timeout handling
5. Try restore purchases after 2-3 minutes

**Expected Results**:

- App shows "Completing purchase - verifying with App Store..."
- If timeout occurs, shows guidance about restore
- Eventually succeeds via restore or retry
- No false success messages

### **Scenario 3: Network Failure During Validation**

**Environment**: Device with poor network connection **Steps**:

1. Start purchase on good connection
2. Disable WiFi during receipt validation
3. Re-enable connection
4. Observe retry behavior

**Expected Results**:

- App retries validation with exponential backoff
- Shows appropriate loading messages
- Eventually succeeds or fails gracefully
- No crashes or silent failures

### **Scenario 4: Duplicate Purchase Prevention**

**Environment**: Any **Steps**:

1. Complete successful purchase
2. Attempt same purchase again
3. Verify duplicate handling

**Expected Results**:

- System recognizes existing subscription
- Returns appropriate message
- No duplicate database records

### **Scenario 5: Apple Receipt Validation Errors**

**Environment**: Simulator with StoreKit errors enabled **Steps**:

1. Enable verification errors in StoreKit configuration
2. Attempt purchase
3. Verify error handling

**Expected Results**:

- Clear error messages to user
- Proper logging of Apple error codes
- Option to retry or contact support

## **Integration Testing with Apple APIs**

### **Apple Validation Endpoint Testing**

```bash
# Test production endpoint (should return 21007 for sandbox receipts)
curl -X POST https://buy.itunes.apple.com/verifyReceipt \
  -H "Content-Type: application/json" \
  -d '{"receipt-data":"test","password":"your_shared_secret"}'

# Test sandbox endpoint
curl -X POST https://sandbox.itunes.apple.com/verifyReceipt \
  -H "Content-Type: application/json" \
  -d '{"receipt-data":"test","password":"your_shared_secret"}'
```

### **Database Testing**

```sql
-- Verify schema is correct
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pro_subscriptions';

-- Test the validation function
SELECT complete_apple_subscription_validation(
  'test-user-id'::uuid,
  'test-transaction-123',
  'test-original-123',
  'pro_subscription_month',
  'test-receipt-data',
  'sandbox',
  NOW(),
  NOW() + INTERVAL '1 month'
);
```

## **Performance Testing**

### **Receipt Polling Performance**

- Test with different retry intervals
- Monitor memory usage during long polling
- Verify exponential backoff prevents API flooding

### **Database Performance**

- Test concurrent purchase attempts
- Verify atomic operations prevent race conditions
- Monitor query performance with indexes

## **Security Testing**

### **Receipt Validation Security**

- Verify shared secret is not logged
- Test production-first fallback strategy
- Confirm user ID validation prevents spoofing
- Test transaction ID uniqueness constraints

### **Subscription Security**

- Verify only authenticated users can purchase
- Test profile update security (RLS policies)
- Confirm audit trail is populated

## **Error Recovery Testing**

### **Common Error Scenarios**

1. **App backgrounded during purchase**: Should resume properly
2. **Device reboot during purchase**: Should allow restore
3. **Account switching**: Should handle gracefully
4. **Expired sandbox receipts**: Should show appropriate errors

## **Logging and Monitoring**

### **Key Metrics to Monitor**

- Purchase completion rate
- Receipt validation success rate
- Average validation time
- Retry attempt distribution
- Error code frequency

### **Critical Logs to Review**

```
🔍 Starting Apple receipt validation
📡 Validating with Apple production endpoint
🔄 Receipt is from sandbox environment, redirecting
✅ Apple validation successful
✅ Server-side validation successful - purchase completed
```

## **Checklist for Production Deployment**

### **Pre-Deployment**

- [ ] Schema migration applied to production database
- [ ] APPLE_SHARED_SECRET configured in production environment
- [ ] StoreKit products created in App Store Connect
- [ ] App Store subscription pricing configured
- [ ] Bank account and tax information complete

### **Post-Deployment**

- [ ] Test with real sandbox account on TestFlight
- [ ] Monitor error rates and validation times
- [ ] Verify production receipt validation works
- [ ] Test restore purchases functionality
- [ ] Validate metrics dashboard shows data

### **Launch Day Monitoring**

- [ ] Monitor purchase funnel completion rates
- [ ] Watch for Apple validation errors (21004, 21005)
- [ ] Check database for proper subscription creation
- [ ] Verify profile updates are working
- [ ] Monitor support tickets for purchase issues

## **Support Playbook**

### **Common Issues and Solutions**

**User reports: "Purchase completed but no Pro features"**

1. Check pro_subscriptions table for user
2. Verify receipt_validation_status
3. Check validation attempts and errors
4. Run restore purchases if transaction exists
5. Manually validate receipt if needed

**User reports: "Purchase keeps spinning"**

1. Check Apple transaction attempts table
2. Look for network or validation errors
3. Guide user through restore purchases
4. Check Apple Developer forums for service issues

**User reports: "Charged but subscription not active"**

1. Verify transaction in App Store Connect
2. Check our database for transaction ID
3. Manually run receipt validation if missing
4. Issue refund if technical issue confirmed

## **Apple Documentation References**

### **Official Documentation**

- [Validating Receipts with the App Store](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_with_the_app_store)
- [StoreKit 2 Transaction Management](https://developer.apple.com/documentation/storekit/transaction)
- [In-App Purchase Best Practices](https://developer.apple.com/documentation/storekit/in-app_purchase/implementing_a_store_in_your_app_using_the_storekit_api)

### **Key Apple Recommendations**

- Always validate receipts on your server
- Try production endpoint first, fallback to sandbox on status 21007
- Use proper retry mechanisms for network failures
- Never trust client-side validation alone
- Implement proper transaction finishing
