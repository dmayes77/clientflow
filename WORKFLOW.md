# Development Workflow

## Branch Strategy

We use a two-branch strategy for development:

- **`main`** - Production branch (deployed to getclientflow.app)
- **`dev`** - Development branch (deployed to preview environment)

## Development Process

### 1. Working on Features

All development work should be done on the `dev` branch:

```bash
# Switch to dev branch
git checkout dev

# Pull latest changes
git pull origin dev

# Make your changes
# ...

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin dev
```

### 2. Deploying to Production

When `dev` is stable and ready for production:

```bash
# Switch to main branch
git checkout main

# Merge dev into main
git merge dev

# Push to production
git push origin main
```

## CI/CD Pipeline

Our GitHub Actions workflow automatically:

### On Push to `dev`:
- ✅ Runs ESLint
- 🚀 Deploys to Vercel preview environment

### On Push to `main`:
- ✅ Runs ESLint
- 🚀 Deploys to Vercel production

### On Pull Requests to `main`:
- ✅ Runs ESLint

## Required Secrets

To enable CI/CD, add these secrets in GitHub Settings → Secrets and variables → Actions:

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Automated Setup

We provide a script to automate the CI/CD setup process:

```bash
npm run setup-cicd
```

This script will:
1. ✅ Check if Vercel CLI is installed
2. ✅ Verify Vercel authentication
3. ✅ Link your project to Vercel
4. ✅ Get project credentials
5. ✅ Optionally set GitHub secrets automatically (if GitHub CLI is installed)
6. ✅ Provide manual setup instructions if needed

### Manual Setup

If you prefer to set up manually:

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `npx vercel link --yes`
3. Get IDs: `cat .vercel/project.json`
4. Create Vercel token: https://vercel.com/account/tokens
5. Add GitHub secrets: https://github.com/YOUR_REPO/settings/secrets/actions

## Commit Message Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: Add trial banner with countdown timer
fix: Resolve undefined data in public booking page
docs: Update README with setup instructions
```

## Branch Protection (Recommended)

For production safety, consider enabling branch protection on `main`:

1. Go to GitHub Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (lint)
   - ✅ Require conversation resolution before merging

This ensures all production changes go through PR review.
