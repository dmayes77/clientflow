#!/bin/bash

# Update CHANGELOG.md with new changes before production deployment
# Usage: ./scripts/update-changelog.sh
#
# This script:
# 1. Gets commits from dev that are not yet in main
# 2. Extracts and categorizes the changes
# 3. Creates a new version entry in CHANGELOG.md
# 4. Commits the changelog update

set -e

# Use ARM Homebrew binaries
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CHANGELOG_FILE="CHANGELOG.md"

echo -e "${BLUE}📝 Updating CHANGELOG.md${NC}"
echo ""

# Get the current latest version from CHANGELOG.md
get_latest_version() {
  grep -oE "^## v[0-9]+\.[0-9]+\.[0-9]+" "$CHANGELOG_FILE" | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+"
}

# Increment patch version
increment_version() {
  local version=$1
  local major=$(echo "$version" | cut -d. -f1)
  local minor=$(echo "$version" | cut -d. -f2)
  local patch=$(echo "$version" | cut -d. -f3)
  patch=$((patch + 1))
  echo "$major.$minor.$patch"
}

# Get today's date in the format used by changelog
get_date() {
  date "+%B %-d, %Y"
}

# Get commits that are in dev but not in main
get_new_commits() {
  git fetch origin --quiet
  git log origin/main..origin/dev --oneline --pretty=format:"%s" 2>/dev/null | grep -v "^$" || echo ""
}

# Parse commits and generate changelog entries
parse_commits() {
  local commits="$1"
  local features=""
  local improvements=""
  local fixes=""

  while IFS= read -r commit; do
    # Skip empty lines and auto-generated commits
    [[ -z "$commit" ]] && continue
    [[ "$commit" == *"Generated with"* ]] && continue
    [[ "$commit" == *"Merge"* ]] && continue
    [[ "$commit" == *"Sync dev"* ]] && continue
    [[ "$commit" == *"chore:"* ]] && continue
    [[ "$commit" == *"Bump version"* ]] && continue

    # Clean up the commit message
    local clean_msg=$(echo "$commit" | sed 's/^[a-z]*: //i' | sed 's/^[a-z]*([^)]*): //i')

    # Categorize based on keywords
    if [[ "$commit" == *"fix"* ]] || [[ "$commit" == *"Fix"* ]] || [[ "$commit" == *"bug"* ]]; then
      # Extract feature name and description
      local title=$(echo "$clean_msg" | sed 's/^\([^,-]*\).*/\1/' | sed 's/^ *//' | sed 's/ *$//')
      fixes="${fixes}- **${title}**\n"
    elif [[ "$commit" == *"add"* ]] || [[ "$commit" == *"Add"* ]] || [[ "$commit" == *"new"* ]] || [[ "$commit" == *"New"* ]] || [[ "$commit" == *"create"* ]] || [[ "$commit" == *"Create"* ]]; then
      local title=$(echo "$clean_msg" | sed 's/^\([^,-]*\).*/\1/' | sed 's/^ *//' | sed 's/ *$//')
      features="${features}- **${title}**\n"
    else
      local title=$(echo "$clean_msg" | sed 's/^\([^,-]*\).*/\1/' | sed 's/^ *//' | sed 's/ *$//')
      improvements="${improvements}- **${title}**\n"
    fi
  done <<< "$commits"

  # Build changelog section
  local section=""

  if [[ -n "$features" ]]; then
    section="${section}### New Features\n${features}\n"
  fi

  if [[ -n "$improvements" ]]; then
    section="${section}### Improvements\n${improvements}\n"
  fi

  if [[ -n "$fixes" ]]; then
    section="${section}### Bug Fixes\n${fixes}\n"
  fi

  echo -e "$section"
}

# Main execution
LATEST_VERSION=$(get_latest_version)
if [ -z "$LATEST_VERSION" ]; then
  LATEST_VERSION="1.0.0"
fi

NEW_VERSION=$(increment_version "$LATEST_VERSION")
TODAY=$(get_date)

echo -e "${BLUE}📌 Current version: v${LATEST_VERSION}${NC}"
echo -e "${BLUE}📌 New version: v${NEW_VERSION}${NC}"
echo ""

# Get new commits
COMMITS=$(get_new_commits)

if [ -z "$COMMITS" ]; then
  echo -e "${YELLOW}⚠️  No new commits found${NC}"
  echo "Dev and main branches appear to be in sync"
  exit 0
fi

echo -e "${BLUE}📋 Found commits:${NC}"
echo "$COMMITS"
echo ""

# Parse commits into changelog format
CHANGELOG_ENTRIES=$(parse_commits "$COMMITS")

if [ -z "$CHANGELOG_ENTRIES" ] || [ "$CHANGELOG_ENTRIES" = $'\n' ]; then
  echo -e "${YELLOW}⚠️  No user-facing changes to document${NC}"
  echo "All commits appear to be maintenance/chore commits"
  exit 0
fi

echo -e "${BLUE}📝 Generated changelog entries:${NC}"
echo -e "$CHANGELOG_ENTRIES"
echo ""

# Create the new version block
NEW_ENTRY="## v${NEW_VERSION} - ${TODAY}

${CHANGELOG_ENTRIES}---

"

# Insert the new entry after the header line
# The header is "# What's New" followed by a blank line
TEMP_FILE=$(mktemp)

# Read the file and insert the new entry after the header
awk -v new_entry="$NEW_ENTRY" '
  /^# What/ { print; getline; print; print ""; print new_entry; next }
  { print }
' "$CHANGELOG_FILE" > "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo -e "${GREEN}✅ CHANGELOG.md updated with v${NEW_VERSION}${NC}"
echo ""

# Stage and commit the changelog
git add "$CHANGELOG_FILE"
git commit -m "chore: Update CHANGELOG.md for v${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" || {
  echo -e "${YELLOW}⚠️  No changes to commit (changelog may already be up to date)${NC}"
}

# Push the changelog update
git push origin dev

echo -e "${GREEN}✅ Changelog committed and pushed${NC}"
