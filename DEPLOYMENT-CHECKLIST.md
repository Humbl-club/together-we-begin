# Vercel Deployment Checklist

## Pre-Deployment

### 1. Local Verification
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run check` to verify TypeScript types
- [ ] Run `npm run build` locally to ensure build succeeds
- [ ] Test the production build locally with `npm start`

### 2. Environment Setup
- [ ] Copy `.env.vercel` as reference for environment variables
- [ ] Verify Supabase credentials are correct
- [ ] Confirm Google Maps API key is valid and restricted

### 3. Code Preparation
- [ ] All sensitive data removed from codebase
- [ ] No hardcoded API keys or secrets
- [ ] Production URLs configured correctly

## Deployment Process

### 1. Initial Deployment
```bash
# Make the script executable
chmod +x deploy-to-vercel.sh

# Run the deployment
./deploy-to-vercel.sh
```

### 2. Vercel Dashboard Configuration

#### Environment Variables (Settings → Environment Variables)
Add these variables for Production, Preview, and Development:

- [ ] `VITE_SUPABASE_URL` = `https://YOUR-PROJECT.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `[your-anon-key]`
- [ ] `VITE_GOOGLE_MAPS_API_KEY` = `[your-maps-key]`

Optional variables:
- [ ] `VITE_APP_NAME` = `Humbl Girls Club`
- [ ] `VITE_ENABLE_PWA` = `true`
- [ ] `VITE_ENABLE_OFFLINE` = `true`

### 3. Supabase Configuration

#### Allowed Origins (Project Settings → API)
Add your deployment URLs:
- [ ] `https://together-we-begin.vercel.app`
- [ ] `https://[your-custom-domain]`
- [ ] `http://localhost:5000` (for local development)

#### Edge Functions Secrets (Edge Functions → Secrets)
If using payments:
- [ ] `STRIPE_SECRET_KEY` (with domain restriction)
- [ ] `STRIPE_WEBHOOK_SECRET`

### 4. Custom Domain Setup (Optional)

#### In Vercel (Settings → Domains)
- [ ] Add custom domain
- [ ] Configure DNS records as instructed
- [ ] Enable HTTPS (automatic)
- [ ] Set up www redirect if needed

#### DNS Configuration
Add these records to your domain provider:
- [ ] A record: `@` → `76.76.21.21`
- [ ] CNAME record: `www` → `cname.vercel-dns.com`

## Post-Deployment Verification

### 1. Core Functionality Tests

#### Authentication
- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Password reset flow
- [ ] Logout functionality

#### Organization Management
- [ ] Create new organization
- [ ] Switch between organizations
- [ ] Update organization settings
- [ ] View organization members

#### Theme Customization
- [ ] Change theme colors
- [ ] Update typography (fonts)
- [ ] Test dark mode toggle
- [ ] Verify custom branding

#### Dashboard
- [ ] Drag and drop widgets
- [ ] Save dashboard layout
- [ ] Widget data loading
- [ ] Real-time updates

### 2. Performance Checks

#### Load Times
- [ ] Initial page load < 3s
- [ ] Time to Interactive < 5s
- [ ] First Contentful Paint < 1.5s

#### Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify touch interactions
- [ ] Check responsive design

### 3. Security Verification

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No exposed API keys in source
- [ ] RLS policies working

### 4. Monitoring Setup

#### Vercel Analytics
- [ ] Analytics enabled in dashboard
- [ ] Web Vitals tracking
- [ ] Error tracking configured

#### Logs
- [ ] Check Function logs for errors
- [ ] Monitor build logs
- [ ] Review deployment logs

## Rollback Plan

If issues are detected:

1. **Immediate Rollback**
   ```bash
   vercel rollback
   ```

2. **Promote Previous Deployment**
   - Go to Vercel Dashboard
   - Select Deployments
   - Find last stable deployment
   - Click "Promote to Production"

## Production Maintenance

### Daily Checks
- [ ] Monitor error rates in Vercel Analytics
- [ ] Check Supabase dashboard for database health
- [ ] Review user feedback channels

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check for dependency updates
- [ ] Backup database (if not automated)

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost analysis (Vercel + Supabase)

## Support Contacts

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Status: https://www.vercel-status.com/
- Docs: https://vercel.com/docs

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Status: https://status.supabase.com/
- Docs: https://supabase.com/docs

## Common Issues & Solutions

### Build Failures
- Check Node version compatibility (18.x or 20.x)
- Clear node_modules and package-lock.json
- Verify all environment variables are set

### 404 Errors on Routes
- Ensure `rewrites` in vercel.json is configured
- Check that SPA routing is handled correctly

### Supabase Connection Issues
- Verify environment variables are correct
- Check Allowed Origins in Supabase
- Ensure RLS policies aren't blocking requests

### Performance Issues
- Enable caching headers (already configured)
- Optimize images and assets
- Use Vercel's Image Optimization

## Success Criteria

Your deployment is successful when:
- ✅ All functionality tests pass
- ✅ Performance metrics meet targets
- ✅ No console errors in production
- ✅ Mobile experience is smooth
- ✅ Real-time features work correctly
- ✅ Users can successfully sign up and use the platform
