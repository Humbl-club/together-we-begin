import SwiftUI

enum GCButtonStyleVariant { case primary, secondary, outline, glass }

struct GCButton: View {
    let title: String
    var variant: GCButtonStyleVariant = .primary
    var fullWidth: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .padding(.vertical, 12)
                .frame(maxWidth: fullWidth ? .infinity : nil)
                .frame(minWidth: 44)
        }
        .buttonStyle(style)
    }

    private var style: ButtonStyle {
        switch variant {
        case .primary:   return PrimaryButtonStyle()
        case .secondary: return SecondaryButtonStyle()
        case .outline:   return OutlineButtonStyle()
        case .glass:     return GlassButtonStyle()
        }
    }
}

private struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, GCSpacing.xl)
            .background(GCColors.primary)
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: GCRadius.md, style: .continuous))
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .gcShadow(GCShadow.soft)
    }
}

private struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, GCSpacing.xl)
            .background(GCColors.accent)
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: GCRadius.md, style: .continuous))
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .gcShadow(GCShadow.soft)
    }
}

private struct OutlineButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, GCSpacing.xl)
            .overlay(
                RoundedRectangle(cornerRadius: GCRadius.md, style: .continuous)
                    .stroke(GCColors.primary, lineWidth: 1.5)
            )
            .foregroundColor(GCColors.primary)
            .background(Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: GCRadius.md, style: .continuous))
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

private struct GlassButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, GCSpacing.xl)
            .glassBackground()
            .opacity(configuration.isPressed ? 0.95 : 1.0)
    }
}

#Preview {
    VStack(spacing: 12) {
        GCButton(title: "Primary") {}
        GCButton(title: "Secondary", variant: .secondary) {}
        GCButton(title: "Outline", variant: .outline) {}
        GCButton(title: "Glass", variant: .glass) {}
    }.padding()
}
