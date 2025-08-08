# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/945e8026-291f-4434-93b5-949dcf1fab6b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/945e8026-291f-4434-93b5-949dcf1fab6b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/945e8026-291f-4434-93b5-949dcf1fab6b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## Mobile Health Integrations (Apple Health / Android Health Connect)

This app can optionally read today’s steps natively to power wellness challenges.

- Android: Health Connect via `@pianissimoproject/capacitor-health-connect`
- iOS: Apple HealthKit via `@perfood/capacitor-healthkit`

### Enable on your device
1. Export your project and clone locally
2. `npm install`
3. Add platforms: `npx cap add ios` and/or `npx cap add android`
4. `npx cap sync`
5. `npm run build`
6. Run on device: `npx cap run ios` or `npx cap run android`

### iOS setup
- In Xcode, enable the HealthKit capability for the iOS target
- Add Info.plist usage description:
  - `NSHealthShareUsageDescription` with a message like: “We use your step count to track challenge progress.”
- Ensure the app requests read permission for steps (handled in-code)

### Android setup
- Ensure Google Health Connect is installed on the device
- The app will request read permission for “Steps” at runtime (handled in-code)

Once permissions are granted, the Dashboard will show a “Sync your steps” prompt to connect, then pull today’s steps.

