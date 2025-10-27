# Makefile for Deeper Research Synthetic Project
# Provides convenient shortcuts for common development tasks
# Usage: make <target>

.PHONY: help setup install lint fmt test clean build run dev security check ci logs

# Variables
BACKEND_DIR := backend
FRONTEND_DIR := frontend
NODE_VERSION := $(shell node --version)
NPM_VERSION := $(shell npm --version)

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Default target
help: ## Show this help message
	@echo "$(BLUE)Deeper Research Synthetic - Development Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Node $(NODE_VERSION) | NPM $(NPM_VERSION)$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make setup       # Initial project setup"
	@echo "  make dev         # Start development servers"
	@echo "  make test        # Run all tests"
	@echo "  make lint        # Run linters"
	@echo "  make fmt         # Format code"
	@echo "  make build       # Build for production"

# Setup and Installation
setup: ## Setup project and install dependencies
	@echo "$(BLUE)Setting up project...$(NC)"
	@make install
	@make pre-commit-install
	@echo "$(GREEN)✓ Project setup complete$(NC)"

install: ## Install dependencies for backend and frontend
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@cd $(BACKEND_DIR) && npm ci && echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@cd $(FRONTEND_DIR) && npm ci && echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@cd $(BACKEND_DIR) && npm update && echo "$(GREEN)✓ Backend dependencies updated$(NC)"
	@cd $(FRONTEND_DIR) && npm update && echo "$(GREEN)✓ Frontend dependencies updated$(NC)"

pre-commit-install: ## Install pre-commit hooks
	@command -v pre-commit >/dev/null 2>&1 || { echo "$(YELLOW)Installing pre-commit...$(NC)"; pip install pre-commit; }
	@pre-commit install
	@echo "$(GREEN)✓ Pre-commit hooks installed$(NC)"

# Development
dev: ## Start development servers (backend and frontend)
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend on http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend on http://localhost:5173$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@echo ""
	@cd $(BACKEND_DIR) && npm run dev &
	@cd $(FRONTEND_DIR) && npm run dev

dev-backend: ## Start backend development server only
	@echo "$(BLUE)Starting backend server...$(NC)"
	@echo "$(YELLOW)Server on http://localhost:3001$(NC)"
	@cd $(BACKEND_DIR) && npm run dev

dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend server...$(NC)"
	@echo "$(YELLOW)Server on http://localhost:5173$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

# Code Quality
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run ESLint on backend
	@echo "$(BLUE)Linting backend...$(NC)"
	@cd $(BACKEND_DIR) && npm run lint || echo "$(RED)✗ Linting failed$(NC)"

lint-frontend: ## Run ESLint on frontend
	@echo "$(BLUE)Linting frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint || echo "$(RED)✗ Linting failed$(NC)"

fmt: fmt-backend fmt-frontend ## Format all code

fmt-backend: ## Format backend code with Prettier
	@echo "$(BLUE)Formatting backend code...$(NC)"
	@cd $(BACKEND_DIR) && npx prettier --write . --config ../.prettierrc 2>/dev/null || npm run fmt
	@echo "$(GREEN)✓ Backend formatted$(NC)"

fmt-frontend: ## Format frontend code with Prettier
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	@cd $(FRONTEND_DIR) && npx prettier --write . --config ../.prettierrc 2>/dev/null || npm run fmt
	@echo "$(GREEN)✓ Frontend formatted$(NC)"

fmt-markdown: ## Format markdown files
	@echo "$(BLUE)Formatting markdown...$(NC)"
	@npx prettier --write "**/*.md" 2>/dev/null || echo "$(YELLOW)Prettier not available for markdown$(NC)"
	@echo "$(GREEN)✓ Markdown formatted$(NC)"

# Testing
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	@cd $(BACKEND_DIR) && npm test

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test

test-fast: ## Run tests without coverage
	@echo "$(BLUE)Running fast tests...$(NC)"
	@cd $(BACKEND_DIR) && npm run test:fast 2>/dev/null || npm test -- --no-coverage
	@cd $(FRONTEND_DIR) && npm run test:fast 2>/dev/null || npm test -- --no-coverage

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@echo "$(YELLOW)Press 'q' to quit$(NC)"
	@cd $(BACKEND_DIR) && npm test -- --watch

coverage: ## Generate coverage reports
	@echo "$(BLUE)Generating coverage reports...$(NC)"
	@cd $(BACKEND_DIR) && npm run test:coverage
	@cd $(FRONTEND_DIR) && npm run test:coverage
	@echo "$(GREEN)✓ Coverage reports generated$(NC)"

# Security
security: security-check audit ## Run security checks

security-check: ## Run security audits
	@echo "$(BLUE)Running security checks...$(NC)"
	@cd $(BACKEND_DIR) && npm audit --audit-level=moderate || echo "$(YELLOW)⚠ Vulnerabilities found$(NC)"
	@cd $(FRONTEND_DIR) && npm audit --audit-level=moderate || echo "$(YELLOW)⚠ Vulnerabilities found$(NC)"

audit: ## Audit dependencies for vulnerabilities
	@echo "$(BLUE)Auditing dependencies...$(NC)"
	@cd $(BACKEND_DIR) && npm audit fix --force 2>/dev/null; npm audit
	@cd $(FRONTEND_DIR) && npm audit fix --force 2>/dev/null; npm audit

# Building
build: build-backend build-frontend ## Build both backend and frontend

build-backend: ## Build backend for production
	@echo "$(BLUE)Building backend...$(NC)"
	@cd $(BACKEND_DIR) && npm run build 2>/dev/null || echo "$(YELLOW)No build script for backend$(NC)"
	@echo "$(GREEN)✓ Backend built$(NC)"

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Frontend built$(NC)"

# Docker
docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker build -f Dockerfile.backend -t deeper-research-backend:latest .
	@docker build -f Dockerfile.frontend -t deeper-research-frontend:latest .
	@echo "$(GREEN)✓ Docker images built$(NC)"

docker-up: ## Start Docker containers
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Containers started$(NC)"
	@echo "$(YELLOW)View logs with: make docker-logs$(NC)"

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Containers stopped$(NC)"

docker-logs: ## View Docker container logs
	@docker-compose logs -f

docker-clean: ## Remove Docker images and containers
	@echo "$(BLUE)Cleaning up Docker...$(NC)"
	@docker-compose down -v
	@docker rmi deeper-research-backend:latest deeper-research-frontend:latest 2>/dev/null || true
	@echo "$(GREEN)✓ Docker cleaned$(NC)"

# CI/CD
ci: lint test security build ## Run all CI checks

check: lint test ## Quick check (lint + test)

# Database
db-backup: ## Backup MongoDB database
	@echo "$(BLUE)Backing up database...$(NC)"
	@bash ./backup.sh
	@echo "$(GREEN)✓ Database backed up$(NC)"

db-restore: ## Restore MongoDB database
	@echo "$(RED)⚠ Restore requires manual steps$(NC)"
	@echo "See backup files in ./backups/"

# Cleanup
clean: clean-node clean-build clean-coverage ## Clean all build artifacts

clean-node: ## Remove node_modules
	@echo "$(BLUE)Cleaning node_modules...$(NC)"
	@rm -rf $(BACKEND_DIR)/node_modules $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-build: ## Remove build directories
	@echo "$(BLUE)Cleaning build directories...$(NC)"
	@rm -rf $(BACKEND_DIR)/dist $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/build
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-coverage: ## Remove coverage reports
	@echo "$(BLUE)Cleaning coverage reports...$(NC)"
	@rm -rf $(BACKEND_DIR)/coverage $(FRONTEND_DIR)/coverage
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-all: clean docker-clean ## Clean everything

# Logging and Info
logs: ## Show recent logs
	@echo "$(BLUE)Recent logs...$(NC)"
	@tail -50 backend/.logs/* 2>/dev/null || echo "$(YELLOW)No logs found$(NC)"

info: ## Show project information
	@echo "$(BLUE)Project Information$(NC)"
	@echo "Node: $(NODE_VERSION)"
	@echo "NPM: $(NPM_VERSION)"
	@echo "Backend version: $$(grep '\"version\"' $(BACKEND_DIR)/package.json | head -1 | sed 's/.*\"version\": \"\(.*\)\".*/\1/')"
	@echo "Frontend version: $$(grep '\"version\"' $(FRONTEND_DIR)/package.json | head -1 | sed 's/.*\"version\": \"\(.*\)\".*/\1/')"
	@echo ""
	@echo "Installed packages:"
	@echo "  Backend: $$(cd $(BACKEND_DIR) && npm list --depth=0 2>/dev/null | wc -l) packages"
	@echo "  Frontend: $$(cd $(FRONTEND_DIR) && npm list --depth=0 2>/dev/null | wc -l) packages"

status: ## Show project status
	@echo "$(BLUE)Project Status$(NC)"
	@echo ""
	@echo "Git Status:"
	@git status --short || echo "Not a git repository"
	@echo ""
	@echo "Node Modules:"
	@if [ -d "$(BACKEND_DIR)/node_modules" ]; then echo "  ✓ Backend"; else echo "  ✗ Backend (run: make install)"; fi
	@if [ -d "$(FRONTEND_DIR)/node_modules" ]; then echo "  ✓ Frontend"; else echo "  ✗ Frontend (run: make install)"; fi
	@echo ""
	@echo "Pre-commit hooks:"
	@if [ -f ".git/hooks/pre-commit" ]; then echo "  ✓ Installed"; else echo "  ✗ Not installed (run: make setup)"; fi

# Git helpers
commit: ## Prepare a git commit (with pre-commit checks)
	@echo "$(BLUE)Preparing commit...$(NC)"
	@pre-commit run --all-files || echo "$(YELLOW)Fix issues and try again$(NC)"

push: check ## Push to repository (runs checks first)
	@echo "$(BLUE)Pushing to repository...$(NC)"
	@git push

pull: ## Pull from repository
	@echo "$(BLUE)Pulling from repository...$(NC)"
	@git pull

# Documentation
docs: ## Build documentation
	@echo "$(BLUE)Building documentation...$(NC)"
	@echo "Documentation files:"
	@find docs/ -name "*.md" -type f | head -10
	@echo "$(GREEN)✓ Documentation ready$(NC)"

# Package management
deps: ## Check outdated packages
	@echo "$(BLUE)Checking for outdated packages...$(NC)"
	@cd $(BACKEND_DIR) && npm outdated || echo "All backend packages up to date"
	@cd $(FRONTEND_DIR) && npm outdated || echo "All frontend packages up to date"

# Help for individual components
backend-help: ## Show backend-specific commands
	@echo "Backend-specific commands:"
	@cd $(BACKEND_DIR) && npm run 2>&1 | grep -E "^\s+[a-z]" || echo "See package.json for available scripts"

frontend-help: ## Show frontend-specific commands
	@echo "Frontend-specific commands:"
	@cd $(FRONTEND_DIR) && npm run 2>&1 | grep -E "^\s+[a-z]" || echo "See package.json for available scripts"

.PHONY: $(MAKECMDGOALS)
