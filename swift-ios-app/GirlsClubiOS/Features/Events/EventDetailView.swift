import SwiftUI

struct EventDetailView: View {
    let event: Event

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: GCSpacing.lg) {
                Text(event.title)
                    .font(.system(size: 24, weight: .bold))
                    .padding(.top, GCSpacing.xl)
                    .padding(.horizontal, GCSpacing.xl)

                GCCard {
                    VStack(alignment: .leading, spacing: GCSpacing.md) {
                        if let desc = event.description { Text(desc) }
                        HStack(spacing: GCSpacing.md) {
                            Text(dateString(event.start_time)).font(.caption).foregroundColor(GCColors.mutedText)
                            if let cents = event.price_cents, cents > 0 {
                                Text(String(format: "€%.2f", Double(cents)/100)).font(.caption).foregroundColor(GCColors.mutedText)
                            } else {
                                Text("Free").font(.caption).foregroundColor(GCColors.success)
                            }
                        }
                        if let loc = event.description, !loc.isEmpty { }
                    }
                }.padding(.horizontal, GCSpacing.xl)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    func dateString(_ s: String) -> String {
        let f = ISO8601DateFormatter();
        let d = f.date(from: s) ?? Date();
        return DateFormatter.localizedString(from: d, dateStyle: .medium, timeStyle: .short)
    }
}

