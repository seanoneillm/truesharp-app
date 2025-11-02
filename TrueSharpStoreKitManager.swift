import StoreKit
import Foundation

/**
 * TrueSharp StoreKit 2 Native Implementation
 * Provides robust subscription handling with proper receipt validation
 */

@available(iOS 15.0, *)
class TrueSharpStoreKitManager: ObservableObject {
    
    // MARK: - Properties
    @Published var subscriptionStatus: SubscriptionStatus = .notSubscribed
    @Published var availableProducts: [Product] = []
    @Published var purchaseState: PurchaseState = .idle
    
    private var updateListenerTask: Task<Void, Error>?
    private let productIdentifiers = ["pro_subscription_month", "pro_subscription_year"]
    
    // MARK: - Enums
    enum SubscriptionStatus {
        case notSubscribed
        case subscribed(expirationDate: Date)
        case expired
        case pending
    }
    
    enum PurchaseState {
        case idle
        case purchasing
        case validatingReceipt
        case completed
        case failed(Error)
    }
    
    // MARK: - Initialization
    init() {
        // Start listening for transaction updates
        startTransactionListener()
        
        // Load products and check subscription status
        Task {
            await loadProducts()
            await checkSubscriptionStatus()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    // MARK: - Transaction Listener
    private func startTransactionListener() {
        updateListenerTask = listenForTransactions()
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            // Listen for transaction updates
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.handleTransaction(transaction)
                } catch {
                    print("❌ Transaction verification failed: \(error)")
                }
            }
        }
    }
    
    // MARK: - Product Loading
    @MainActor
    private func loadProducts() async {
        do {
            availableProducts = try await Product.products(for: productIdentifiers)
            print("✅ Loaded \(availableProducts.count) products")
        } catch {
            print("❌ Failed to load products: \(error)")
        }
    }
    
    // MARK: - Purchase Flow
    @MainActor
    func purchaseSubscription(_ product: Product) async -> PurchaseResult {
        purchaseState = .purchasing
        
        do {
            // Initiate purchase
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                // Verify the transaction
                let transaction = try checkVerified(verification)
                
                // SECURITY: Validate receipt server-side before finishing
                purchaseState = .validatingReceipt
                let validationResult = await validateReceiptServerSide(transaction)
                
                if validationResult.isValid {
                    // Only finish transaction after successful server validation
                    await transaction.finish()
                    purchaseState = .completed
                    await checkSubscriptionStatus()
                    
                    return PurchaseResult(
                        success: true,
                        transactionId: String(transaction.id),
                        receiptValidated: true
                    )
                } else {
                    purchaseState = .failed(PurchaseError.receiptValidationFailed)
                    return PurchaseResult(
                        success: false,
                        error: "Receipt validation failed: \(validationResult.error ?? "Unknown error")"
                    )
                }
                
            case .userCancelled:
                purchaseState = .idle
                return PurchaseResult(success: false, error: "Purchase cancelled by user")
                
            case .pending:
                purchaseState = .pending
                return PurchaseResult(success: false, error: "Purchase is pending approval")
                
            @unknown default:
                purchaseState = .failed(PurchaseError.unknownResult)
                return PurchaseResult(success: false, error: "Unknown purchase result")
            }
            
        } catch {
            purchaseState = .failed(error)
            return PurchaseResult(success: false, error: error.localizedDescription)
        }
    }
    
    // MARK: - Restore Purchases
    @MainActor
    func restorePurchases() async -> Bool {
        do {
            try await AppStore.sync()
            await checkSubscriptionStatus()
            return subscriptionStatus != .notSubscribed
        } catch {
            print("❌ Failed to restore purchases: \(error)")
            return false
        }
    }
    
    // MARK: - Subscription Status Check
    @MainActor
    private func checkSubscriptionStatus() async {
        var latestTransaction: Transaction?
        var latestExpirationDate: Date?
        
        // Check all subscription transactions
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                
                // Only consider subscription transactions for our products
                if productIdentifiers.contains(transaction.productID) {
                    if let expirationDate = transaction.expirationDate {
                        if latestExpirationDate == nil || expirationDate > latestExpirationDate! {
                            latestTransaction = transaction
                            latestExpirationDate = expirationDate
                        }
                    }
                }
            } catch {
                print("❌ Failed to verify transaction: \(error)")
            }
        }
        
        // Update subscription status
        if let expirationDate = latestExpirationDate {
            if expirationDate > Date() {
                subscriptionStatus = .subscribed(expirationDate: expirationDate)
            } else {
                subscriptionStatus = .expired
            }
        } else {
            subscriptionStatus = .notSubscribed
        }
    }
    
    // MARK: - Transaction Handling
    private func handleTransaction(_ transaction: Transaction) async {
        // Process the transaction (e.g., unlock features, update UI)
        if productIdentifiers.contains(transaction.productID) {
            await MainActor.run {
                Task {
                    await checkSubscriptionStatus()
                }
            }
        }
    }
    
    // MARK: - Receipt Validation
    private func validateReceiptServerSide(_ transaction: Transaction) async -> ValidationResult {
        // Get the app receipt
        guard let receiptData = await getAppReceiptData() else {
            return ValidationResult(isValid: false, error: "No receipt data available")
        }
        
        // Prepare validation request
        let validationRequest = ReceiptValidationRequest(
            userId: getCurrentUserId(),
            productId: transaction.productID,
            transactionId: String(transaction.id),
            receiptData: receiptData.base64EncodedString(),
            environment: getEnvironment()
        )
        
        // Send to server for validation with retry logic
        return await performServerValidation(validationRequest)
    }
    
    private func performServerValidation(_ request: ReceiptValidationRequest) async -> ValidationResult {
        let maxRetries = 3
        let baseDelay: TimeInterval = 2.0
        
        for attempt in 0..<maxRetries {
            do {
                let url = URL(string: "https://truesharp.io/api/validate-apple-receipt")!
                var urlRequest = URLRequest(url: url)
                urlRequest.httpMethod = "POST"
                urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
                urlRequest.httpBody = try JSONEncoder().encode(request)
                
                let (data, response) = try await URLSession.shared.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    let result = try JSONDecoder().decode(ValidationResponse.self, from: data)
                    return ValidationResult(isValid: result.valid, error: result.error)
                } else {
                    throw ValidationError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? -1)
                }
                
            } catch {
                print("❌ Validation attempt \(attempt + 1) failed: \(error)")
                
                if attempt < maxRetries - 1 {
                    let delay = baseDelay * pow(2.0, Double(attempt))
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                } else {
                    return ValidationResult(isValid: false, error: error.localizedDescription)
                }
            }
        }
        
        return ValidationResult(isValid: false, error: "Validation failed after \(maxRetries) attempts")
    }
    
    // MARK: - Utility Methods
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    private func getAppReceiptData() async -> Data? {
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              let receiptData = try? Data(contentsOf: receiptURL) else {
            return nil
        }
        return receiptData
    }
    
    private func getCurrentUserId() -> String {
        // TODO: Get actual user ID from your authentication system
        return "current_user_id"
    }
    
    private func getEnvironment() -> String {
        #if DEBUG
        return "sandbox"
        #else
        return "production"
        #endif
    }
}

// MARK: - Supporting Types
struct PurchaseResult {
    let success: Bool
    let transactionId: String?
    let receiptValidated: Bool
    let error: String?
    
    init(success: Bool, transactionId: String? = nil, receiptValidated: Bool = false, error: String? = nil) {
        self.success = success
        self.transactionId = transactionId
        self.receiptValidated = receiptValidated
        self.error = error
    }
}

struct ValidationResult {
    let isValid: Bool
    let error: String?
}

struct ReceiptValidationRequest: Codable {
    let userId: String
    let productId: String
    let transactionId: String
    let receiptData: String
    let environment: String
}

struct ValidationResponse: Codable {
    let valid: Bool
    let error: String?
}

enum PurchaseError: Error {
    case receiptValidationFailed
    case unknownResult
}

enum ValidationError: Error {
    case httpError(statusCode: Int)
}

enum StoreError: Error {
    case failedVerification
}

// MARK: - SwiftUI Integration Example
import SwiftUI

struct SubscriptionView: View {
    @StateObject private var storeManager = TrueSharpStoreKitManager()
    
    var body: some View {
        VStack(spacing: 20) {
            // Subscription Status
            statusView
            
            // Available Products
            productsView
            
            // Restore Purchases Button
            Button("Restore Purchases") {
                Task {
                    await storeManager.restorePurchases()
                }
            }
            .disabled(storeManager.purchaseState == .purchasing || 
                     storeManager.purchaseState == .validatingReceipt)
        }
        .padding()
    }
    
    private var statusView: some View {
        Group {
            switch storeManager.subscriptionStatus {
            case .notSubscribed:
                Text("No Active Subscription")
                    .foregroundColor(.secondary)
            case .subscribed(let expirationDate):
                VStack {
                    Text("TrueSharp Pro Active")
                        .foregroundColor(.green)
                        .font(.headline)
                    Text("Expires: \(expirationDate, style: .date)")
                        .foregroundColor(.secondary)
                }
            case .expired:
                Text("Subscription Expired")
                    .foregroundColor(.red)
            case .pending:
                Text("Purchase Pending")
                    .foregroundColor(.orange)
            }
        }
    }
    
    private var productsView: some View {
        VStack {
            ForEach(storeManager.availableProducts, id: \.id) { product in
                Button(action: {
                    Task {
                        let result = await storeManager.purchaseSubscription(product)
                        if !result.success {
                            // Handle error
                            print("Purchase failed: \(result.error ?? "Unknown error")")
                        }
                    }
                }) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(product.displayName)
                                .font(.headline)
                            Text(product.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(product.displayPrice)
                            .font(.headline)
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(10)
                }
                .disabled(storeManager.purchaseState == .purchasing || 
                         storeManager.purchaseState == .validatingReceipt)
            }
            
            // Purchase State Indicator
            switch storeManager.purchaseState {
            case .purchasing:
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Processing Purchase...")
                }
                .foregroundColor(.blue)
            case .validatingReceipt:
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Verifying with App Store...")
                }
                .foregroundColor(.orange)
            case .failed(let error):
                Text("Purchase Failed: \(error.localizedDescription)")
                    .foregroundColor(.red)
                    .font(.caption)
            default:
                EmptyView()
            }
        }
    }
}
