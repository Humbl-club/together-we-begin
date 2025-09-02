import Foundation

struct OrgStatusProvider {
    struct Status: Decodable { let charges_enabled: Bool?; let payouts_enabled: Bool? }

    static func currentOrgId() async throws -> String? {
        let client = SupabaseClientProvider.shared
        let user = try await client.auth.session.user
        let resp = try await client.database.from("profiles").select().eq(column: "id", value: user.id).single().execute()
        struct Profile: Decodable { let current_organization_id: String? }
        let p = try resp.decoded(Profile.self)
        return p.current_organization_id
    }

    static func fetchStatus() async throws -> Status? {
        guard let orgId = try await currentOrgId() else { return nil }
        let client = SupabaseClientProvider.shared
        let resp = try await client.database.from("organizations").select("charges_enabled,payouts_enabled").eq(column: "id", value: orgId).single().execute()
        return try resp.decoded(Status.self)
    }
}

