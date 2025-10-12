# SharpSports Native iOS SDK Implementation Guide

Based on the official SharpSports documentation, here's how to implement the native iOS SDK.

## 🔧 **Setup Steps**

### 1. Add SharpSports iOS SDK Package
```swift
// In Xcode: File > Swift Packages > Add Package Dependency
// URL: https://github.com/sgoodbets/sharpsports-spm
```

### 2. Request Access
Email `auth@sharpsports.io` to request access to the SDK.

## 📱 **Native Implementation**

### Step 1: Create Mobile Auth Service
```swift
// MobileAuthService.swift
import Foundation

class MobileAuthService {
    private let baseURL = "https://truesharp.io"  // Your production URL
    // Use "http://172.20.10.6:3000" for development
    
    func getMobileAuthToken() async throws -> MobileAuthTokenResponse {
        guard let userId = getCurrentUserId() else {
            throw AuthError.noUserId
        }
        
        let url = URL(string: "\(baseURL)/api/sharpsports/mobile-auth-token?userId=\(userId)")!
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.serverError
        }
        
        let tokenResponse = try JSONDecoder().decode(MobileAuthTokenResponse.self, from: data)
        return tokenResponse
    }
    
    private func getCurrentUserId() -> String? {
        // Get from your auth system
        return "your-user-id-here"
    }
}

struct MobileAuthTokenResponse: Codable {
    let success: Bool
    let mobileAuthToken: String
    let internalId: String
    
    var token: String { mobileAuthToken }
}

enum AuthError: Error {
    case noUserId
    case serverError
}
```

### Step 2: Implement SharpSports Integration
```swift
// AnalyticsViewController.swift
import UIKit
import WebKit
import SharpSportsMobile  // Add this import

class AnalyticsViewController: UIViewController {
    
    private let mobileAuthService = MobileAuthService()
    private let sharpSportsMobile = SharpSportsMobile.shared
    
    @IBOutlet weak var manageSportsbooksButton: UIButton!
    @IBOutlet weak var refreshButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set delegate
        sharpSportsMobile.delegate = self
        
        // Style buttons
        configureButtons()
    }
    
    // MARK: - Actions
    @IBAction func manageSportsbooksTapped(_ sender: Any) {
        presentSharpSportsPortal()
    }
    
    @IBAction func refreshTapped(_ sender: Any) {
        refreshSharpSportsAccounts()
    }
    
    // MARK: - SharpSports Integration
    func presentSharpSportsPortal() {
        Task.detached(priority: .background) { @MainActor in
            do {
                print("🔗 Fetching mobile auth token...")
                
                // Step 1: Fetch mobile auth token
                let mobileAuthToken = try await self.mobileAuthService.getMobileAuthToken()
                
                // Step 2: Initialize SharpSports SDK
                let keys = SharpSportsMobile.Keys(
                    publicKey: "a4e27d45042947e7967146c26973bbd4a4e27d45",
                    mobileAuthToken: mobileAuthToken.token,
                    internalId: mobileAuthToken.internalId
                )
                self.sharpSportsMobile.setKeys(keys: keys)
                
                print("✅ SharpSports SDK initialized")
                
                // Step 3: Fetch context with optional UI mode
                self.sharpSportsMobile.context(uiMode: "system") { result in
                    DispatchQueue.main.async {
                        switch result {
                        case .success(let cid):
                            print("✅ Context generated: \(cid)")
                            
                            // Step 4: Create WebView with SDK scripts
                            let url = URL(string: "https://ui.sharpsports.io/link/\(cid)")!
                            
                            let configuration = WKWebViewConfiguration()
                            self.sharpSportsMobile.addScripts(configuration: configuration)
                            
                            let webView = WKWebView(frame: .zero, configuration: configuration)
                            webView.navigationDelegate = self
                            
                            let webViewController = UIViewController()
                            webViewController.view.addSubview(webView)
                            webView.translatesAutoresizingMaskIntoConstraints = false
                            NSLayoutConstraint.activate([
                                webView.topAnchor.constraint(equalTo: webViewController.view.topAnchor),
                                webView.leadingAnchor.constraint(equalTo: webViewController.view.leadingAnchor),
                                webView.trailingAnchor.constraint(equalTo: webViewController.view.trailingAnchor),
                                webView.bottomAnchor.constraint(equalTo: webViewController.view.bottomAnchor)
                            ])
                            
                            // Load the SharpSports portal
                            webView.load(URLRequest(url: url))
                            
                            // The SDK will call present(viewController:) delegate method
                            
                        case .failure(let error):
                            print("❌ Error fetching context: \(error)")
                            self.showError("Failed to load SharpSports portal: \(error.localizedDescription)")
                        }
                    }
                }
                
            } catch {
                print("❌ Mobile auth token fetch failed: \(error)")
                await MainActor.run {
                    self.showError("Failed to fetch authentication token: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func refreshSharpSportsAccounts() {
        print("🔄 Refreshing SharpSports accounts...")
        
        // Default refresh (all accounts for the internalId)
        sharpSportsMobile.refresh()
        
        // Alternative refresh options:
        // sharpSportsMobile.refresh(refreshOption: .bettorId("BTTR_ID"))
        // sharpSportsMobile.refresh(refreshOption: .bettorAccountId("BACT_ID"))
        // sharpSportsMobile.refresh(refreshOption: .bettorAccountId("BACT_ID"), reverify: true)
    }
    
    // MARK: - Helper Methods
    func configureButtons() {
        let options = SharpSportsButtonOptions(
            buttonText: "Manage Sportsbooks",
            backgroundColor: .systemBlue,
            buttonColor: .white,
            cornerRadius: 8,
            fontFamily: "Helvetica",
            fontSize: 16,
            edgeInsets: UIEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        )
        
        manageSportsbooksButton.setTitle(options.buttonText, for: .normal)
        manageSportsbooksButton.backgroundColor = options.backgroundColor
        manageSportsbooksButton.setTitleColor(options.buttonColor, for: .normal)
        manageSportsbooksButton.layer.cornerRadius = options.cornerRadius
        manageSportsbooksButton.titleLabel?.font = UIFont(name: options.fontFamily, size: options.fontSize)
        manageSportsbooksButton.contentEdgeInsets = options.edgeInsets
    }
    
    func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - WKNavigationDelegate
extension AnalyticsViewController: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        // Let SharpSports SDK handle navigation
        sharpSportsMobile.onNavigationStateChange(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
    }
}

// MARK: - SharpSportsMobileDelegate
extension AnalyticsViewController: SharpSportsMobileDelegate {
    func webViewWillLoad() {
        print("🔄 SharpSports WebView will load")
        DispatchQueue.main.async {
            // Show loading indicator if needed
        }
    }
    
    func webViewDidFinishLoading() {
        print("✅ SharpSports WebView finished loading")
        DispatchQueue.main.async {
            // Hide loading indicator if needed
        }
    }
    
    func present(viewController: UIViewController) {
        print("📱 Presenting SharpSports portal")
        DispatchQueue.main.async {
            // Add close button to the presented view controller
            let navController = UINavigationController(rootViewController: viewController)
            navController.modalPresentationStyle = .fullScreen
            
            viewController.navigationItem.leftBarButtonItem = UIBarButtonItem(
                title: "Close",
                style: .done,
                target: self,
                action: #selector(self.closeSharpSportsPortal)
            )
            
            self.present(navController, animated: true)
        }
    }
    
    @objc func closeSharpSportsPortal() {
        dismiss(animated: true) {
            print("📱 SharpSports portal closed")
            // Optionally refresh your analytics data here
        }
    }
    
    func dismissWebView() {
        print("📱 Dismissing SharpSports WebView")
        DispatchQueue.main.async {
            self.dismiss(animated: true) {
                // Optionally refresh your analytics data here
            }
        }
    }
    
    func verificationDidFinishSuccesfully() {
        print("✅ SharpSports verification successful")
        DispatchQueue.main.async {
            // Handle successful verification
            let alert = UIAlertController(
                title: "Success",
                message: "Sportsbook account verification completed successfully!",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.present(alert, animated: true)
        }
    }
    
    func linkingSportsbookFailed(with error: SharpSportsMobileError) {
        print("❌ SharpSports linking failed: \(error)")
        DispatchQueue.main.async {
            self.showError("Failed to link sportsbook: \(error.localizedDescription)")
        }
    }
}
```

## 🔄 **Migration Path**

### Current State (React Native WebView)
- ✅ Working with corrected network URLs
- ✅ Uses your existing backend endpoints
- ✅ Provides basic functionality

### Future State (Native iOS SDK)
1. **Add SDK Package** via Xcode
2. **Request Access** from auth@sharpsports.io  
3. **Implement Swift Code** above
4. **Replace React Native** implementation with native bridge

## 🚀 **Next Steps**

1. **Test Current Implementation**: Try the React Native version now with fixed URLs
2. **Request SDK Access**: Email auth@sharpsports.io for SDK access
3. **Plan Native Migration**: When ready, implement the Swift version above

The React Native WebView approach will work for now and provide the core functionality. The native SDK provides better integration and access to all SharpSports features.