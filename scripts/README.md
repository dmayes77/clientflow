# Deployment Scripts

Automated deployment scripts for the 2-tier workflow (dev → main).

## Quick Start

```bash
# 1. Deploy to dev
./scripts/deploy-dev.sh "Add new feature"

# 2. Create PR to main (with automated test monitoring)
./scripts/create-pr.sh

# 3. Deploy to production (merge PR + monitor release)
./scripts/deploy-production.sh

# Check status anytime
./scripts/check-status.sh
```

## Scripts

### `deploy-dev.sh`
Deploy changes to dev environment for testing.

**Usage:**
```bash
./scripts/deploy-dev.sh "your commit message"
```

**What it does:**
- Commits all changes to dev branch
- Pushes to GitHub
- Triggers Vercel dev deployment
- Shows deployment status
- Provides dev URL: https://dev.getclientflow.app

### `create-pr.sh`
Create PR from dev to main and monitor CI/CD tests.

**Usage:**
```bash
./scripts/create-pr.sh
```

**What it does:**
- Creates PR: dev → main
- Lists all changes to be deployed
- Monitors lint & test status in real-time
- Shows pass/fail results
- Provides PR URL

### `deploy-production.sh`
Merge PR and deploy to production with auto-release.

**Usage:**
```bash
./scripts/deploy-production.sh [PR_NUMBER]
```

**What it does:**
- Verifies tests passed
- Merges PR to main
- Monitors production deployment
- Tracks auto-release workflow:
  - Version bump
  - Changelog update
  - GitHub release creation
  - Dev branch sync
- Shows production URL: https://getclientflow.app

### `check-status.sh`
Check current deployment and workflow status.

**Usage:**
```bash
./scripts/check-status.sh
```

**What it shows:**
- Current branch
- Git working tree status
- Open pull requests
- Recent GitHub Actions runs
- Latest release version
- Deployment URLs

## Workflow Example

```bash
# Day 1: Working on a feature
./scripts/deploy-dev.sh "Add user dashboard"
# Review at dev.getclientflow.app

./scripts/deploy-dev.sh "Fix dashboard styling"
# Review again

# Day 2: Ready for production
./scripts/create-pr.sh
# Waits for tests to pass, shows results

./scripts/deploy-production.sh
# Deploys to production + creates release

# Check everything
./scripts/check-status.sh
```

## Features

✅ **Real-time feedback** - Scripts monitor and report status
✅ **Error handling** - Clear error messages with next steps
✅ **Color-coded output** - Easy to read status updates
✅ **Automated monitoring** - No need to check GitHub manually
✅ **Smart defaults** - Auto-detects PR numbers and branches

## Requirements

- GitHub CLI (`gh`) - installed ✅
- Git - installed ✅
- jq - for JSON parsing

Install jq if needed:
```bash
brew install jq
```

## No Webhooks Needed

These scripts use the GitHub CLI to poll for status, which is simpler and more reliable than setting up webhooks for a solo developer workflow. The polling interval is smart (10s) and stops once complete.
