#!/bin/bash

# CI/CD Setup Script
# Automates Vercel linking and GitHub secrets configuration

set -e  # Exit on error

echo "🚀 CI/CD Setup Script"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi

# Check if user is logged in to Vercel
echo ""
echo "🔐 Checking Vercel authentication..."
if ! npx vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Please authenticate with Vercel:"
    npx vercel login
    echo -e "${GREEN}✅ Logged in to Vercel${NC}"
else
    echo -e "${GREEN}✅ Already logged in to Vercel${NC}"
fi

# Link project to Vercel
echo ""
echo "🔗 Linking project to Vercel..."
if [ ! -d ".vercel" ]; then
    npx vercel link --yes
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi

# Get project credentials
echo ""
echo "📋 Reading project credentials..."
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)

    echo -e "${GREEN}✅ Credentials found:${NC}"
    echo "   Project ID: $PROJECT_ID"
    echo "   Org ID: $ORG_ID"
else
    echo -e "${RED}❌ Could not find .vercel/project.json${NC}"
    exit 1
fi

# Check if GitHub CLI is installed
echo ""
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI found${NC}"

    # Check if user is logged in to GitHub
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ Logged in to GitHub CLI${NC}"

        # Ask if user wants to set secrets automatically
        echo ""
        read -p "Would you like to set GitHub secrets automatically? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "🔑 To set secrets automatically, we need your Vercel token."
            echo "   Get it from: https://vercel.com/account/tokens"
            echo ""
            read -p "Enter your Vercel token (or press Enter to skip): " VERCEL_TOKEN

            if [ ! -z "$VERCEL_TOKEN" ]; then
                # Get repository info
                REPO=$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')

                echo ""
                echo "📤 Setting GitHub secrets for repository: $REPO"

                # Set secrets
                echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN -R "$REPO"
                echo "$PROJECT_ID" | gh secret set VERCEL_PROJECT_ID -R "$REPO"
                echo "$ORG_ID" | gh secret set VERCEL_ORG_ID -R "$REPO"

                echo -e "${GREEN}✅ GitHub secrets set successfully!${NC}"
                echo ""
                echo "🎉 CI/CD setup complete!"
                echo ""
                echo "Next steps:"
                echo "  1. Push to dev branch: git push origin dev"
                echo "  2. View workflow: https://github.com/$REPO/actions"
                exit 0
            fi
        fi
    fi
fi

# Manual setup instructions
echo ""
echo -e "${YELLOW}📝 Manual Setup Required${NC}"
echo ""
echo "Follow these steps to complete CI/CD setup:"
echo ""
echo "1️⃣  Create a Vercel token:"
echo "   → https://vercel.com/account/tokens"
echo "   → Click 'Create Token'"
echo "   → Name: 'GitHub Actions CI/CD'"
echo "   → Copy the token"
echo ""
echo "2️⃣  Add GitHub secrets:"
echo "   → https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions/new"
echo ""
echo "   Add these three secrets:"
echo ""
echo -e "   ${GREEN}VERCEL_TOKEN${NC}"
echo "   Value: [Paste your Vercel token]"
echo ""
echo -e "   ${GREEN}VERCEL_PROJECT_ID${NC}"
echo "   Value: $PROJECT_ID"
echo ""
echo -e "   ${GREEN}VERCEL_ORG_ID${NC}"
echo "   Value: $ORG_ID"
echo ""
echo "3️⃣  Test the pipeline:"
echo "   git add ."
echo "   git commit -m \"test: Verify CI/CD pipeline\""
echo "   git push origin dev"
echo ""
echo "📊 Monitor deployments:"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
