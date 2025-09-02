import SwiftUI

// Tailwind-ish tokens mapped to SwiftUI
enum GCSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

enum GCRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
}

enum GCColors {
    // Map to your brand (from web): primary #8B5CF6, accent #EC4899, success #10B981
    static let primary = Color(red: 0.545, green: 0.362, blue: 0.965) // #8B5CF6
    static let accent  = Color(red: 0.925, green: 0.284, blue: 0.600) // #EC4899
    static let success = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    static let warning = Color(red: 0.961, green: 0.620, blue: 0.067) // #F59E0B
    static let error   = Color(red: 0.937, green: 0.267, blue: 0.267) // #EF4444

    static let background = Color(uiColor: .systemBackground)
    static let surface    = Color(uiColor: .secondarySystemBackground)
    static let border     = Color.black.opacity(0.08)
    static let mutedText  = Color.secondary
}

struct GCShadow {
    static let soft = ShadowStyle(radius: 12, y: 6, opacity: 0.12)
    static let elevated = ShadowStyle(radius: 20, y: 12, opacity: 0.16)

    struct ShadowStyle {
        let radius: CGFloat
        let y: CGFloat
        let opacity: Double
    }
}

extension View {
    func gcShadow(_ style: GCShadow.ShadowStyle) -> some View {
        self.shadow(color: Color.black.opacity(style.opacity), radius: style.radius, x: 0, y: style.y)
    }

    func glassBackground() -> some View {
        self.background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: GCRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: GCRadius.lg, style: .continuous)
                    .stroke(GCColors.border, lineWidth: 1)
            )
    }
}

