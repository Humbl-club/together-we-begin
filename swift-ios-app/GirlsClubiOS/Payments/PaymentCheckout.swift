import SwiftUI
import StripePaymentSheet

final class PaymentController: ObservableObject {
    @Published var paymentSheet: PaymentSheet?
    @Published var presenting: Bool = false
    @Published var lastError: String?

    func prepare(eventId: String) async {
        do {
            guard let token = try? await SupabaseClientProvider.shared.auth.session.accessToken else { return }
            let data = try await FunctionsClient.call(name: "create-mobile-payment-intent", body: ["eventId": eventId], accessToken: token)
            let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
            guard let clientSecret = json["paymentIntentClientSecret"] as? String,
                  let ephemeralKey = json["ephemeralKeySecret"] as? String,
                  let customerId = json["customerId"] as? String,
                  let pk = Bundle.main.object(forInfoDictionaryKey: "STRIPE_PUBLISHABLE_KEY") as? String else {
                self.lastError = "Invalid server response"
                return
            }
            STPAPIClient.shared.publishableKey = pk
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "Girls Club"
            config.customer = .init(id: customerId, ephemeralKeySecret: ephemeralKey)
            config.applePay = .init(merchantId: "merchant.com.girlsclub.app", merchantCountryCode: "DE") // configure later
            self.paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: config)
            self.presenting = true
        } catch {
            self.lastError = error.localizedDescription
        }
    }
}

struct PaymentCheckout: View {
    let eventId: String
    @StateObject private var controller = PaymentController()

    var body: some View {
        VStack {
            if let e = controller.lastError { Text(e).foregroundColor(.red) }
        }
        .onAppear { Task { await controller.prepare(eventId: eventId) } }
        .sheet(isPresented: $controller.presenting) {
            if let sheet = controller.paymentSheet {
                PaymentSheetWrapper(sheet: sheet)
            }
        }
    }
}

struct PaymentSheetWrapper: UIViewControllerRepresentable {
    let sheet: PaymentSheet
    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        DispatchQueue.main.async {
            sheet.present(from: vc) { result in
                // Handle result; webhook will finalize registration
            }
        }
        return vc
    }
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

