#!/usr/bin/env python3

"""
Cleanup CHANGELOG.md to show only user-facing changes.
Replaces internal-only releases with "- Internal improvements and bug fixes"
"""

import re
from pathlib import Path

CHANGELOG_PATH = Path("CHANGELOG.md")
FALLBACK_MESSAGE = "- Internal improvements and bug fixes"

# Patterns for internal commits (to exclude)
INTERNAL_PATTERNS = [
    r"^- (chore|ci|test|refactor|docs|build|style|debug)(\(|:)",
    r"^- Merge ",
    r"^- chore: ",
]

# Patterns for user-facing commits (to keep)
USER_FACING_PATTERNS = [
    r"^- (feat|fix|perf)(\(|:)",
]

def is_internal_change(line: str) -> bool:
    """Check if a change line is internal-only."""
    for pattern in INTERNAL_PATTERNS:
        if re.match(pattern, line):
            return True
    return False

def is_user_facing_change(line: str) -> bool:
    """Check if a change line is user-facing."""
    for pattern in USER_FACING_PATTERNS:
        if re.match(pattern, line):
            return True
    return False

def clean_changelog():
    """Process the changelog file."""
    print("🧹 Cleaning up CHANGELOG.md...")
    print("")

    with open(CHANGELOG_PATH, 'r') as f:
        content = f.read()

    # Split into sections by version headers
    version_pattern = r'^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}$'
    lines = content.split('\n')

    result = []
    current_version = None
    current_changes = []
    in_changes_section = False
    header_lines = []
    seen_first_version = False

    for line in lines:
        # Check if this is a version header
        if re.match(version_pattern, line):
            # Process previous version if exists
            if current_version:
                result.append(current_version)
                result.append("")
                result.append("## Changes")

                # Filter changes to only user-facing
                user_facing = [c for c in current_changes if is_user_facing_change(c)]

                if user_facing:
                    result.extend(user_facing)
                else:
                    result.append(FALLBACK_MESSAGE)

                result.append("")
                result.append("")

            # Start new version
            current_version = line
            current_changes = []
            in_changes_section = False
            seen_first_version = True
            continue

        # Before first version, collect header
        if not seen_first_version:
            # Skip old changelog header duplication
            if line.strip() and not (line.startswith('# Changelog') or line == 'All notable changes to this project will be documented in this file.'):
                pass  # Skip these lines, we'll add them at the end
            continue

        # Detect changes section
        if line in ['## Changes', '### Changes']:
            in_changes_section = True
            continue

        # Empty line ends changes section
        if not line.strip():
            in_changes_section = False
            continue

        # Collect change lines
        if in_changes_section and line.startswith('- '):
            current_changes.append(line)

    # Process last version
    if current_version:
        result.append(current_version)
        result.append("")
        result.append("## Changes")

        user_facing = [c for c in current_changes if is_user_facing_change(c)]

        if user_facing:
            result.extend(user_facing)
        else:
            result.append(FALLBACK_MESSAGE)

        result.append("")

    # Add standard header at the beginning
    final_content = [
        "# Changelog",
        "",
        "All notable changes to this project will be documented in this file.",
        "",
        ""
    ] + result

    # Write back
    with open(CHANGELOG_PATH, 'w') as f:
        f.write('\n'.join(final_content))

    print("✅ CHANGELOG.md cleaned up!")
    print("")
    print("Summary:")
    print("  - Empty release sections filled with fallback message")
    print("  - Internal-only changes replaced with fallback message")
    print("  - User-facing changes (feat, fix, perf) preserved")
    print("")

if __name__ == "__main__":
    clean_changelog()
