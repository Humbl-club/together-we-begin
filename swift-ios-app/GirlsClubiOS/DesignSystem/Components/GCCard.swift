import SwiftUI

struct GCCard<Content: View>: View {
    var padding: CGFloat = GCSpacing.lg
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: GCSpacing.md) {
            content()
        }
        .padding(padding)
        .glassBackground()
        .gcShadow(GCShadow.soft)
    }
}

#Preview {
    GCCard { Text("Glass Card") }
        .padding()
}
