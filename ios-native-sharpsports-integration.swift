// SharpSports iOS Native SDK Integration
// This file shows how to implement the native iOS SDK instead of the WebView approach
// Place this in your iOS project when you're ready to upgrade from WebView to native SDK

import UIKit
import WebKit
// import SharpSportsMobile // Add this when you install the SDK package

class AnalyticsViewController: UIViewController {
    
    // MARK: - Properties
    @IBOutlet weak var manageSportsbooksButton: UIButton!
    @IBOutlet weak var refreshButton: UIButton!
    
    // SDK singleton (uncomment when SDK is added)
    // let sharpSportsMobile = SharpSportsMobile.shared
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure buttons
        configureButtons()
        
        // Set delegate (uncomment when SDK is added)
        // sharpSportsMobile.delegate = self
    }
    
    func configureButtons() {
        // Style the manage sportsbooks button
        manageSportsbooksButton.setTitle("Manage Sportsbooks", for: .normal)
        manageSportsbooksButton.backgroundColor = .systemBlue
        manageSportsbooksButton.setTitleColor(.white, for: .normal)
        manageSportsbooksButton.layer.cornerRadius = 8
        manageSportsbooksButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        
        // Style the refresh button
        refreshButton.setTitle("Refresh Bets", for: .normal)
        refreshButton.backgroundColor = .systemGreen
        refreshButton.setTitleColor(.white, for: .normal)
        refreshButton.layer.cornerRadius = 8
        refreshButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
    }
    
    // MARK: - Button Actions
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
                print("🔗 Opening SharpSports Manage Sportsbooks portal")
                
                // Step 1: Fetch mobile auth token from your backend
                let token = try await self.fetchMobileAuthTokenFromServer()
                print("✅ Mobile auth token obtained")
                
                // Step 2: Initialize SharpSports SDK keys
                /* Uncomment when SDK is added:
                let keys = SharpSportsMobile.Keys(
                    publicKey: "a4e27d45042947e7967146c26973bbd4a4e27d45",
                    mobileAuthToken: token,
                    internalId: "user-\(UUID().uuidString)" // Use actual user ID
                )
                let sharpSportsMobile = SharpSportsMobile.shared
                sharpSportsMobile.setKeys(keys: keys)
                
                // Step 3: Request context (cid) from SDK
                sharpSportsMobile.context { result in
                    DispatchQueue.main.async {
                        switch result {
                        case .success(let cid):
                            print("✅ Generated SharpSports context ID: \(cid)")
                            
                            // Step 4: Build URL and present WebView
                            guard let url = URL(string: "https://ui.sharpsports.io/link/\(cid)") else { 
                                print("❌ Invalid URL")
                                return 
                            }
                            
                            // Step 5: Create WebView with SDK scripts
                            let configuration = WKWebViewConfiguration()
                            sharpSportsMobile.addScripts(configuration: configuration)
                            
                            let webVC = UIViewController()
                            let webView = WKWebView(frame: webVC.view.bounds, configuration: configuration)
                            webView.navigationDelegate = self
                            webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                            webVC.view.addSubview(webView)
                            
                            // Load the SharpSports UI
                            webView.load(URLRequest(url: url))
                            
                            // Present using SDK delegate method
                            sharpSportsMobile.present(viewController: webVC)
                            
                        case .failure(let error):
                            print("❌ Error fetching context cid: \(error)")
                            self.showError("Failed to generate SharpSports context: \(error.localizedDescription)")
                        }
                    }
                }
                */
                
                // Temporary fallback - remove when SDK is implemented
                print("⚠️ Native SDK not yet implemented, falling back to WebView approach")
                await self.fallbackToWebViewApproach(with: token)
                
            } catch {
                print("❌ Mobile auth token fetch failed: \(error)")
                await MainActor.run {
                    self.showError("Failed to fetch mobile auth token: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func refreshSharpSportsAccounts() {
        /* Uncomment when SDK is added:
        print("🔄 Refreshing SharpSports accounts")
        
        // Simple refresh by internalId (default)
        sharpSportsMobile.refresh()
        
        // Or use specific refresh options:
        // sharpSportsMobile.refresh(refreshOption: .bettorId("BTTR_ID"))
        // sharpSportsMobile.refresh(refreshOption: .bettorAccountId("BACT_ID"), reverify: true)
        */
        
        // Temporary implementation
        print("⚠️ Native SDK refresh not yet implemented")
        showInfo("SharpSports accounts refresh initiated. Native SDK implementation coming soon.")
    }
    
    // MARK: - Network Calls
    func fetchMobileAuthTokenFromServer() async throws -> String {
        // Determine base URL based on build configuration
        let baseURL = ProcessInfo.processInfo.environment["DEBUG"] == "1" 
            ? "http://localhost:3000" 
            : "https://truesharp.io"
        
        let url = URL(string: "\(baseURL)/api/sharpsports/mobile-auth-token?internalId=ios-user-id")!
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, 
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "ServerError", code: 0, userInfo: [
                NSLocalizedDescriptionKey: "Server returned error response"
            ])
        }
        
        let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
        
        if let token = json?["mobileAuthToken"] as? String {
            return token
        } else if let token = json?["token"] as? String {
            return token
        } else {
            throw NSError(domain: "ParseError", code: 0, userInfo: [
                NSLocalizedDescriptionKey: "mobileAuthToken not found in response"
            ])
        }
    }
    
    // Temporary fallback method - remove when native SDK is implemented
    func fallbackToWebViewApproach(with token: String) async {
        // This mirrors the React Native implementation for now
        print("🔄 Using WebView fallback approach")
        
        // You could implement a simple WebView presentation here
        // or integrate with your existing React Native implementation
        
        await MainActor.run {
            self.showInfo("SharpSports portal opened. Please use the React Native implementation for now.")
        }
    }
    
    // MARK: - Helper Methods
    func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    func showInfo(_ message: String) {
        let alert = UIAlertController(title: "Info", message: message, preferredStyle: .alert)
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
        /* Uncomment when SDK is added:
        sharpSportsMobile.onNavigationStateChange(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
        */
        
        // Temporary fallback
        decisionHandler(.allow)
    }
}

// MARK: - SharpSportsMobileDelegate
/* Uncomment when SDK is added:
extension AnalyticsViewController: SharpSportsMobileDelegate {
    func webViewWillLoad() {
        print("🔄 SharpSports WebView will load")
        DispatchQueue.main.async {
            // Show loading indicator
        }
    }
    
    func webViewDidFinishLoading() {
        print("✅ SharpSports WebView did finish loading")
        DispatchQueue.main.async {
            // Hide loading indicator
        }
    }
    
    func present(viewController: UIViewController) {
        print("📱 Presenting SharpSports view controller")
        DispatchQueue.main.async {
            viewController.modalPresentationStyle = .fullScreen
            self.present(viewController, animated: true, completion: nil)
        }
    }
    
    func dismissWebView() {
        print("📱 Dismissing SharpSports WebView")
        DispatchQueue.main.async {
            self.dismiss(animated: true, completion: nil)
        }
    }
    
    func verificationDidFinishSuccesfully() {
        print("✅ SharpSports verification finished successfully")
        DispatchQueue.main.async {
            // Handle success (close modal, refresh bets, show confirmation)
            self.showInfo("Sportsbook account verification completed successfully!")
        }
    }
    
    func linkingSportsbookFailed(with error: SharpSportsMobileError) {
        print("❌ SharpSports linking failed: \(error)")
        DispatchQueue.main.async {
            self.showError("Failed to link sportsbook: \(error.localizedDescription)")
        }
    }
}
*/

// MARK: - Installation Instructions
/*
 
 To implement the native SharpSports iOS SDK:

 1. Add Swift Package Manager dependency:
    - In Xcode: File → Swift Package Manager → Add Package
    - URL: https://github.com/sgoodbets/sharpsports-spm
    
 2. Import the framework:
    - Add `import SharpSportsMobile` at the top of this file
    
 3. Uncomment all the SDK-related code above
    
 4. Update your React Native bridge to call this native implementation
    
 5. Test the integration:
    - Verify mobile auth token fetch works
    - Test context generation and WebView presentation
    - Test refresh functionality
    - Verify delegate callbacks work correctly

 The current React Native WebView implementation will continue to work
 while you implement this native version.
 
 */