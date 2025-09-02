import SwiftUI
import AVFoundation

final class QRScannerDelegate: NSObject, AVCaptureMetadataOutputObjectsDelegate, ObservableObject {
    @Published var scanned: String?
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject, let str = obj.stringValue {
            scanned = str
        }
    }
}

struct QRScannerView: UIViewControllerRepresentable {
    @ObservedObject var delegate = QRScannerDelegate()

    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        let session = AVCaptureSession()
        guard let device = AVCaptureDevice.default(for: .video), let input = try? AVCaptureDeviceInput(device: device) else { return vc }
        if session.canAddInput(input) { session.addInput(input) }
        let output = AVCaptureMetadataOutput()
        if session.canAddOutput(output) { session.addOutput(output) }
        output.setMetadataObjectsDelegate(delegate, queue: .main)
        output.metadataObjectTypes = [.qr]
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        layer.frame = vc.view.layer.bounds
        vc.view.layer.addSublayer(layer)
        session.startRunning()
        return vc
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
