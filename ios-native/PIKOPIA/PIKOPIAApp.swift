import SwiftUI
import WebKit

@main
struct PIKOPIAApp: App {
    var body: some Scene {
        WindowGroup {
            MiniGamesView()
                .ignoresSafeArea(.container, edges: .bottom)
        }
    }
}

struct MiniGamesView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = .all
        config.websiteDataStore = .default()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.09, green: 0.08, blue: 0.17, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = true
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            assertionFailure("www/index.html is missing from the iOS bundle")
        }
        return webView
    }
    func updateUIView(_ webView: WKWebView, context: Context) { }
}
