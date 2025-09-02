import Foundation
import Supabase

@MainActor
final class LoyaltyStore: ObservableObject {
    @Published var availablePoints: Int = 0
    @Published var lastError: String?

    func refresh() async {
        do {
            let client = SupabaseClientProvider.shared
            let user = try await client.auth.session.user
            let resp = try await client.database.from("profiles").select("available_loyalty_points").eq(column: "id", value: user.id).single().execute()
            struct Profile: Decodable { let available_loyalty_points: Int? }
            let p = try resp.decoded(Profile.self)
            availablePoints = p.available_loyalty_points ?? 0
        } catch { lastError = error.localizedDescription }
    }

    func redeemPoints(for eventId: String) async -> Bool {
        do {
            guard let token = try? await SupabaseClientProvider.shared.auth.session.accessToken else { return false }
            _ = try await FunctionsClient.call(name: "create-payment", body: ["eventId": eventId, "usePoints": true], accessToken: token)
            await refresh()
            return true
        } catch { lastError = error.localizedDescription; return false }
    }
}

