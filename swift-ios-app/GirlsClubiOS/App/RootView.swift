import SwiftUI

struct RootView: View {
    @ObservedObject var session = SessionStore.shared

    var body: some View {
        Group {
            if session.user == nil || session.isLoading {
                AuthView()
            } else {
                MainTabs()
            }
        }
    }
}

struct MainTabs: View {
    @ObservedObject var session = SessionStore.shared
    var body: some View {
        TabView {
            EventsListView()
                .tabItem { Label("Events", systemImage: "calendar") }

            if session.isOrgAdmin {
                ConnectPanel()
                    .tabItem { Label("Org", systemImage: "building.2") }
            }

            if session.isSuperAdmin {
                AdminPlaceholder()
                    .tabItem { Label("Admin", systemImage: "shield") }
            }
        }
    }
}

struct AdminPlaceholder: View {
    var body: some View {
        VStack(spacing: GCSpacing.lg) {
            Text("Super Admin")
                .font(.title.bold())
            Text("Full native admin screens can be implemented here. Trials & Grants already exist on web and can be mirrored incrementally.")
                .multilineTextAlignment(.center)
                .foregroundColor(GCColors.mutedText)
                .padding(.horizontal, GCSpacing.xl)
        }
    }
}

