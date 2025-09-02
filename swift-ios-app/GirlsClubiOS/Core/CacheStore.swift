import Foundation

enum CacheStore {
    static func save<T: Encodable>(_ value: T, to filename: String) {
        do {
            let url = cacheURL(filename)
            let data = try JSONEncoder().encode(value)
            try data.write(to: url, options: .atomic)
        } catch { print("Cache save error:", error) }
    }

    static func load<T: Decodable>(_ type: T.Type, from filename: String) -> T? {
        do {
            let url = cacheURL(filename)
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            return nil
        }
    }

    private static func cacheURL(_ filename: String) -> URL {
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        return dir.appendingPathComponent(filename)
    }
}
