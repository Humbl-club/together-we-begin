# Configuration Guide - SMTP & Stripe

## 1. SMTP Configuration for info@humble.club

### Option A: Using Gmail/Google Workspace (Recommended if using Google)

#### Step 1: Generate App Password
1. Go to https://myaccount.google.com/security
2. Enable 2-factor authentication (required)
3. Search for "App passwords"
4. Create new app password for "Mail"
5. Copy the 16-character password

#### Step 2: Configure in Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click on **SMTP Settings**
4. Enter these settings:

```
Host: smtp.gmail.com
Port: 587
Username: info@humble.club
Password: [Your 16-character app password]
Sender email: info@humble.club
Sender name: Humble Girls Club
```

5. Enable "Secure connection (TLS)"
6. Test the configuration

### Option B: Using Other Email Providers

#### For Microsoft/Outlook:
```
Host: smtp-mail.outlook.com
Port: 587
Username: info@humble.club
Password: [Your email password]
```

#### For Custom Domain (e.g., Namecheap, GoDaddy):
Check your hosting provider's SMTP settings. Usually:
```
Host: mail.yourdomain.com or smtp.yourdomain.com
Port: 587 (TLS) or 465 (SSL)
Username: info@humble.club
Password: [Your email password]
```

### Step 3: Customize Email Templates in Supabase
1. In Authentication → Email Templates
2. Customize these templates with your branding:
   - **Confirm signup** - Welcome email
   - **Reset password** - Password reset
   - **Magic Link** - Passwordless login
   - **Change Email** - Email change confirmation

Example template:
```html
<h2>Welcome to Humble Girls Club! 💕</h2>
<p>Hi {{ .Email }},</p>
<p>Welcome to our exclusive community! Click below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>Best,<br>The Humble Girls Club Team</p>
```

---

## 2. Stripe Configuration

### Use RESTRICTED KEY for Security ✅

Your app only needs these Stripe permissions:
- **Checkout Sessions** - Write (to create payment sessions)
- **Customers** - Read (to check existing customers)
- **Customers** - Write (to create new customers)

### Step 1: Create Restricted Key
1. Go to https://dashboard.stripe.com/apikeys
2. Click "Create restricted key"
3. Name it: "Humble Girls Club - Supabase Edge Functions"
4. Set these permissions:

| Resource | Permission |
|----------|------------|
| **Checkout Sessions** | Write ✅ |
| **Customers** | Write ✅ |
| **Webhook Endpoints** | None ❌ |
| **Products** | None ❌ |
| **Prices** | None ❌ |
| **Payment Intents** | None ❌ |
| **Charges** | None ❌ |
| **Refunds** | None ❌ |
| All others | None ❌ |

5. Click "Create key"
6. Copy the key (starts with `rk_live_` for production or `rk_test_` for test mode)

### Step 2: Add to Supabase Edge Functions
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Go to **Settings** or **Environment Variables**
4. Add:
   ```
   STRIPE_SECRET_KEY = rk_live_[your-restricted-key]
   ```

### Step 3: Configure Stripe Checkout Settings
In Stripe Dashboard → Settings → Checkout:
1. Set your domain: `https://yourapp.com`
2. Enable "Client-only integration"
3. Add success URL: `https://yourapp.com/events?payment=success`
4. Add cancel URL: `https://yourapp.com/events?payment=cancelled`

### Step 4: Test Mode First!
1. Start with test keys (`rk_test_...`)
2. Use test cards: `4242 4242 4242 4242`
3. Once working, switch to live keys

---

## 3. Optional: Custom Email Function

If you want to use the custom email edge function for event confirmations:

### Update the Edge Function to Use SMTP
Replace Resend with SMTP in `/supabase/functions/send-email/index.ts`:

```typescript
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const client = new SMTPClient({
  connection: {
    hostname: "smtp.gmail.com",
    port: 587,
    tls: true,
    auth: {
      username: "info@humble.club",
      password: Deno.env.get("SMTP_PASSWORD")!,
    },
  },
});

// In your serve function:
await client.send({
  from: "info@humble.club",
  to: to,
  subject: emailContent.subject,
  content: "text/html",
  html: emailContent.html,
});
```

Then add `SMTP_PASSWORD` to Supabase Edge Functions environment.

---

## 4. Environment Variables Summary

Add these to Supabase Edge Functions:

```env
# Stripe (Restricted Key)
STRIPE_SECRET_KEY=rk_live_51... # Your restricted Stripe key

# Optional: If using custom email function
SMTP_PASSWORD=xxxx xxxx xxxx xxxx # Gmail app password
```

---

## 5. Testing Checklist

### SMTP Testing:
- [ ] Send test email from Supabase Dashboard
- [ ] Sign up with new account - verify welcome email
- [ ] Reset password - verify reset email
- [ ] Check spam folder if emails not received

### Stripe Testing:
- [ ] Use test mode first (rk_test_...)
- [ ] Create event registration
- [ ] Complete checkout with test card: 4242 4242 4242 4242
- [ ] Verify registration created in database
- [ ] Check Stripe Dashboard for payment

---

## Security Best Practices

1. **Never commit keys to code** - Use environment variables
2. **Use restricted Stripe keys** - Minimum permissions needed
3. **Use app passwords** - Not your main email password
4. **Enable 2FA** - On both Stripe and email accounts
5. **Rotate keys regularly** - Every 90 days
6. **Monitor usage** - Check Stripe Dashboard for unusual activity

---

## Troubleshooting

### Email Issues:
- **"Authentication failed"** - Check app password is correct
- **"Connection refused"** - Check port and TLS settings
- **Emails in spam** - Add SPF/DKIM records to your domain

### Stripe Issues:
- **"Invalid API key"** - Check key is in correct environment
- **"Insufficient permissions"** - Add required permissions to restricted key
- **"No such customer"** - Normal, customer will be created

### Need Help?
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com
- Gmail SMTP: https://support.google.com/mail/answer/185833