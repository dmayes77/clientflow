#!/bin/bash

# Check deployment and workflow status
# Usage: ./scripts/check-status.sh

set -e

# Use ARM Homebrew binaries
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 ClientFlow Deployment Status${NC}"
echo ""

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Git status
echo -e "${BLUE}🔍 Git Status:${NC}"
git status --short

if [ -z "$(git status --short)" ]; then
  echo "  ✅ Working directory clean"
fi
echo ""

# Open PRs
echo -e "${BLUE}📝 Open Pull Requests:${NC}"
OPEN_PRS=$(gh pr list --json number,title,headRefName,baseRefName,url)

if [ "$(echo "$OPEN_PRS" | jq '. | length')" -eq 0 ]; then
  echo "  No open PRs"
else
  echo "$OPEN_PRS" | jq -r '.[] | "  #\(.number): \(.title) (\(.headRefName) → \(.baseRefName))\n  🔗 \(.url)"'
fi
echo ""

# Latest GitHub Actions runs
echo -e "${BLUE}🔄 Recent GitHub Actions (last 3):${NC}"
gh run list --limit 3 --json status,conclusion,name,headBranch,updatedAt,url | \
  jq -r '.[] | "  \(.name) [\(.headBranch)]\n  Status: \(.status) | Conclusion: \(.conclusion // "pending")\n  🔗 \(.url)\n"'

# Latest release
echo -e "${BLUE}📦 Latest Release:${NC}"
LATEST_RELEASE=$(gh release list --limit 1 --json tagName,publishedAt,url 2>&1)

if [ $? -eq 0 ] && [ "$(echo "$LATEST_RELEASE" | jq '. | length')" -gt 0 ]; then
  echo "$LATEST_RELEASE" | jq -r '.[] | "  Version: \(.tagName)\n  Published: \(.publishedAt)\n  🔗 \(.url)"'
else
  echo "  No releases yet"
fi
echo ""

# Deployment URLs
echo -e "${BLUE}🌐 Deployment URLs:${NC}"
echo "  Production: https://getclientflow.app"
echo "  Dev:        https://dev.getclientflow.app"
echo ""
