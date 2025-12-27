# Troubleshooting Guide

## Common Build & Deployment Issues

### Vercel Build Cache Error

**Error:**
```
Error: ENOENT: no such file or directory, lstat '/vercel/path0/.next/server/app/(marketing)/(home)/page_client-reference-manifest.js'
```

**Cause:**
Stale Next.js build cache on Vercel. This happens when Next.js build artifacts become corrupted or out of sync.

**Solution:**
Trigger a fresh build to clear Vercel's cache:

```bash
# Method 1: Empty commit (recommended)
git commit --allow-empty -m "chore: trigger fresh build to clear Vercel cache"
git push origin dev

# Method 2: Clear local cache then redeploy
rm -rf .next node_modules/.cache
git add .
git commit -m "chore: clear build cache"
git push origin dev
```

**Prevention:**
This is typically a transient issue with Vercel's build system and doesn't indicate a problem with your code.

---

### Database Migration Issues

**Error:**
```
Prisma schema is not in sync with your migration history
```

**Solution:**
```bash
# Sync schema with database (for development)
npx prisma db push --accept-data-loss

# For production, create proper migration
npx prisma migrate dev --name descriptive_migration_name
```

---

### Missing System Templates

**Error:**
```
System template not found: payment_reminder_gentle
```

**Cause:**
System templates not seeded for tenant.

**Solution:**
Run seeding script:
```bash
node scripts/seed-system-templates.js
```

Verify seeding:
```bash
node scripts/verify-seeding.js
```

---

### Missing System Tags

**Error:**
```
Tag not found or Invalid status tag
```

**Cause:**
System tags not seeded for tenant.

**Solution:**
Run seeding script:
```bash
node scripts/create-system-tags.mjs
```

Verify:
```bash
node scripts/verify-seeding.js
```

---

### Build Fails on Import Errors

**Error:**
```
Module not found: Can't resolve '@/lib/...'
```

**Cause:**
- Missing file
- Incorrect import path
- Case sensitivity issue (macOS vs Linux)

**Solution:**
1. Verify file exists at the path
2. Check case sensitivity (Linux is case-sensitive)
3. Ensure `jsconfig.json` or `tsconfig.json` has correct path mappings

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Cron Jobs Not Running

**Symptoms:**
- Payment reminders not sending
- Overdue invoices not updating
- Workflows not processing

**Check:**
1. Verify cron configuration in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-payment-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

2. Check cron secret is set in Vercel environment variables:
- `CRON_SECRET` - Secret token for cron authentication

3. Test manually:
```bash
curl -X GET "https://your-app.vercel.app/api/cron/send-payment-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

### Email Templates Not Rendering Variables

**Symptoms:**
Email shows `{{contact.firstName}}` instead of actual name.

**Cause:**
Template variables not passed correctly or typo in variable name.

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Verify context is passed to `sendTemplatedEmail()`:
```javascript
await sendTemplatedEmail({
  to: contact.email,
  subject: template.subject,
  body: template.body,
  variables: {
    contact: {
      firstName: contact.name?.split(" ")[0],
      name: contact.name,
      email: contact.email,
    },
    // ... other variables
  },
});
```

3. Check `replaceTemplateVariables()` in `lib/email.js`

---

### API Route 404 Errors

**Symptoms:**
API endpoints return 404 in production but work locally.

**Causes:**
1. File naming issue (must be `route.js` not `route.ts` if using JS)
2. Missing export of HTTP method functions
3. Dynamic route syntax incorrect

**Solution:**
1. Ensure API route exports correct method:
```javascript
// ✅ Correct
export async function GET(request) { }
export async function POST(request) { }

// ❌ Wrong
export default function handler(req, res) { }
```

2. Check file structure:
```
app/api/
  ├── users/
  │   ├── route.js          // /api/users
  │   └── [id]/
  │       └── route.js      // /api/users/:id
```

---

### Database Connection Issues

**Error:**
```
Error: P1001: Can't reach database server
```

**Solution:**
1. Verify `DATABASE_URL` environment variable is set
2. Check Neon database is active (doesn't auto-pause)
3. Verify IP allowlist if using connection pooling
4. Test connection:
```bash
npx prisma db pull
```

---

### Stripe Webhook Failures

**Error:**
```
Stripe webhook signature verification failed
```

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Use correct webhook secret for environment:
   - Test mode: `whsec_test_...`
   - Live mode: `whsec_...`
3. Ensure webhook endpoint is:
   - URL: `https://your-app.com/api/webhooks/stripe`
   - Version: Latest API version
   - Events: All payment events selected

---

## Debugging Commands

### Check Environment
```bash
# Verify Node version
node --version  # Should be 18.x or higher

# Verify pnpm/npm
npm --version

# Check git status
git status
git log --oneline -5
```

### Database
```bash
# Check schema sync
npx prisma validate

# View database
npx prisma studio

# Reset database (DANGER - deletes all data)
npx prisma migrate reset
```

### Deployment
```bash
# Check deployment status
make status

# View recent deployments
gh run list --branch dev --limit 5

# Deploy to dev
make deploy-dev MSG="your message"
```

### Logs
```bash
# Vercel logs (requires Vercel CLI)
vercel logs your-app-url

# GitHub Actions
# Visit: https://github.com/dmayes77/clientflow/actions
```

---

## Emergency Rollback

If production is broken and you need to rollback immediately:

```bash
# Find last working commit
git log --oneline -10

# Reset to that commit
git reset --hard <commit-hash>

# Force push (DANGER - only in emergencies)
git push -f origin main

# Or create revert commit (safer)
git revert <bad-commit-hash>
git push origin main
```

---

## Getting Help

1. **Check logs first:**
   - Vercel deployment logs
   - GitHub Actions logs
   - Browser console (F12)

2. **Search for error message** in:
   - Next.js documentation
   - Prisma documentation
   - Stripe documentation

3. **Common resources:**
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - Vercel: https://vercel.com/docs

4. **Project documentation:**
   - `SYSTEM_TEMPLATES_IMPLEMENTATION.md`
   - `MIGRATION_SUMMARY.md`
   - `README.md`
