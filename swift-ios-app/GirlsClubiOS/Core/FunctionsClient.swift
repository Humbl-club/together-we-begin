import Foundation

struct FunctionsClient {
    static func supabaseFunctionsBase() -> URL {
        // https://<project>.functions.supabase.co
        var host = AppConfig.supabaseURL.host ?? ""
        // Transform supabase.co host to functions host
        // e.g., ynqdddwponrqwhtqfepi.supabase.co -> ynqdddwponrqwhtqfepi.functions.supabase.co
        if host.hasSuffix(".supabase.co") {
            host = host.replacingOccurrences(of: ".supabase.co", with: ".functions.supabase.co")
        }
        var comps = URLComponents()
        comps.scheme = "https"
        comps.host = host
        return comps.url!
    }

    static func call(name: String, body: [String:Any], accessToken: String?) async throws -> Data {
        let base = supabaseFunctionsBase()
        let headers: [String:String] = {
            var h = ["apikey": AppConfig.supabaseAnonKey]
            if let t = accessToken { h["Authorization"] = "Bearer \(t)" }
            return h
        }()
        let http = HTTPClient(baseURL: base, headers: headers)
        return try await http.post(path: name, json: body)
    }
}

