// Google Maps configuration
// IMPORTANT: Never hardcode API keys. Use env variables and restrict the key in
// Google Cloud Console to your production domains and the Maps JavaScript API.
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Restrict the API key to HTTP referrers (your domain) and to Maps JS API only
// 3. Set VITE_GOOGLE_MAPS_API_KEY in your environment (e.g., .env, Vercel settings)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
