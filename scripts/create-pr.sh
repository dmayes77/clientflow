#!/bin/bash

# Create PR from dev to main and monitor tests
# Usage: ./scripts/create-pr.sh

set -e

# Use ARM Homebrew binaries
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Creating Pull Request: dev → main${NC}"
echo ""

# Ensure we're up to date
echo -e "${BLUE}🔄 Syncing branches...${NC}"
git fetch origin

# Get latest commits on dev
LATEST_COMMITS=$(git log origin/main..origin/dev --oneline --pretty=format:"- %s" | head -10)

if [ -z "$LATEST_COMMITS" ]; then
  echo -e "${YELLOW}⚠️  No new commits to merge${NC}"
  echo "Dev and main are already in sync"
  exit 0
fi

echo -e "${BLUE}📋 Changes to be included:${NC}"
echo "$LATEST_COMMITS"
echo ""

# Create PR
echo -e "${BLUE}🚀 Creating pull request...${NC}"
PR_URL=$(gh pr create --base main --head dev \
  --title "Deploy to Production" \
  --body "## Summary
Deploying latest changes from dev to production

## Changes
$LATEST_COMMITS

## Pre-merge Checklist
- ✅ Tested on dev.getclientflow.app
- ⏳ Waiting for CI/CD tests to pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)" 2>&1)

if [[ $PR_URL == *"http"* ]]; then
  echo -e "${GREEN}✅ Pull request created${NC}"
  echo -e "${BLUE}🔗 PR URL: ${PR_URL}${NC}"
else
  # PR might already exist
  echo -e "${YELLOW}⚠️  ${PR_URL}${NC}"
  PR_URL=$(gh pr list --head dev --base main --json url --jq '.[0].url')
  if [ -n "$PR_URL" ]; then
    echo -e "${BLUE}🔗 Existing PR: ${PR_URL}${NC}"
  fi
fi

# Get PR number
PR_NUMBER=$(gh pr list --head dev --base main --json number --jq '.[0].number')

if [ -z "$PR_NUMBER" ]; then
  echo -e "${RED}❌ Could not find PR number${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}⏳ Monitoring test status...${NC}"
echo ""

# Monitor checks
while true; do
  CHECKS=$(gh pr checks $PR_NUMBER 2>&1 || echo "pending")

  # Check if tests are complete
  if echo "$CHECKS" | grep -q "fail"; then
    echo -e "${RED}❌ Tests failed!${NC}"
    echo ""
    gh pr checks $PR_NUMBER
    echo ""
    echo -e "${YELLOW}💡 Fix the issues and push to dev to re-run tests${NC}"
    exit 1
  elif echo "$CHECKS" | grep -q "pass" && ! echo "$CHECKS" | grep -q "pending"; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    gh pr checks $PR_NUMBER
    echo ""
    echo -e "${GREEN}🎉 Ready to merge!${NC}"
    echo -e "${BLUE}🔗 ${PR_URL}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Merge the PR to deploy to production${NC}"
    exit 0
  else
    echo -e "${YELLOW}⏳ Tests running...${NC}"
    sleep 10
  fi
done
