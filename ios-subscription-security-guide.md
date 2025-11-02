# TrueSharp iOS Subscription Security Guide

## **Critical Security Implementations**

### **1. Server-Side Receipt Validation (ENFORCED)**

```typescript
// ✅ CORRECT: Only report success after server validation
await validateReceiptWithApple(receiptData, productionFirst: true);
const result = await supabase.rpc('complete_apple_subscription_validation', params);
if (result.is_active) {
  // Only now report success to user
  return { success: true, validated: true };
}

// ❌ INCORRECT: Never trust client-side validation
// if (purchase.acknowledged) return { success: true }; // DANGEROUS
```

### **2. Production-First Validation Strategy**

```typescript
// Apple recommended approach: Try production first, fallback on 21007
try {
  response = await fetch(APPLE_PRODUCTION_URL, { ... });
  appleData = await response.json();

  if (appleData.status === 21007) {
    // Receipt from sandbox - fallback to sandbox endpoint
    response = await fetch(APPLE_SANDBOX_URL, { ... });
    appleData = await response.json();
  }
} catch (error) {
  // Network error - try sandbox as fallback
  response = await fetch(APPLE_SANDBOX_URL, { ... });
}
```

### **3. Transaction Finishing Control**

```typescript
// ✅ CORRECT: Finish transaction only after validation
try {
  await validateReceiptWithServer(receipt);
  await InAppPurchases.finishTransactionAsync(transactionId);
} catch (error) {
  // Don't finish transaction on validation failure
  // This allows user to retry or restore
}
```

### **4. Atomic Database Operations**

```sql
-- Use database function for atomic subscription creation
CREATE OR REPLACE FUNCTION complete_apple_subscription_validation(...)
RETURNS JSONB AS $$
BEGIN
  -- Insert subscription and update profile in single transaction
  INSERT INTO pro_subscriptions (...) VALUES (...);
  UPDATE profiles SET pro = 'yes' WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

## **Security Configuration**

### **Environment Variables (Required)**

```bash
# Production
APPLE_SHARED_SECRET=your_app_specific_shared_secret_from_app_store_connect
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Never log these values in production
```

### **Database Security (RLS Policies)**

```sql
-- Users can only view their own subscriptions
CREATE POLICY "Users can view their own pro subscriptions"
  ON pro_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can manage subscriptions
CREATE POLICY "Service role can manage pro subscriptions"
  ON pro_subscriptions FOR ALL
  USING (true) WITH CHECK (true);
```

### **Rate Limiting and Error Handling**

```typescript
// Implement delays between Apple API calls
await new Promise(resolve => setTimeout(resolve, 1000));

// Handle Apple error codes properly
const errorMessages: { [key: number]: string } = {
  21000: 'Invalid JSON object',
  21002: 'Malformed receipt data',
  21003: 'Receipt authentication failed',
  21004: 'Shared secret mismatch',
  21005: 'Receipt server unavailable',
  21006: 'Valid receipt, expired subscription',
  21007: 'Sandbox receipt sent to production',
  21008: 'Production receipt sent to sandbox',
};
```

## **Common Security Vulnerabilities to Avoid**

### **❌ False Success Reporting**

```typescript
// NEVER do this - reports success before validation
if (purchase.acknowledged) {
  showSuccessMessage(); // DANGEROUS!
  return { success: true };
}
```

### **❌ Client-Side Validation Only**

```typescript
// NEVER trust client-side validation alone
const isValid = validateReceiptLocally(receipt); // INSECURE!
if (isValid) updateSubscription(); // DANGEROUS!
```

### **❌ Premature Transaction Finishing**

```typescript
// NEVER finish transaction before validation
await InAppPurchases.finishTransactionAsync(id); // Too early!
// ... later: validate receipt ... // Too late!
```

### **❌ Hardcoded Secrets**

```typescript
// NEVER hardcode shared secrets
const secret = "a1b2c3d4e5f6"; // INSECURE!
```

### **❌ Insufficient Error Handling**

```typescript
// NEVER silently fail validation
try {
  await validateReceipt();
} catch (error) {
  // Silent failure - user thinks they have subscription!
}
```

## **Monitoring and Alerting**

### **Key Security Metrics**

- Receipt validation failure rate > 5%
- Transaction timeout rate > 10%
- Duplicate transaction attempts
- Apple API error rate increases
- Users reporting payment without access

### **Security Alerts**

```typescript
// Monitor for suspicious patterns
if (validationFailureRate > 0.05) {
  alert('High receipt validation failure rate detected');
}

if (duplicateTransactionAttempts > 10) {
  alert('Potential duplicate purchase attack');
}
```

### **Audit Logging**

```typescript
// Log all validation attempts for audit
await supabase.from('apple_transaction_attempts').insert({
  user_id: userId,
  transaction_id: transactionId,
  validation_result: result,
  timestamp: new Date(),
  ip_address: getClientIP(),
});
```

## **Compliance Requirements**

### **Apple App Store Guidelines**

- ✅ Use server-side receipt validation
- ✅ Handle expired subscriptions gracefully
- ✅ Provide restore purchases functionality
- ✅ Display clear pricing and terms
- ✅ Handle subscription cancellations

### **GDPR/Privacy Compliance**

- Store minimal transaction data required
- Allow users to request data deletion
- Don't log sensitive receipt contents
- Respect user privacy in analytics

### **Financial Compliance**

- Maintain audit trails for all transactions
- Implement proper refund procedures
- Track tax implications per jurisdiction
- Maintain secure backup of transaction records

## **Incident Response Plan**

### **Security Breach Response**

1. **Immediate**: Rotate shared secrets
2. **Assessment**: Review audit logs for impact
3. **Containment**: Disable affected functionality if needed
4. **Communication**: Notify affected users if required
5. **Recovery**: Restore secure operations
6. **Lessons**: Update security procedures

### **Apple Service Outage Response**

1. **Detection**: Monitor Apple API error rates
2. **Communication**: Inform users of temporary issues
3. **Fallback**: Enable retry mechanisms
4. **Recovery**: Resume normal operations when service restored

## **Security Testing Checklist**

### **Pre-Production**

- [ ] Shared secret properly configured and not logged
- [ ] Receipt validation works with both production and sandbox
- [ ] Database policies prevent unauthorized access
- [ ] Transaction finishing only occurs after validation
- [ ] Error handling doesn't reveal sensitive information
- [ ] Audit logging captures all security events

### **Post-Production**

- [ ] Monitor validation success rates
- [ ] Review audit logs weekly
- [ ] Test restore purchases functionality
- [ ] Verify subscription renewal handling
- [ ] Check for unusual transaction patterns

## **Emergency Contacts**

### **Apple Developer Support**

- Phone: 1-800-633-2152
- Developer Forums: developer.apple.com/forums
- App Store Connect Support: appstoreconnect.apple.com

### **Internal Escalation**

- Security Team: security@truesharp.io
- Engineering Lead: engineering@truesharp.io
- Legal/Compliance: legal@truesharp.io
