import SwiftUI

struct Event: Decodable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let start_time: String
    let price_cents: Int?
}

struct EventsListView: View {
    @State private var events: [Event] = []
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationView {
            Group {
                if loading {
                    ProgressView("Loading events…")
                } else if let error = error {
                    Text(error).foregroundColor(.red)
                } else {
                    List(events) { e in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(e.title).font(.headline)
                            if let desc = e.description { Text(desc).font(.subheadline).foregroundColor(.secondary).lineLimit(2) }
                            HStack(spacing: 8) {
                                Text(DateFormatter.localizedString(from: isoDate(e.start_time), dateStyle: .medium, timeStyle: .short))
                                    .font(.caption).foregroundColor(.secondary)
                                if let cents = e.price_cents, cents > 0 {
                                    Text(String(format: "€%.2f", Double(cents)/100)).font(.caption).foregroundColor(.secondary)
                                } else {
                                    Text("Free").font(.caption).foregroundColor(.green)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Events")
        }
        .task { await loadEvents() }
    }

    func loadEvents() async {
        loading = true
        error = nil
        do {
            let client = SupabaseClientProvider.shared
            let response = try await client.database.from("events").select().order(column: "start_time", ascending: true).execute()
            let items = try response.decoded([Event].self)
            await MainActor.run {
                self.events = items
                self.loading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.loading = false
            }
        }
    }

    func isoDate(_ s: String) -> Date {
        let f = ISO8601DateFormatter()
        return f.date(from: s) ?? Date()
    }
}

#Preview {
    EventsListView()
}
