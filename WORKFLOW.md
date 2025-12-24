# Development Workflow

## Branch Strategy

We use a two-branch strategy for development:

- **`main`** - Production branch (deployed to getclientflow.app)
- **`dev`** - Development branch (deployed to preview environment)

## Development Process

### Complete Feature Development Workflow

We follow an industry-standard workflow that ensures code quality and safe deployments:

```
┌─────────────────────────────────────────────────────────┐
│ FEATURE DEVELOPMENT                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
1. Work on feature branch: feature/new-booking-flow
   │
2. Push → CI runs (lint, build)
   │
3. Create PR to dev
   │
4. Code review + CI passes
   │
5. Merge to dev → Auto-deploy to dev.getclientflow.app
   │
6. QA/testing on dev environment
   │
7. When ready for production:
   - Create PR: dev → main
   - Review changes
   - Merge to main → Auto-deploy to getclientflow.app
   │
8. After main deployment succeeds:
   - Manually trigger Release workflow
   - Choose version bump (patch/minor/major)
   - Creates tag, changelog, GitHub release
   │
9. Dev automatically syncs with main ✨
```

### 1. Create a Feature Branch

Start new features from the latest `dev` branch:

```bash
# Switch to dev and update
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 2. Create Pull Request to Dev

1. Go to GitHub and create a PR: `feature/your-feature-name` → `dev`
2. CI will automatically run (lint, build)
3. Review the changes
4. Merge when CI passes

### 3. Testing on Dev Environment

After merging to `dev`:
- Auto-deploys to **dev.getclientflow.app**
- Test your changes thoroughly
- Verify everything works as expected

### 4. Deploy to Production

When `dev` is stable and ready for production:

```bash
# Create PR: dev → main
# (Or use GitHub UI)
```

1. Create PR from `dev` to `main`
2. Review all changes since last release
3. Ensure CI passes
4. Merge the PR
5. Production auto-deploys to **getclientflow.app**

### 5. Create a Release

After production deployment succeeds:

**Option A: Via GitHub Actions (Recommended)**
1. Go to [GitHub Actions](https://github.com/dmayes77/clientflow/actions)
2. Select "Release" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Choose version bump type:
   - **patch** (1.6.0 → 1.6.1) - Bug fixes
   - **minor** (1.6.0 → 1.7.0) - New features
   - **major** (1.6.0 → 2.0.0) - Breaking changes
6. Click "Run workflow"

The workflow will automatically:
- ✅ Bump version in package.json
- ✅ Generate changelog from commits
- ✅ Create git tag (e.g., v1.6.0)
- ✅ Create GitHub release
- ✅ Sync dev branch with main

**Option B: Via Command Line**
```bash
# Patch release (bug fixes)
npm run release

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

Note: You'll still need to manually sync dev with main if using command line releases.

## CI/CD Pipeline

Our GitHub Actions workflow automatically:

### On Push to `dev`:
- ✅ Runs ESLint
- ✅ Builds application
- 🚀 Deploys to **dev.getclientflow.app** (Vercel preview)

### On Push to `main`:
- ✅ Runs ESLint
- ✅ Builds application
- 🚀 Deploys to **getclientflow.app** (Vercel production)

### On Pull Requests:
- ✅ Runs ESLint
- ✅ Builds application
- 📋 Comments build status on PR

### On Manual Release Trigger:
- ✅ Bumps version in package.json
- ✅ Generates changelog from git commits
- ✅ Creates git tag
- ✅ Creates GitHub release
- ✅ Syncs dev branch with main

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

## Quick Reference

### Common Commands

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Work on feature
git add .
git commit -m "feat: my feature description"
git push origin feature/my-feature

# Release (after merging to main)
npm run release          # Patch: 1.6.0 → 1.6.1
npm run release:minor    # Minor: 1.6.0 → 1.7.0
npm run release:major    # Major: 1.6.0 → 2.0.0

# Sync dev with main (if needed manually)
git checkout dev
git merge main
git push origin dev
```

### Environment URLs

- **Production:** https://getclientflow.app (from `main` branch)
- **Development:** https://dev.getclientflow.app (from `dev` branch)
- **GitHub Actions:** https://github.com/dmayes77/clientflow/actions
- **Releases:** https://github.com/dmayes77/clientflow/releases

### Workflow Summary

1. Create feature branch from `dev`
2. Push changes → CI runs
3. Create PR to `dev` → merge
4. Test on dev.getclientflow.app
5. Create PR from `dev` to `main` → merge
6. Production deploys to getclientflow.app
7. Trigger release workflow on GitHub Actions
8. Dev automatically syncs with main ✨
