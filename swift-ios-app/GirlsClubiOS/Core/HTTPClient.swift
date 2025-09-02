import Foundation

struct HTTPClient {
    let baseURL: URL
    let headers: [String:String]

    init(baseURL: URL, headers: [String:String] = [:]) {
        self.baseURL = baseURL
        self.headers = headers
    }

    func post(path: String, json: [String:Any]) async throws -> Data {
        var url = baseURL
        url.appendPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        for (k,v) in headers { req.setValue(v, forHTTPHeaderField: k) }
        req.httpBody = try JSONSerialization.data(withJSONObject: json, options: [])
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NSError(domain: "HTTP", code: (resp as? HTTPURLResponse)?.statusCode ?? -1, userInfo: ["body": String(data: data, encoding: .utf8) ?? ""]) 
        }
        return data
    }
}

