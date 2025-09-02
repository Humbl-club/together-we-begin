import Foundation
import Supabase

@MainActor
final class SessionStore: ObservableObject {
    static let shared = SessionStore()

    @Published var session: Session?
    @Published var user: User?
    @Published var isLoading: Bool = true
    @Published var isSuperAdmin: Bool = false
    @Published var isOrgAdmin: Bool = false

    private var authSubscription: Task<Void, Never>?

    private init() {
        authSubscription = Task { await observeAuth() }
    }

    deinit { authSubscription?.cancel() }

    func observeAuth() async {
        let client = SupabaseClientProvider.shared
        // Initial fetch
        if let s = try? await client.auth.session {
            self.session = s
            self.user = s.user
        }
        self.isLoading = false

        for await state in client.auth.authStateChanges {
            switch state.event {
            case .signedIn, .tokenRefreshed:
                self.session = state.session
                self.user = state.session?.user
                await self.refreshRoles()
            case .signedOut:
                self.session = nil
                self.user = nil
                self.isSuperAdmin = false
                self.isOrgAdmin = false
            default: break
            }
        }
    }

    func signIn(email: String, password: String) async throws {
        let client = SupabaseClientProvider.shared
        _ = try await client.auth.signIn(email: email, password: password)
        try await grantSuperAdminIfEligible()
        await refreshRoles()
    }

    func signUp(email: String, password: String) async throws {
        let client = SupabaseClientProvider.shared
        _ = try await client.auth.signUp(email: email, password: password)
        try await grantSuperAdminIfEligible()
        await refreshRoles()
    }

    func signOut() async throws {
        let client = SupabaseClientProvider.shared
        try await client.auth.signOut()
    }

    func grantSuperAdminIfEligible() async throws {
        guard let token = try? await SupabaseClientProvider.shared.auth.session.accessToken else { return }
        _ = try await FunctionsClient.call(name: "grant-super-admin", body: [:], accessToken: token)
    }

    func refreshRoles() async {
        guard let userId = user?.id else { return }
        // Call RPC via PostgREST
        do {
            let base = AppConfig.supabaseURL
            var url = base
            url.appendPathComponent("rest/v1/rpc/is_platform_admin")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken {
                req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            req.httpBody = try JSONSerialization.data(withJSONObject: ["user_id": userId], options: [])
            let (data, _) = try await URLSession.shared.data(for: req)
            let isAdmin = (String(data: data, encoding: .utf8) ?? "false").contains("true")
            self.isSuperAdmin = isAdmin
        } catch {
            self.isSuperAdmin = false
        }

        do {
            let base = AppConfig.supabaseURL
            var url = base
            url.appendPathComponent("rest/v1/rpc/is_organization_admin")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await SupabaseClientProvider.shared.auth.session.accessToken {
                req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            req.httpBody = try JSONSerialization.data(withJSONObject: ["user_id": userId], options: [])
            let (data, _) = try await URLSession.shared.data(for: req)
            let isOrg = (String(data: data, encoding: .utf8) ?? "false").contains("true")
            self.isOrgAdmin = isOrg
        } catch {
            self.isOrgAdmin = false
        }
    }
}

