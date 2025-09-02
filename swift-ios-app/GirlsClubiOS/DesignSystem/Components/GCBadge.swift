import SwiftUI

struct GCBadge: View {
    let text: String
    var tint: Color = GCColors.primary

    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .padding(.vertical, 4)
            .padding(.horizontal, 8)
            .background(tint.opacity(0.12))
            .foregroundColor(tint)
            .clipShape(RoundedRectangle(cornerRadius: GCRadius.sm, style: .continuous))
    }
}

#Preview { GCBadge(text: "Upcoming") }
