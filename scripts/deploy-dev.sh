#!/bin/bash

# Deploy to Dev - Push to dev branch and track deployment
# Usage: ./scripts/deploy-dev.sh "commit message"

set -e

# Use ARM Homebrew binaries
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying to Dev Environment${NC}"
echo ""

# Check if we're on dev branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
  echo -e "${YELLOW}⚠️  Switching to dev branch...${NC}"
  git checkout dev
fi

# Get commit message
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Commit message required${NC}"
  echo "Usage: ./scripts/deploy-dev.sh \"your commit message\""
  exit 1
fi

COMMIT_MSG="$1"

# Add all changes
echo -e "${BLUE}📦 Adding changes...${NC}"
git add .

# Commit
echo -e "${BLUE}💾 Committing: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" || {
  echo -e "${YELLOW}⚠️  No changes to commit${NC}"
}

# Push to dev
echo -e "${BLUE}⬆️  Pushing to dev...${NC}"
git push origin dev

# Wait for deployment to start
echo ""
echo -e "${BLUE}⏳ Waiting for deployment to start...${NC}"
sleep 5

# Check GitHub Actions status
echo ""
echo -e "${BLUE}📊 GitHub Actions Status:${NC}"
gh run list --branch dev --limit 1 --json status,conclusion,name,updatedAt --jq '.[] | "Status: \(.status) | \(.name)"'

echo ""
echo -e "${GREEN}✅ Code pushed to dev branch${NC}"
echo -e "${BLUE}🔗 Dev URL: https://dev.getclientflow.app${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Review changes at dev.getclientflow.app"
echo "  2. When ready for production, run: ./scripts/create-pr.sh"
echo ""
