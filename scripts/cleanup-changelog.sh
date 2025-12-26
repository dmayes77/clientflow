#!/bin/bash

# Cleanup CHANGELOG.md to show only user-facing changes
# Replaces internal-only releases with "- Internal improvements and bug fixes"

set -e

CHANGELOG_FILE="CHANGELOG.md"
TEMP_FILE=$(mktemp)

echo "🧹 Cleaning up CHANGELOG.md..."
echo ""

# Process the changelog
awk '
BEGIN {
  in_changes = 0
  version_line = ""
  changes_buffer = ""
  has_user_facing = 0
}

# Detect version header
/^## \[[0-9]+\.[0-9]+\.[0-9]+\]/ {
  # Output previous version if exists
  if (version_line != "") {
    print version_line
    print ""
    print "## Changes"
    if (has_user_facing == 0 || changes_buffer == "") {
      print "- Internal improvements and bug fixes"
    } else {
      print changes_buffer
    }
    print ""
    print ""
  }

  # Start new version
  version_line = $0
  changes_buffer = ""
  has_user_facing = 0
  in_changes = 0
  next
}

# Detect Changes section
/^## Changes/ || /^### Changes/ {
  in_changes = 1
  next
}

# Empty line resets changes section
/^$/ {
  if (in_changes == 1) {
    in_changes = 0
  }
  next
}

# Process change lines
in_changes == 1 && /^- / {
  # Check if this is a user-facing change (feat, fix, perf)
  if ($0 ~ /^- (feat|fix|perf)(\(|:)/) {
    has_user_facing = 1
    if (changes_buffer != "") {
      changes_buffer = changes_buffer "\n" $0
    } else {
      changes_buffer = $0
    }
  }
  # Skip internal changes (chore, ci, test, refactor, docs, build, style, merge, debug)
  next
}

# Keep other lines (like "# Changelog", etc.)
!in_changes && version_line == "" {
  print
}
' "$CHANGELOG_FILE" > "$TEMP_FILE"

# Output the last version
awk '
END {
  if (version_line != "") {
    print version_line
    print ""
    print "## Changes"
    if (has_user_facing == 0 || changes_buffer == "") {
      print "- Internal improvements and bug fixes"
    } else {
      print changes_buffer
    }
    print ""
  }
}
' version_line="" changes_buffer="" has_user_facing=0 "$CHANGELOG_FILE" >> "$TEMP_FILE"

# Add the standard header if not present
if ! grep -q "^# Changelog" "$TEMP_FILE"; then
  echo "# Changelog" > "${TEMP_FILE}.header"
  echo "" >> "${TEMP_FILE}.header"
  echo "All notable changes to this project will be documented in this file." >> "${TEMP_FILE}.header"
  echo "" >> "${TEMP_FILE}.header"
  cat "$TEMP_FILE" >> "${TEMP_FILE}.header"
  mv "${TEMP_FILE}.header" "$TEMP_FILE"
fi

# Replace original file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo "✅ CHANGELOG.md cleaned up!"
echo ""
echo "Summary:"
echo "  - Empty release sections filled with fallback message"
echo "  - Internal-only changes replaced with fallback message"
echo "  - User-facing changes (feat, fix, perf) preserved"
echo ""
