Native iOS App (SwiftUI + Supabase + Stripe)

This folder contains a lightweight scaffold for a fully native iOS app that connects to your existing Supabase backend and Stripe flows. It lives alongside your Vercel app in a single monorepo — no changes to your Vercel deployment are required.

What’s included
- SwiftUI app target and project definition (via XcodeGen) to keep the repo clean and reproducible.
- Supabase client bootstrap with `supabase-swift`.
- A minimal Events list view reading from your existing `events` table.
- Config via `.xcconfig` (secrets not committed) and Info.plist.

Prerequisites
- Xcode 15+
- Homebrew (recommended)
- XcodeGen: `brew install xcodegen`

Setup
1) Copy secrets template and fill values (do NOT commit real values):

```
cp swift-ios-app/Config/Secrets.xcconfig.sample swift-ios-app/Config/Secrets.xcconfig
# Edit swift-ios-app/Config/Secrets.xcconfig
```

Secrets.xcconfig expects:
- SUPABASE_URL = https://YOUR-PROJECT.supabase.co
- SUPABASE_ANON_KEY = your_anon_key
- STRIPE_PUBLISHABLE_KEY = pk_live_or_test

2) Generate the Xcode project:

```
cd swift-ios-app
xcodegen generate
open GirlsClubiOS.xcodeproj
```

3) Build & run on iOS simulator/device.

Notes on features
- Auth: You can use email/password (same as web). The sample shows the client bootstrap; add your auth screens next.
- Events: `EventsListView` fetches from `events` to demonstrate connectivity.
- Payments: You can initially reuse your existing “create-payment” Edge Function and open the returned Checkout URL in `SFSafariViewController`. For fully native PaymentSheet/Apple Pay, add a small Edge Function to create a PaymentIntent and return the `client_secret` (can be done later without schema changes).
- Connect: The app can open your existing `stripe-connect` onboarding URL in Safari and poll `stripe-sync-status` — no schema changes needed.

Monorepo considerations
- This folder is ignored by Vercel and won’t affect your SPA deployment.
- Keep app secrets in `Secrets.xcconfig` (local only). Consider using Xcode Cloud or GitHub Actions + Encrypted secrets for CI later.

Next steps (optional)
- Add Email/Password auth views, secure Keychain session storage.
- Add PaymentSheet flow (requires server function returning PaymentIntent `client_secret`).
- Add deep links/push notifications.
- Expand features (Messaging, Social, Challenges) incrementally.

