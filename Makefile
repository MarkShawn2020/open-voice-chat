# ================================
# Open Voice Chat Makefile
# ================================

.PHONY: help install dev build start clean test lint format type-check security docker-build docker-run docs release

# Colors
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Help target
help: ## Show this help message
	@echo "$(BLUE)Open Voice Chat - Available Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ================================
# Development
# ================================

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	pnpm dev

build: ## Build the application
	@echo "$(BLUE)Building application...$(NC)"
	pnpm build

start: ## Start production server
	@echo "$(BLUE)Starting production server...$(NC)"
	pnpm start

# ================================
# Code Quality
# ================================

lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	pnpm lint

lint-fix: ## Fix ESLint issues
	@echo "$(BLUE)Fixing ESLint issues...$(NC)"
	pnpm lint:fix

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	pnpm prettier:write

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	pnpm prettier:check

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	pnpm type-check

# ================================
# Testing
# ================================

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	pnpm test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	pnpm test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pnpm test:coverage

e2e: ## Run E2E tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	pnpm e2e

e2e-ui: ## Run E2E tests with UI
	@echo "$(BLUE)Running E2E tests with UI...$(NC)"
	pnpm e2e:ui

# ================================
# Quality Gates
# ================================

check-all: lint format-check type-check test ## Run all quality checks
	@echo "$(GREEN)All quality checks passed!$(NC)"

security: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	pnpm audit --audit-level moderate

# ================================
# Docker
# ================================

docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t open-voice-chat:latest .

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -p 3000:3000 --env-file .env.local open-voice-chat:latest

docker-compose-up: ## Start with Docker Compose
	@echo "$(BLUE)Starting with Docker Compose...$(NC)"
	docker-compose up -d

docker-compose-down: ## Stop Docker Compose
	@echo "$(BLUE)Stopping Docker Compose...$(NC)"
	docker-compose down

docker-compose-logs: ## View Docker Compose logs
	@echo "$(BLUE)Viewing Docker Compose logs...$(NC)"
	docker-compose logs -f

# ================================
# Documentation
# ================================

docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	pnpm storybook:build

docs-dev: ## Start documentation development server
	@echo "$(BLUE)Starting Storybook...$(NC)"
	pnpm storybook

# ================================
# Deployment
# ================================

deploy: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(NC)"
	./scripts/deploy.sh

deploy-staging: ## Deploy to staging
	@echo "$(BLUE)Deploying to staging...$(NC)"
	./scripts/deploy.sh --environment staging

deploy-build-only: ## Build only (no deployment)
	@echo "$(BLUE)Building for deployment...$(NC)"
	./scripts/deploy.sh --build-only

# ================================
# Release
# ================================

release-patch: ## Create a patch release
	@echo "$(BLUE)Creating patch release...$(NC)"
	npm version patch
	git push --follow-tags

release-minor: ## Create a minor release
	@echo "$(BLUE)Creating minor release...$(NC)"
	npm version minor
	git push --follow-tags

release-major: ## Create a major release
	@echo "$(BLUE)Creating major release...$(NC)"
	npm version major
	git push --follow-tags

# ================================
# Maintenance
# ================================

clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf .next
	rm -rf out
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage
	rm -rf .turbo
	rm -rf storybook-static

clean-cache: ## Clean caches
	@echo "$(BLUE)Cleaning caches...$(NC)"
	pnpm store prune
	rm -rf .next/cache
	rm -rf .turbo

reinstall: clean install ## Clean and reinstall dependencies
	@echo "$(GREEN)Dependencies reinstalled!$(NC)"

# ================================
# Environment Setup
# ================================

setup: ## Initial project setup
	@echo "$(BLUE)Setting up project...$(NC)"
	@if [ ! -f .env.local ]; then \
		echo "$(YELLOW)Creating .env.local from .env.example...$(NC)"; \
		cp .env.example .env.local; \
		echo "$(YELLOW)Please update .env.local with your API keys$(NC)"; \
	fi
	@make install
	@echo "$(GREEN)Project setup complete!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Update .env.local with your API keys"
	@echo "  2. Run 'make dev' to start development"

# ================================
# Git Hooks
# ================================

prepare: ## Setup git hooks
	@echo "$(BLUE)Setting up git hooks...$(NC)"
	@if [ -d .git ]; then \
		echo "#!/bin/sh\nmake check-all" > .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		echo "$(GREEN)Pre-commit hook installed$(NC)"; \
	else \
		echo "$(YELLOW)Not a git repository, skipping hooks$(NC)"; \
	fi

# ================================
# Utilities
# ================================

open: ## Open the application in browser
	@echo "$(BLUE)Opening application...$(NC)"
	@open http://localhost:3000 || xdg-open http://localhost:3000 || echo "Please open http://localhost:3000 in your browser"

health-check: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -f http://localhost:3000/api/health && echo "$(GREEN)Application is healthy$(NC)" || echo "$(RED)Application is not responding$(NC)"

logs: ## View application logs
	@echo "$(BLUE)Viewing application logs...$(NC)"
	@if [ -f logs/app.log ]; then \
		tail -f logs/app.log; \
	else \
		echo "$(YELLOW)No log file found$(NC)"; \
	fi
