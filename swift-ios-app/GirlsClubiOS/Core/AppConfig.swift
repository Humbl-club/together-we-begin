import Foundation

enum AppConfig {
    static let supabaseURL: URL = {
        if let s = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String, let u = URL(string: s) {
            return u
        }
        fatalError("Missing SUPABASE_URL in Info.plist/Secrets.xcconfig")
    }()

    static let supabaseAnonKey: String = {
        if let s = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String, !s.isEmpty {
            return s
        }
        fatalError("Missing SUPABASE_ANON_KEY in Info.plist/Secrets.xcconfig")
    }()
}
