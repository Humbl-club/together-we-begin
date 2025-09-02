import SwiftUI

struct EventCreateView: View {
    @Environment(\.dismiss) var dismiss
    @State private var titleText = ""
    @State private var descriptionText = ""
    @State private var locationText = ""
    @State private var date = Date()
    @State private var startTime = Date()
    @State private var endTime = Date().addingTimeInterval(3600)
    @State private var priceText = ""
    @State private var capacityText = ""
    @State private var error: String?
    @State private var saving = false
    @State private var chargesEnabled = false
    @State private var payoutsEnabled = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Basics")) {
                    TextField("Title", text: $titleText)
                    TextField("Description", text: $descriptionText, axis: .vertical)
                }
                Section(header: Text("When")) {
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    DatePicker("Start", selection: $startTime, displayedComponents: .hourAndMinute)
                    DatePicker("End", selection: $endTime, displayedComponents: .hourAndMinute)
                }
                Section(header: Text("Where")) {
                    TextField("Location", text: $locationText)
                }
                Section(header: Text("Capacity & Price")) {
                    TextField("Capacity", text: $capacityText).keyboardType(.numberPad)
                    TextField("Price (EUR)", text: $priceText).keyboardType(.decimalPad)
                    if isPaid && !(chargesEnabled && payoutsEnabled) {
                        Text("Paid events require Stripe Connect. Connect and refresh status in Organization tab.")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
                if let e = error { Section { Text(e).foregroundColor(.red) } }
            }
            .navigationTitle("Create Event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button(saving ? "Saving…" : "Save") { Task { await save() } }.disabled(saving) }
            }
            .onAppear { Task { await loadOrgStatus() } }
        }
    }

    var isPaid: Bool { (Double(priceText.replacingOccurrences(of: ",", with: ".")) ?? 0) > 0 }

    func loadOrgStatus() async {
        if let status = try? await OrgStatusProvider.fetchStatus() {
            chargesEnabled = status?.charges_enabled ?? false
            payoutsEnabled = status?.payouts_enabled ?? false
        }
    }

    func save() async {
        guard !titleText.trimmingCharacters(in: .whitespaces).isEmpty else { error = "Title is required"; return }
        if isPaid && !(chargesEnabled && payoutsEnabled) { error = "Connect Stripe first"; return }
        saving = true; error = nil
        do {
            let client = SupabaseClientProvider.shared
            let user = try await client.auth.session.user

            // Build start/end ISO timestamps
            let cal = Calendar.current
            let start = cal.date(bySettingHour: cal.component(.hour, from: startTime), minute: cal.component(.minute, from: startTime), second: 0, of: date) ?? date
            let end = cal.date(bySettingHour: cal.component(.hour, from: endTime), minute: cal.component(.minute, from: endTime), second: 0, of: date) ?? date.addingTimeInterval(3600)
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime]

            var payload: [String:Any] = [
                "title": titleText,
                "description": descriptionText.isEmpty ? NSNull() : descriptionText,
                "location": locationText.isEmpty ? NSNull() : locationText,
                "start_time": iso.string(from: start),
                "end_time": iso.string(from: end),
                "price_cents": isPaid ? Int((Double(priceText.replacingOccurrences(of: ",", with: ".")) ?? 0) * 100) : NSNull(),
                "max_capacity": Int(capacityText) ?? NSNull(),
                "created_by": user.id
            ]

            // Insert via REST to allow NSNull payload; supabase-swift decode convenience is stricter
            var url = AppConfig.supabaseURL
            url.appendPathComponent("rest/v1/events")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            if let token = try? await client.auth.session.accessToken { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
            req.httpBody = try JSONSerialization.data(withJSONObject: [payload], options: [])
            let (_, resp) = try await URLSession.shared.data(for: req)
            guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw NSError(domain: "Insert", code: -1) }

            saving = false
            dismiss()
        } catch {
            self.error = error.localizedDescription
            saving = false
        }
    }
}

