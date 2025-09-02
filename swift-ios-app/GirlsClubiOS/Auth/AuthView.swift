import SwiftUI

struct AuthView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var loading = false
    @State private var error: String?
    @ObservedObject var session = SessionStore.shared

    var body: some View {
        VStack(spacing: GCSpacing.lg) {
            Text("Welcome")
                .font(.system(size: 28, weight: .bold))
            GCCard {
                VStack(alignment: .leading, spacing: GCSpacing.md) {
                    Text("Email").font(.caption).foregroundColor(GCColors.mutedText)
                    TextField("you@example.com", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Divider()
                    Text("Password").font(.caption).foregroundColor(GCColors.mutedText)
                    SecureField("••••••••", text: $password)
                    if let e = error { Text(e).foregroundColor(.red).font(.caption) }
                    HStack(spacing: GCSpacing.sm) {
                        GCButton(title: loading ? "Signing In…" : "Sign In", fullWidth: true) {
                            Task { await signIn() }
                        }.disabled(loading)
                        GCButton(title: "Sign Up", variant: .outline, fullWidth: true) {
                            Task { await signUp() }
                        }
                    }.padding(.top, GCSpacing.md)
                }
            }
            .padding(.horizontal, GCSpacing.xl)
        }
    }

    func signIn() async {
        guard !email.isEmpty, !password.isEmpty else { error = "Please enter email and password"; return }
        loading = true; error = nil
        do {
            try await session.signIn(email: email, password: password)
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    func signUp() async {
        guard !email.isEmpty, !password.isEmpty else { error = "Please enter email and password"; return }
        loading = true; error = nil
        do {
            try await session.signUp(email: email, password: password)
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}

#Preview { AuthView() }
