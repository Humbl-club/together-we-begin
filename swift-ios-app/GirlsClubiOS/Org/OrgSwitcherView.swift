import SwiftUI

struct OrgSwitcherView: View {
    @State private var orgs: [Org] = []
    @State private var currentOrgId: String?
    @State private var loading = true
    @State private var error: String?

    struct Org: Decodable, Identifiable { let id: String; let name: String; let slug: String }

    var body: some View {
        NavigationView {
            List {
                if let e = error { Text(e).foregroundColor(.red) }
                ForEach(orgs) { o in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(o.name).font(.headline)
                            Text(o.slug).font(.caption).foregroundColor(GCColors.mutedText)
                        }
                        Spacer()
                        if o.id == currentOrgId { GCBadge(text: "Current") }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { Task { await switchOrg(o.id) } }
                }
            }
            .navigationTitle("Organizations")
        }
        .task { await load() }
    }

    func load() async {
        loading = true; error = nil
        do {
            let client = SupabaseClientProvider.shared
            let user = try await client.auth.session.user
            let memResp = try await client.database.from("organization_members").select("organization_id").eq(column: "user_id", value: user.id).execute()
            struct Member: Decodable { let organization_id: String }
            let mems = try memResp.decoded([Member].self)
            let ids = mems.map { $0.organization_id }
            if ids.isEmpty { orgs = []; loading = false; return }
            let orgResp = try await client.database.from("organizations").select("id,name,slug").in(column: "id", values: ids).execute()
            orgs = try orgResp.decoded([Org].self)
            currentOrgId = try await OrgStatusProvider.currentOrgId()
            loading = false
        } catch { self.error = error.localizedDescription; loading = false }
    }

    func switchOrg(_ id: String) async {
        do {
            let client = SupabaseClientProvider.shared
            let user = try await client.auth.session.user
            _ = try await client.database.from("profiles").update(values: ["current_organization_id": id]).eq(column: "id", value: user.id).execute()
            currentOrgId = id
        } catch { self.error = error.localizedDescription }
    }
}
