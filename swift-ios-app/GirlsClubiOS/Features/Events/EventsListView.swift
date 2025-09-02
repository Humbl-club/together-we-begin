import SwiftUI

struct Event: Decodable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let start_time: String
    let price_cents: Int?
    let loyalty_points_price: Int?
    let location: String?
}

struct EventsListView: View {
    @State private var events: [Event] = []
    @State private var loading = true
    @State private var error: String?
    @StateObject private var loyalty = LoyaltyStore()

    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(gradient: Gradient(colors: [GCColors.background, GCColors.background.opacity(0.96)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: GCSpacing.lg) {
                        HStack {
                            Text("Events")
                                .font(.system(size: 28, weight: .bold))
                            Spacer()
                            if SessionStore.shared.isOrgAdmin {
                                GCButton(title: "+ New", variant: .glass) {
                                    presentCreate()
                                }
                            }
                        }
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
                                            NavigationLink(destination: EventDetailView(event: e)) {
                                                Text(e.title)
                                            }
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
                            if let cents = e.price_cents, cents > 0 {
                                GCButton(title: "Register", variant: .primary, fullWidth: true) {
                                    presentPayment(for: e)
                                }
                            } else if let points = e.loyalty_points_price, points > 0 {
                                GCButton(title: "Use Points (\(points))", variant: .primary, fullWidth: true) {
                                    Task { await pointsFlow(for: e) }
                                }
                                .disabled(loyalty.availablePoints < (e.loyalty_points_price ?? Int.max))
                            } else {
                                GCButton(title: "Register", variant: .primary, fullWidth: true) {}
                            }
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
        .task {
            await loadEvents()
            await loyalty.refresh()
        }
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
            CacheStore.save(items, to: "events.json")
        } catch {
            await MainActor.run {
                if let cached: [Event] = CacheStore.load([Event].self, from: "events.json") {
                    self.events = cached
                    self.error = "Loaded cached events (offline)"
                } else {
                    self.error = error.localizedDescription
                }
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
    

    func presentPayment(for e: Event) {
        let vc = UIHostingController(rootView: PaymentCheckout(eventId: e.id))
        UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first?
            .rootViewController?
            .present(vc, animated: true)
    }

    func presentCreate() {
        let vc = UIHostingController(rootView: EventCreateView())
        UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first?
            .rootViewController?
            .present(vc, animated: true)
    }

    func pointsFlow(for e: Event) async {
        let ok = await loyalty.redeemPoints(for: e.id)
        if !ok { self.error = loyalty.lastError }
    }

}

#Preview {
    EventsListView()
}
