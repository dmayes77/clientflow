.PHONY: help deploy-dev pr deploy status

# Default PATH to use ARM Homebrew binaries
export PATH := /opt/homebrew/bin:/usr/bin:$(PATH)

help:
	@echo "ClientFlow Deployment Commands"
	@echo ""
	@echo "  make deploy-dev MSG=\"your message\"  - Deploy to dev environment"
	@echo "  make pr                              - Create PR from dev to main"
	@echo "  make deploy                          - Deploy to production (merge PR)"
	@echo "  make status                          - Check deployment status"
	@echo ""

deploy-dev:
	@if [ -z "$(MSG)" ]; then \
		echo "❌ Error: Please provide a commit message"; \
		echo "Usage: make deploy-dev MSG=\"your commit message\""; \
		exit 1; \
	fi
	@./scripts/deploy-dev.sh "$(MSG)"

pr:
	@./scripts/create-pr.sh

deploy:
	@./scripts/deploy-production.sh

status:
	@./scripts/check-status.sh
