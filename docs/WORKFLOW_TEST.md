# Workflow Test

This file tests the simplified 2-tier CI/CD workflow:

## Flow
1. Feature → dev (fast iteration, no tests)
2. dev → main (tests run on PR, auto-release after merge)

## Expected Behavior
- ✅ Tests run only when creating PR to main
- ✅ Dev deploys without tests for fast iteration
- ✅ Production deploys after merge to main
- ✅ Auto-release creates version bump, changelog, and GitHub release
- ✅ Dev branch syncs back after release

---
*Testing date: 2025-12-25*
