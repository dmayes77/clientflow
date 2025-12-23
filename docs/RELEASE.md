# Release Process

## Automated Release Script

We have an automated release script that handles:
- Version bumping
- Changelog generation
- Git commits and tags
- GitHub releases

### Quick Start

```bash
# Patch release (1.5.7 → 1.5.8)
./scripts/release.sh patch

# Minor release (1.5.7 → 1.6.0)
./scripts/release.sh minor

# Major release (1.5.7 → 2.0.0)
./scripts/release.sh major
```

### What the script does:

1. ✅ Validates you're on the `main` branch
2. ✅ Ensures working directory is clean
3. ✅ Pulls latest changes
4. ✅ Bumps version in `package.json`
5. ✅ Generates changelog from git commits
6. ✅ Updates or creates `CHANGELOG.md`
7. ✅ Commits the version bump
8. ✅ Creates an annotated git tag
9. ✅ Pushes commit and tag to remote
10. ✅ Creates GitHub Release (if `gh` is authenticated)

### First-time Setup

If you haven't used the GitHub CLI before:

```bash
# Install gh CLI (if not already installed)
brew install gh

# Authenticate with GitHub
gh auth login
```

## Manual Release Process

If you prefer to release manually:

### 1. Update Version

Edit `package.json`:
```json
{
  "version": "1.5.8"
}
```

### 2. Update Changelog

Edit `CHANGELOG.md` and add:
```markdown
## [1.5.8] - 2025-01-XX

### Added
- New feature description

### Fixed
- Bug fix description
```

### 3. Commit and Tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore: Bump version to 1.5.8"
git tag -a v1.5.8 -m "Release v1.5.8"
git push origin main
git push origin v1.5.8
```

### 4. Create GitHub Release

Go to: https://github.com/dmayes77/clientflow/releases/new

- Select your tag
- Add release notes
- Click "Publish release"

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (1.X.0): New features, backwards compatible
- **PATCH** (1.5.X): Bug fixes, backwards compatible

## Tips

- Always create releases from the `main` branch
- Write clear, descriptive commit messages (they become your changelog)
- Test thoroughly before releasing
- Consider using conventional commits for better changelogs:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `chore:` for maintenance tasks
