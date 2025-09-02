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
            ZStack {
                LinearGradient(gradient: Gradient(colors: [GCColors.background, GCColors.background.opacity(0.96)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: GCSpacing.lg) {
                        Text("Events")
                            .font(.system(size: 28, weight: .bold))
                            .padding(.top, GCSpacing.xl)
                            .padding(.horizontal, GCSpacing.xl)

                        if loading {
                            ProgressView("Loading events…")
                                .padding()
                        } else if let error = error {
                            GCCard { Text(error).foregroundColor(.red) }
                                .padding(.horizontal, GCSpacing.xl)
                        } else {
                            LazyVStack(spacing: GCSpacing.lg, pinnedViews: []) {
                                ForEach(events) { e in
                                    GCCard {
                                        VStack(alignment: .leading, spacing: GCSpacing.sm) {
                                            HStack {
                                                GCBadge(text: isUpcoming(e) ? "Upcoming" : "Past", tint: isUpcoming(e) ? GCColors.primary : GCColors.mutedText)
                                                Spacer()
                                            }
                                            Text(e.title)
                                                .font(.system(size: 18, weight: .semibold))
                                            if let desc = e.description {
                                                Text(desc)
                                                    .font(.system(size: 14))
                                                    .foregroundColor(GCColors.mutedText)
                                                    .lineLimit(2)
                                            }
                                            HStack(spacing: GCSpacing.md) {
                                                Text(dateString(e.start_time))
                                                    .font(.caption)
                                                    .foregroundColor(GCColors.mutedText)
                                                if let cents = e.price_cents, cents > 0 {
                                                    Text(String(format: "€%.2f", Double(cents)/100))
                                                        .font(.caption)
                                                        .foregroundColor(GCColors.mutedText)
                                                } else {
                                                    Text("Free").font(.caption).foregroundColor(GCColors.success)
                                                }
                                            }
                                            HStack(spacing: GCSpacing.sm) {
                                                GCButton(title: "Details", variant: .glass) {}
                                                GCButton(title: "Register", variant: .primary, fullWidth: true) {}
                                            }.padding(.top, GCSpacing.sm)
                                        }
                                    }
                                    .padding(.horizontal, GCSpacing.xl)
                                }
                            }
                            .padding(.bottom, GCSpacing.xl)
                        }
                    }
                }
            }
            .navigationBarHidden(true)
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

    func isUpcoming(_ e: Event) -> Bool { isoDate(e.start_time) > Date() }
    func dateString(_ s: String) -> String {
        DateFormatter.localizedString(from: isoDate(s), dateStyle: .medium, timeStyle: .short)
    }
}

#Preview {
    EventsListView()
}
