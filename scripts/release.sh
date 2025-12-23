#!/bin/bash

# Release automation script for ClientFlow
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the release type (patch, minor, or major)
RELEASE_TYPE=${1:-patch}

echo -e "${BLUE}🚀 Starting release process (${RELEASE_TYPE})...${NC}"

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: You must be on the main branch to create a release${NC}"
    exit 1
fi

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Error: Working directory is not clean. Please commit or stash your changes.${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${BLUE}📥 Pulling latest changes...${NC}"
git pull origin main

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

case $RELEASE_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid release type. Use patch, minor, or major${NC}"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "${GREEN}✨ New version: ${NEW_VERSION}${NC}"

# Update package.json
echo -e "${BLUE}📝 Updating package.json...${NC}"
node -e "const fs = require('fs'); const pkg = require('./package.json'); pkg.version = '${NEW_VERSION}'; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');"

# Get git log since last tag for changelog
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
    COMMITS=$(git log --oneline --pretty=format:"- %s" | head -20)
else
    COMMITS=$(git log ${LAST_TAG}..HEAD --oneline --pretty=format:"- %s")
fi

# Generate changelog entry
CHANGELOG_ENTRY="## [${NEW_VERSION}] - $(date +%Y-%m-%d)

### Changes
${COMMITS}

"

# Prepend to CHANGELOG.md or create it
if [ ! -f "CHANGELOG.md" ]; then
    echo -e "${YELLOW}📄 Creating CHANGELOG.md...${NC}"
    echo "# Changelog

All notable changes to this project will be documented in this file.

${CHANGELOG_ENTRY}" > CHANGELOG.md
else
    echo -e "${BLUE}📄 Updating CHANGELOG.md...${NC}"
    # Create temp file with new entry
    echo "${CHANGELOG_ENTRY}" > /tmp/changelog_temp.md
    cat CHANGELOG.md >> /tmp/changelog_temp.md
    mv /tmp/changelog_temp.md CHANGELOG.md
fi

# Stage changes
git add package.json CHANGELOG.md

# Commit version bump
echo -e "${BLUE}💾 Committing version bump...${NC}"
git commit -m "chore: Bump version to ${NEW_VERSION}

Release ${NEW_VERSION} with the following changes:
${COMMITS}

🤖 Generated with release automation script"

# Create annotated tag
echo -e "${BLUE}🏷️  Creating git tag v${NEW_VERSION}...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}

${CHANGELOG_ENTRY}"

# Push changes and tag
echo -e "${BLUE}📤 Pushing to remote...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

# Create GitHub Release if gh CLI is available
if command -v gh &> /dev/null; then
    echo -e "${BLUE}🎉 Creating GitHub Release...${NC}"
    gh release create "v${NEW_VERSION}" \
        --title "v${NEW_VERSION}" \
        --notes "${CHANGELOG_ENTRY}" \
        || echo -e "${YELLOW}⚠️  Could not create GitHub release. You may need to run 'gh auth login'${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed. Skipping GitHub release creation.${NC}"
    echo -e "${YELLOW}   Install with: brew install gh${NC}"
fi

echo -e "${GREEN}✅ Release ${NEW_VERSION} completed successfully!${NC}"
echo -e "${GREEN}🎊 View your release at: https://github.com/dmayes77/clientflow/releases/tag/v${NEW_VERSION}${NC}"
