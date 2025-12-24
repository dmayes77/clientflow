# Development Workflow

## Branch Strategy

We use a three-tier branch strategy for professional development:

- **`dev`** - Development branch (deployed to dev.getclientflow.app)
- **`staging`** - Staging/QA branch (deployed to staging.getclientflow.app)
- **`main`** - Production branch (deployed to getclientflow.app)

## Development Process

### Complete Feature Development Workflow

We follow a Netflix-style automated workflow with three environments:

```
┌─────────────────────────────────────────────────────────┐
│ FEATURE DEVELOPMENT (Fully Automated)                   │
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
6. Test/verify on dev environment
   │
7. When ready for staging:
   - Create PR: dev → staging
   - Review changes
   - Merge to staging → Auto-deploy to staging.getclientflow.app
   │
8. QA/testing on staging environment
   │
9. When ready for production:
   - Create PR: staging → main
   - Final review
   - Merge to main → Triggers automatic release! ✨
   │
10. Automatic release workflow:
    - Analyzes commits (conventional commits)
    - Determines version bump (feat: = minor, fix: = patch, breaking! = major)
    - Bumps version in package.json
    - Generates CHANGELOG.md
    - Creates git tag
    - Creates GitHub release
    - Auto-deploys to getclientflow.app
    - Syncs staging and dev branches ✨
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

# Commit with conventional commit format
git add .
git commit -m "feat: your feature description"
# or
git commit -m "fix: bug description"
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

### 4. Promote to Staging

When `dev` is stable:

1. Create PR from `dev` to `staging`
2. Review all changes
3. Merge the PR
4. Staging auto-deploys to **staging.getclientflow.app**

### 5. QA on Staging

- Full QA testing on **staging.getclientflow.app**
- User acceptance testing
- Final verification before production

### 6. Deploy to Production

When `staging` is approved:

1. Create PR from `staging` to `main`
2. Final review of all changes
3. Ensure CI passes
4. Merge the PR
5. **Automatic release workflow triggers!**
   - Version automatically bumped based on commits
   - CHANGELOG.md updated
   - Git tag created
   - GitHub release created
   - Production deploys to **getclientflow.app**
   - `staging` and `dev` automatically synced

## Conventional Commits

Our automated release system uses conventional commits to determine version bumps:

### Commit Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types and Version Bumps

- **`feat:`** or **`feature:`** - New feature → **MINOR** version bump (1.6.0 → 1.7.0)
- **`fix:`** - Bug fix → **PATCH** version bump (1.6.0 → 1.6.1)
- **`feat!:`** or **`BREAKING CHANGE:`** - Breaking change → **MAJOR** version bump (1.6.0 → 2.0.0)
- **`docs:`** - Documentation → PATCH
- **`style:`** - Code style → PATCH
- **`refactor:`** - Code refactoring → PATCH
- **`test:`** - Tests → PATCH
- **`chore:`** - Maintenance → PATCH

### Examples

```bash
# Minor version bump (new feature)
git commit -m "feat: Add user profile page"
git commit -m "feature: Implement dark mode toggle"

# Patch version bump (bug fix)
git commit -m "fix: Resolve login timeout issue"
git commit -m "fix: Correct price calculation in checkout"

# Major version bump (breaking change)
git commit -m "feat!: Replace REST API with GraphQL"
git commit -m "feat: Redesign authentication system

BREAKING CHANGE: All API tokens must be regenerated"
```

## CI/CD Pipeline

Our GitHub Actions workflow automatically:

### On Push to `dev`:
- ✅ Runs ESLint
- ✅ Builds application
- 🚀 Deploys to **dev.getclientflow.app** (Vercel preview)

### On Push to `staging`:
- ✅ Runs ESLint
- ✅ Builds application
- 🚀 Deploys to **staging.getclientflow.app** (Vercel production alias)

### On Push to `main`:
- ✅ Runs ESLint
- ✅ Builds application
- 🚀 Deploys to **getclientflow.app** (Vercel production)
- 🤖 **Automatic Release:**
  - Analyzes commits since last release
  - Determines version bump type
  - Updates package.json
  - Generates CHANGELOG.md
  - Creates git tag
  - Creates GitHub release
  - Syncs staging and dev branches

### On Pull Requests:
- ✅ Runs ESLint
- ✅ Builds application
- 📋 Comments build status on PR

## Manual Release (Optional)

If you need to create a release manually:

**Option A: Via GitHub Actions**
1. Go to [GitHub Actions](https://github.com/dmayes77/clientflow/actions)
2. Select "Release" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Choose version bump type (patch/minor/major)
6. Click "Run workflow"

**Option B: Via Command Line**
```bash
# Patch release (bug fixes)
npm run release

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

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

## Vercel Domain Configuration

To set up the staging domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `staging.getclientflow.app`
3. Configure DNS (if using custom domain)
4. Assign domain to the `staging` branch deployments

## Branch Protection (Recommended)

For production safety, consider enabling branch protection:

### Main Branch Protection
1. Go to GitHub Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (lint)
   - ✅ Require conversation resolution before merging

### Staging Branch Protection
1. Add rule for `staging` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (lint)

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

# Promote through environments
# dev → staging → main (via Pull Requests)

# Sync branches manually (if needed)
git checkout staging
git merge main
git push origin staging

git checkout dev
git merge staging
git push origin dev
```

### Environment URLs

- **Development:** https://dev.getclientflow.app (from `dev` branch)
- **Staging:** https://staging.getclientflow.app (from `staging` branch)
- **Production:** https://getclientflow.app (from `main` branch)
- **GitHub Actions:** https://github.com/dmayes77/clientflow/actions
- **Releases:** https://github.com/dmayes77/clientflow/releases

### Workflow Summary

1. Create feature branch from `dev`
2. Push changes → CI runs
3. Create PR to `dev` → merge → deploys to dev.getclientflow.app
4. Test on dev environment
5. Create PR from `dev` to `staging` → merge → deploys to staging.getclientflow.app
6. QA on staging environment
7. Create PR from `staging` to `main` → merge → triggers automatic release
8. Automatic release:
   - Determines version from commits
   - Creates tag and GitHub release
   - Deploys to getclientflow.app
   - Syncs staging and dev ✨

## Version History

All releases are automatically tracked in:
- **CHANGELOG.md** - Detailed changelog with all commits
- **GitHub Releases** - https://github.com/dmayes77/clientflow/releases
- **Git Tags** - `git tag -l` to see all versions
