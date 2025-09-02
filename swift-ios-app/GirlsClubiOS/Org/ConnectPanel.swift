import SwiftUI
import SafariServices

struct ConnectPanel: View {
    @State private var chargesEnabled = false
    @State private var payoutsEnabled = false
    @State private var loading = false
    @State private var error: String?
    @State private var safariURL: URL?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: GCSpacing.lg) {
                    Text("Organization")
                        .font(.system(size: 28, weight: .bold))
                        .padding(.top, GCSpacing.xl)

                    GCCard {
                        VStack(alignment: .leading, spacing: GCSpacing.md) {
                            Text("Stripe Connect")
                                .font(.headline)
                            HStack {
                                statusView(title: "Charges", ok: chargesEnabled)
                                statusView(title: "Payouts", ok: payoutsEnabled)
                            }
                            if let e = error { Text(e).foregroundColor(.red).font(.caption) }
                            HStack(spacing: GCSpacing.sm) {
                                GCButton(title: "Connect with Stripe", variant: .primary) { Task { await openOnboarding() } }
                                GCButton(title: "Update Details", variant: .outline) { Task { await openUpdate() } }
                                GCButton(title: "Refresh", variant: .glass) { Task { await syncStatus() } }
                            }
                        }
                    }.padding(.horizontal, GCSpacing.xl)
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear { Task { await syncStatus() } }
        .sheet(item: Binding(get: {
            safariURL.map { SafariItem(url: $0) }
        }, set: { _ in safariURL = nil })) { item in
            SafariView(url: item.url)
        }
    }

    func statusView(title: String, ok: Bool) -> some View {
        HStack {
            Circle().fill(ok ? GCColors.success : GCColors.error).frame(width: 8, height: 8)
            Text(title + ": " + (ok ? "Enabled" : "Disabled"))
                .font(.caption).foregroundColor(GCColors.mutedText)
        }
    }

    func openOnboarding() async { await openConnect(mode: "onboarding") }
    func openUpdate() async { await openConnect(mode: "update") }

    func openConnect(mode: String) async {
        do {
            guard let token = try? await SupabaseClientProvider.shared.auth.session.accessToken else { return }
            let data = try await FunctionsClient.call(name: "stripe-connect", body: ["mode": mode], accessToken: token)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String:Any], let urlStr = json["url"] as? String, let u = URL(string: urlStr) {
                safariURL = u
            }
        } catch { self.error = error.localizedDescription }
    }

    func syncStatus() async {
        loading = true; error = nil
        do {
            guard let token = try? await SupabaseClientProvider.shared.auth.session.accessToken else { return }
            _ = try await FunctionsClient.call(name: "stripe-sync-status", body: [:], accessToken: token)
            // fetch from organizations table
            let client = SupabaseClientProvider.shared
            let user = try await client.auth.session.user
            // read current org id
            let prof = try await client.database.from("profiles").select().eq(column: "id", value: user.id).single().execute()
            struct Profile: Decodable { let current_organization_id: String? }
            let p = try prof.decoded(Profile.self)
            if let org = p.current_organization_id {
                let orgResp = try await client.database.from("organizations").select().eq(column: "id", value: org).single().execute()
                struct Org: Decodable { let charges_enabled: Bool?; let payouts_enabled: Bool? }
                let o = try orgResp.decoded(Org.self)
                self.chargesEnabled = o.charges_enabled ?? false
                self.payoutsEnabled = o.payouts_enabled ?? false
            }
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}

private struct SafariItem: Identifiable { let id = UUID(); let url: URL }

private struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ vc: SFSafariViewController, context: Context) {}
}

