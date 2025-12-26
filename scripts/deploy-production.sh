#!/bin/bash

# Merge PR and monitor production deployment + auto-release
# Usage: ./scripts/deploy-production.sh [PR_NUMBER]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying to Production${NC}"
echo ""

# Get PR number from argument or find open PR
if [ -n "$1" ]; then
  PR_NUMBER=$1
else
  PR_NUMBER=$(gh pr list --head dev --base main --json number --jq '.[0].number')
fi

if [ -z "$PR_NUMBER" ]; then
  echo -e "${RED}❌ No open PR found from dev to main${NC}"
  echo "Create a PR first: ./scripts/create-pr.sh"
  exit 1
fi

# Check if tests passed
echo -e "${BLUE}🔍 Checking test status...${NC}"
CHECKS=$(gh pr checks $PR_NUMBER 2>&1 || echo "")

if echo "$CHECKS" | grep -q "fail"; then
  echo -e "${RED}❌ Tests failed! Cannot merge${NC}"
  gh pr checks $PR_NUMBER
  exit 1
elif ! echo "$CHECKS" | grep -q "pass"; then
  echo -e "${YELLOW}⚠️  Tests still running or not started${NC}"
  echo "Wait for tests to complete before deploying to production"
  exit 1
fi

echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Merge the PR
echo -e "${BLUE}🔀 Merging pull request #${PR_NUMBER}...${NC}"
gh pr merge $PR_NUMBER --squash --delete-branch=false

echo -e "${GREEN}✅ PR merged!${NC}"
echo ""

# Monitor deployment and release
echo -e "${BLUE}⏳ Monitoring production deployment...${NC}"
sleep 5

# Watch the latest workflow run
WORKFLOW_COUNT=0
MAX_WAIT=300 # 5 minutes
INTERVAL=10

while [ $WORKFLOW_COUNT -lt $((MAX_WAIT / INTERVAL)) ]; do
  echo ""
  echo -e "${BLUE}📊 Workflow Status:${NC}"

  # Get latest workflow run on main
  WORKFLOW_STATUS=$(gh run list --branch main --limit 1 --json status,conclusion,name,databaseId 2>&1)

  if [ $? -eq 0 ]; then
    STATUS=$(echo "$WORKFLOW_STATUS" | jq -r '.[0].status')
    CONCLUSION=$(echo "$WORKFLOW_STATUS" | jq -r '.[0].conclusion')
    NAME=$(echo "$WORKFLOW_STATUS" | jq -r '.[0].name')
    RUN_ID=$(echo "$WORKFLOW_STATUS" | jq -r '.[0].databaseId')

    echo "  Status: $STATUS"
    echo "  Workflow: $NAME"

    if [ "$STATUS" = "completed" ]; then
      if [ "$CONCLUSION" = "success" ]; then
        echo ""
        echo -e "${GREEN}✅ Production deployment successful!${NC}"
        echo ""

        # Get latest release
        echo -e "${BLUE}📦 Checking release...${NC}"
        LATEST_RELEASE=$(gh release list --limit 1 --json tagName,url 2>&1)

        if [ $? -eq 0 ]; then
          TAG=$(echo "$LATEST_RELEASE" | jq -r '.[0].tagName')
          RELEASE_URL=$(echo "$LATEST_RELEASE" | jq -r '.[0].url')

          echo -e "${GREEN}✅ Release created: ${TAG}${NC}"
          echo -e "${BLUE}🔗 Release: ${RELEASE_URL}${NC}"
        fi

        echo ""
        echo -e "${GREEN}🎉 Deployment Complete!${NC}"
        echo -e "${BLUE}🔗 Production: https://getclientflow.app${NC}"
        echo -e "${BLUE}🔗 Dev: https://dev.getclientflow.app${NC}"
        echo ""
        exit 0
      else
        echo ""
        echo -e "${RED}❌ Deployment failed with conclusion: ${CONCLUSION}${NC}"
        echo -e "${BLUE}🔗 View details: https://github.com/dmayes77/clientflow/actions/runs/${RUN_ID}${NC}"
        exit 1
      fi
    fi
  fi

  sleep $INTERVAL
  WORKFLOW_COUNT=$((WORKFLOW_COUNT + 1))
done

echo ""
echo -e "${YELLOW}⚠️  Deployment taking longer than expected${NC}"
echo "Check GitHub Actions: https://github.com/dmayes77/clientflow/actions"
