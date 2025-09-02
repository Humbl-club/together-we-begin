import SwiftUI

struct AdminOverviewView: View {
    @State private var orgs = 0
    @State private var users = 0
    @State private var activeTrials = 0
    @State private var revenueCents = 0
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(spacing: GCSpacing.lg) {
                Text("Admin Overview").font(.system(size: 28, weight: .bold))
                    .padding(.top, GCSpacing.xl)
                    .padding(.horizontal, GCSpacing.xl)
                if let e = error { GCCard { Text(e).foregroundColor(.red) }.padding(.horizontal, GCSpacing.xl) }
                HStack(spacing: GCSpacing.lg) {
                    GCCard { stat("Organizations", value: "\(orgs)") }
                    GCCard { stat("Users", value: "\(users)") }
                }.padding(.horizontal, GCSpacing.xl)
                HStack(spacing: GCSpacing.lg) {
                    GCCard { stat("Active Trials", value: "\(activeTrials)") }
                    GCCard { stat("Monthly Revenue", value: String(format: "$%.2f", Double(revenueCents)/100)) }
                }.padding(.horizontal, GCSpacing.xl)
            }
        }
        .task { await load() }
    }

    func stat(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: GCSpacing.sm) {
            Text(title).font(.caption).foregroundColor(GCColors.mutedText)
            Text(value).font(.title2.bold())
        }
    }

    func load() async {
        loading = true; error = nil
        do {
            // Orgs count
            var url = AppConfig.supabaseURL
            url.appendPathComponent("rest/v1/organizations?select=id")
            var req = URLRequest(url: url)
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            let (_, resp) = try await URLSession.shared.data(for: req)
            if let http = resp as? HTTPURLResponse, let total = http.value(forHTTPHeaderField: "content-range")?.split(separator: "/").last, let n = Int(total) { orgs = n }
            // Users count
            var url2 = AppConfig.supabaseURL; url2.appendPathComponent("rest/v1/profiles?select=id")
            var req2 = URLRequest(url: url2); req2.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req2.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            let (_, resp2) = try await URLSession.shared.data(for: req2)
            if let http = resp2 as? HTTPURLResponse, let total = http.value(forHTTPHeaderField: "content-range")?.split(separator: "/").last, let n = Int(total) { users = n }
            // Active trials count
            var url3 = AppConfig.supabaseURL; url3.appendPathComponent("rest/v1/platform_billing?select=id&status=eq.trialing")
            var req3 = URLRequest(url: url3); req3.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req3.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            let (_, resp3) = try await URLSession.shared.data(for: req3)
            if let http = resp3 as? HTTPURLResponse, let total = http.value(forHTTPHeaderField: "content-range")?.split(separator: "/").last, let n = Int(total) { activeTrials = n }
            // Revenue (sum of active subscriptions)
            var url4 = AppConfig.supabaseURL; url4.appendPathComponent("rest/v1/platform_billing?select=amount_cents&status=eq.active")
            var req4 = URLRequest(url: url4); req4.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req4.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            let (data4, _) = try await URLSession.shared.data(for: req4)
            if let arr = try? JSONSerialization.jsonObject(with: data4) as? [[String:Any]] {
                revenueCents = arr.reduce(0) { $0 + ( $1["amount_cents"] as? Int ?? 0 ) }
            }
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
