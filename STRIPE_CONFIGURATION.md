# Stripe Configuration (Sanitized)

This project integrates with Stripe. Never commit real API keys to Git.

Use environment variables for all secrets:

- STRIPE_PUBLIC_KEY: Your publishable key (pk_live... or pk_test...)
- STRIPE_SECRET_KEY: Your secret key (sk_live... or sk_test...)
- STRIPE_WEBHOOK_SECRET: Your webhook signing secret (optional, if using webhooks)

Example entries for a local `.env` or deployment environment variables:

```
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Notes:
- Do not place real values in any tracked file.
- Configure these in your deployment platform (e.g., Vercel → Project Settings → Environment Variables).
- If you previously had keys in history, we have purged them and added this sanitized guide.

