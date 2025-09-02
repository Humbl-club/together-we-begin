# Production Deployment Guide

## 🌐 Live URLs
- **Production App**: https://together-we-begin-cy20ey4l0-lazy-53aeee76.vercel.app
- **Supabase Dashboard**: https://app.supabase.com/project/ynqdddwponrqwhtqfepi
- **Database URL**: https://YOUR-PROJECT.supabase.co

## 🔑 Environment Variables

### Required for Production:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### For Stripe (in Supabase Edge Functions):
```env
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
```

## 📱 Quick Deployment Commands

### Deploy to Vercel:
```bash
./deploy-to-vercel.sh
```

### Deploy to Netlify:
```bash
netlify deploy --prod
```

### Update Production Database:
```bash
npx supabase db push --project-ref ynqdddwponrqwhtqfepi
```

### Deploy Edge Functions:
```bash
npx supabase functions deploy --project-ref ynqdddwponrqwhtqfepi
```

## ✅ Production Checklist
- [ ] Environment variables configured in hosting platform
- [ ] Stripe secret key added to Supabase Edge Functions
- [ ] SMTP configured for info@humble.club
- [ ] Custom domain configured (humble.club)
- [ ] SSL certificate active
- [ ] Database backups enabled
- [ ] Monitoring configured

## 🎯 Environment Management

### Switch to Local Development:
```bash
./switch-environment.sh
# Select option 1
```

### Switch to Production Testing:
```bash
./switch-environment.sh
# Select option 2
```

## 🚀 Deployment Process

1. **Test Locally**: Run `npm run dev:frontend`
2. **Build**: Run `npm run build:vercel`
3. **Deploy**: Run `./deploy-to-vercel.sh`
4. **Configure**: Add environment variables in Vercel dashboard
5. **Test**: Visit your live URL and test functionality

## 🔧 Troubleshooting

### Build Issues:
- Check TypeScript errors: `npm run check`
- Verify dependencies: `npm install`
- Clear cache: `rm -rf node_modules/.vite`

### Runtime Issues:
- Check environment variables in Vercel dashboard
- Verify Supabase connection
- Check browser console for errors
