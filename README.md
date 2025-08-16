# Welcome to your Lovable project

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/font) to optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

---

## Modular branding, feature flags, and tenants

This app is prepared for multi‑brand, multi‑tenant deployments.

- BrandProvider
  - Switch brand at runtime via URL: ?brand=together or ?brand=aurora
  - Or set in localStorage: localStorage.setItem('brand', 'aurora')
  - Applies CSS variables (e.g., --brand-accent) and sets data-brand on <html>

- FeatureFlagsProvider
  - Persisted flags in localStorage key "featureFlags"
  - Example in Console:
    - const flags = JSON.parse(localStorage.getItem('featureFlags')||'{}');
    - localStorage.setItem('featureFlags', JSON.stringify({ ...flags, enableCreateEventButton: true }))

- TenantProvider (stub)
  - Holds tenantId for future org scoping
  - Set with: localStorage.setItem('tenantId', 'org_123')

## SEO usage
Per‑page SEO is handled by <SEO title="..." description="..." canonical="/path" />
Already added on Messages, Social, Events pages.

## Create Event (admin)
- Admins (or when enableCreateEventButton flag is true) can create events from Events page.
- Uses shadcn Calendar with pointer-events-auto to ensure interactivity in dialogs.

## E2E smoke tests
Playwright specs are under e2e/*.spec.ts and currently skipped (auth‑dependent):
- messages.spec.ts, events.spec.ts, social.spec.ts
Enable by removing test.skip when you have test users.
