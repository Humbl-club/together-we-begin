import SwiftUI

struct TrialsAdminView: View {
    @State private var trialEnabled = false
    @State private var trialDays = 14
    @State private var defaultTier = "basic"
    @State private var orgs: [Org] = []
    @State private var grantOrgId: String = ""
    @State private var grantType: String = "trial"
    @State private var grantTier: String = "pro"
    @State private var grantDays: Int = 30
    @State private var notes: String = ""
    @State private var loading = true
    @State private var error: String?
    @State private var success: String?

    struct Org: Decodable, Identifiable { let id: String; let name: String; let slug: String }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: GCSpacing.lg) {
                Text("Trials & Grants").font(.system(size: 28, weight: .bold))
                    .padding(.top, GCSpacing.xl)
                    .padding(.horizontal, GCSpacing.xl)

                if let e = error { GCCard { Text(e).foregroundColor(.red) }.padding(.horizontal, GCSpacing.xl) }
                if let s = success { GCCard { Text(s).foregroundColor(.green) }.padding(.horizontal, GCSpacing.xl) }

                GCCard {
                    VStack(alignment: .leading, spacing: GCSpacing.md) {
                        Text("Global Trials").font(.headline)
                        Toggle("Enable Trials", isOn: $trialEnabled)
                        Stepper("Trial Length: \(trialDays) days", value: $trialDays, in: 1...365)
                        Picker("Default Tier", selection: $defaultTier) {
                            Text("Basic").tag("basic"); Text("Pro").tag("pro"); Text("Enterprise").tag("enterprise")
                        }.pickerStyle(.segmented)
                        HStack { Spacer(); GCButton(title: "Save Settings") { Task { await saveTrialSettings() } } }
                    }
                }.padding(.horizontal, GCSpacing.xl)

                GCCard {
                    VStack(alignment: .leading, spacing: GCSpacing.md) {
                        Text("Assign Membership").font(.headline)
                        Picker("Organization", selection: $grantOrgId) {
                            ForEach(orgs) { o in Text("\(o.name) (\(o.slug))").tag(o.id) }
                        }
                        Picker("Grant Type", selection: $grantType) {
                            Text("Trial").tag("trial"); Text("Free").tag("free"); Text("Sponsored").tag("sponsored")
                        }.pickerStyle(.segmented)
                        Picker("Tier", selection: $grantTier) {
                            Text("Free").tag("free"); Text("Basic").tag("basic"); Text("Pro").tag("pro"); Text("Enterprise").tag("enterprise")
                        }
                        if grantType == "trial" { Stepper("Days: \(grantDays)", value: $grantDays, in: 1...365) }
                        TextField("Notes", text: $notes)
                        HStack { Spacer(); GCButton(title: "Apply Grant") { Task { await applyGrant() } } }
                    }
                }.padding(.horizontal, GCSpacing.xl)
            }
        }.task { await load() }
    }

    func load() async {
        loading = true; error = nil; success = nil
        do {
            // load trial setting
            var url = AppConfig.supabaseURL
            url.appendPathComponent("rest/v1/platform_settings?select=value&key=eq.global_trial")
            var req = URLRequest(url: url)
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            let (data, _) = try await URLSession.shared.data(for: req)
            if let arr = try? JSONSerialization.jsonObject(with: data) as? [[String:Any]], let obj = arr.first, let val = obj["value"] as? [String:Any] {
                trialEnabled = (val["enabled"] as? Bool) ?? false
                trialDays = (val["days"] as? Int) ?? 14
                defaultTier = (val["default_tier"] as? String) ?? "basic"
            }
            // load orgs
            let client = SupabaseClientProvider.shared
            let resp = try await client.database.from("organizations").select("id,name,slug").order(column: "created_at", ascending: false).limit(200).execute()
            orgs = try resp.decoded([Org].self)
            if grantOrgId.isEmpty { grantOrgId = orgs.first?.id ?? "" }
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    func saveTrialSettings() async {
        do {
            let val: [String:Any] = ["enabled": trialEnabled, "days": trialDays, "default_tier": defaultTier]
            var url = AppConfig.supabaseURL; url.appendPathComponent("rest/v1/platform_settings")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            req.httpBody = try JSONSerialization.data(withJSONObject: [["key":"global_trial","value":val]], options: [])
            let (_, resp) = try await URLSession.shared.data(for: req)
            guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw NSError(domain:"save", code: -1) }
            success = "Trial settings saved"
        } catch { self.error = error.localizedDescription }
    }

    func applyGrant() async {
        guard !grantOrgId.isEmpty else { error = "Select org"; return }
        do {
            let obj: [String:Any] = [
                "organization_id": grantOrgId,
                "grant_type": grantType,
                "tier": grantTier,
                "days": grantType == "trial" ? grantDays : NSNull(),
                "notes": notes.isEmpty ? NSNull() : notes
            ]
            var url = AppConfig.supabaseURL; url.appendPathComponent("rest/v1/organization_membership_grants")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            req.httpBody = try JSONSerialization.data(withJSONObject: [obj], options: [])
            let (_, resp) = try await URLSession.shared.data(for: req)
            guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw NSError(domain:"grant", code: -1) }
            success = "Grant applied"
        } catch { self.error = error.localizedDescription }
    }
}
