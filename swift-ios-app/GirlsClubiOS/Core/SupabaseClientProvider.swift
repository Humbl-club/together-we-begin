import Foundation
import Supabase

enum SupabaseClientProvider {
    static let shared: SupabaseClient = {
        let client = SupabaseClient(supabaseURL: AppConfig.supabaseURL, supabaseKey: AppConfig.supabaseAnonKey)
        return client
    }()
}
