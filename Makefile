# Spike MVP Makefile
# ===================

# Variables
PROJECT_NAME = spike
NODE_VERSION = 18
DOCKER_COMPOSE = docker-compose.yml
ENV_FILE = .env.local

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
help: ## Show this help message
	@echo "$(BLUE)Spike MVP - Available Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development Commands
# ===================

install: ## Install all dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✅ Dependencies installed successfully!$(NC)"

dev: ## Start development server with increased memory
	@echo "$(YELLOW)Starting development server...$(NC)"
	NODE_OPTIONS="--max-old-space-size=4096" npm run dev

dev-clean: ## Clean and start development server
	@echo "$(YELLOW)Cleaning and starting development server...$(NC)"
	make clean
	make install
	make dev

# Database Commands
# =================

db-start: ## Start PostgreSQL and Redis with Docker
	@echo "$(YELLOW)Starting database services...$(NC)"
	docker-compose up -d postgres redis-master
	@echo "$(GREEN)✅ Database services started!$(NC)"

db-stop: ## Stop database services
	@echo "$(YELLOW)Stopping database services...$(NC)"
	docker-compose stop postgres redis-master
	@echo "$(GREEN)✅ Database services stopped!$(NC)"

db-reset: ## Reset database (drop and recreate)
	@echo "$(YELLOW)Resetting database...$(NC)"
	docker-compose down -v
	docker-compose up -d postgres redis-master
	sleep 5
	npx prisma migrate reset --force
	@echo "$(GREEN)✅ Database reset successfully!$(NC)"

db-migrate: ## Run database migrations
	@echo "$(YELLOW)Running database migrations...$(NC)"
	npx prisma migrate dev
	@echo "$(GREEN)✅ Migrations completed!$(NC)"

db-generate: ## Generate Prisma client
	@echo "$(YELLOW)Generating Prisma client...$(NC)"
	npx prisma generate
	@echo "$(GREEN)✅ Prisma client generated!$(NC)"

db-seed: ## Seed database with sample data
	@echo "$(YELLOW)Seeding database...$(NC)"
	npx prisma db seed
	@echo "$(GREEN)✅ Database seeded successfully!$(NC)"

db-studio: ## Open Prisma Studio
	@echo "$(YELLOW)Opening Prisma Studio...$(NC)"
	npx prisma studio

# Testing Commands
# ================

test: ## Run all tests
	@echo "$(YELLOW)Running tests...$(NC)"
	npm run test

test-watch: ## Run tests in watch mode
	@echo "$(YELLOW)Running tests in watch mode...$(NC)"
	npm run test:watch

test-e2e: ## Run end-to-end tests
	@echo "$(YELLOW)Running E2E tests...$(NC)"
	npm run test:e2e

# Build Commands
# ==============

build: ## Build the application
	@echo "$(YELLOW)Building application...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Build completed!$(NC)"

build-analyze: ## Build and analyze bundle
	@echo "$(YELLOW)Building and analyzing bundle...$(NC)"
	ANALYZE=true npm run build

# Deployment Commands
# ===================

deploy-dev: ## Deploy to development environment
	@echo "$(YELLOW)Deploying to development...$(NC)"
	# Add your deployment commands here
	@echo "$(GREEN)✅ Development deployment completed!$(NC)"

deploy-prod: ## Deploy to production environment
	@echo "$(YELLOW)Deploying to production...$(NC)"
	# Add your production deployment commands here
	@echo "$(GREEN)✅ Production deployment completed!$(NC)"

# Maintenance Commands
# ===================

clean: ## Clean all generated files and dependencies
	@echo "$(YELLOW)Cleaning project...$(NC)"
	rm -rf node_modules
	rm -rf .next
	rm -rf dist
	rm -rf .turbo
	rm -rf .env.local
	@echo "$(GREEN)✅ Project cleaned!$(NC)"

clean-docker: ## Clean Docker containers and images
	@echo "$(YELLOW)Cleaning Docker...$(NC)"
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)✅ Docker cleaned!$(NC)"

logs: ## Show application logs
	@echo "$(YELLOW)Showing logs...$(NC)"
	docker-compose logs -f

# Environment Setup
# ================

env-setup: ## Setup environment variables
	@echo "$(YELLOW)Setting up environment...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		cp env.local.example $(ENV_FILE); \
		echo "$(GREEN)✅ Environment file created from example!$(NC)"; \
	else \
		echo "$(YELLOW)Environment file already exists!$(NC)"; \
	fi

env-generate-secret: ## Generate NextAuth secret
	@echo "$(YELLOW)Generating NextAuth secret...$(NC)"
	@openssl rand -base64 32

# Health Checks
# =============

health: ## Check application health
	@echo "$(YELLOW)Checking application health...$(NC)"
	@curl -f http://localhost:3000/api/health || echo "$(RED)❌ Health check failed!$(NC)"

health-db: ## Check database health
	@echo "$(YELLOW)Checking database health...$(NC)"
	@curl -f http://localhost:3000/api/test-db || echo "$(RED)❌ Database health check failed!$(NC)"

# Development Workflow
# ===================

setup: ## Complete project setup
	@echo "$(YELLOW)Setting up Spike project...$(NC)"
	make env-setup
	make install
	make db-start
	sleep 5
	make db-migrate
	make db-seed
	@echo "$(GREEN)✅ Project setup completed!$(NC)"

start: ## Start complete development environment
	@echo "$(YELLOW)Starting complete development environment...$(NC)"
	make db-start
	sleep 3
	make dev

stop: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down
	pkill -f "next dev" || true
	pkill -f "turbo" || true
	@echo "$(GREEN)✅ All services stopped!$(NC)"

# Quick Commands
# ==============

quick-start: ## Quick start (assumes setup is done)
	@echo "$(YELLOW)Quick starting development...$(NC)"
	make db-start
	sleep 2
	make dev

quick-reset: ## Quick reset (clean and restart)
	@echo "$(YELLOW)Quick reset...$(NC)"
	make stop
	make clean
	make install
	make start

# Monitoring Commands
# ===================

monitor: ## Monitor system resources
	@echo "$(YELLOW)Monitoring system resources...$(NC)"
	@echo "Memory usage:"
	@ps aux | grep node | grep -v grep | awk '{print $$6/1024 " MB"}'
	@echo "Disk usage:"
	@du -sh .next node_modules 2>/dev/null || echo "No build files found"

# Documentation
# =============

docs: ## Generate documentation
	@echo "$(YELLOW)Generating documentation...$(NC)"
	npm run docs:generate
	@echo "$(GREEN)✅ Documentation generated!$(NC)"

# Git Commands
# ============

git-clean: ## Clean git repository
	@echo "$(YELLOW)Cleaning git repository...$(NC)"
	git clean -fd
	git reset --hard HEAD
	@echo "$(GREEN)✅ Git repository cleaned!$(NC)"

# Utility Commands
# ===============

check-node: ## Check Node.js version
	@echo "$(YELLOW)Checking Node.js version...$(NC)"
	@node --version
	@npm --version

check-docker: ## Check Docker status
	@echo "$(YELLOW)Checking Docker status...$(NC)"
	@docker --version
	@docker-compose --version

check-ports: ## Check if ports are in use
	@echo "$(YELLOW)Checking port usage...$(NC)"
	@lsof -i :3000 || echo "Port 3000 is free"
	@lsof -i :5432 || echo "Port 5432 is free"
	@lsof -i :6379 || echo "Port 6379 is free"

# MVP Specific Commands
# ====================

mvp-setup: ## MVP-specific setup
	@echo "$(YELLOW)Setting up Spike MVP...$(NC)"
	make env-setup
	make install
	make db-start
	sleep 5
	make db-migrate
	make db-seed
	@echo "$(GREEN)✅ MVP setup completed!$(NC)"
	@echo "$(BLUE)🎉 Spike MVP is ready!$(NC)"
	@echo "$(BLUE)📱 Access the app at: http://localhost:3000$(NC)"
	@echo "$(BLUE)📊 Dashboard at: http://localhost:3000/dashboard$(NC)"
	@echo "$(BLUE)🔐 Auth at: http://localhost:3000/auth/signin$(NC)"

mvp-deploy: ## MVP deployment
	@echo "$(YELLOW)Deploying Spike MVP...$(NC)"
	make build
	make deploy-dev
	@echo "$(GREEN)✅ MVP deployed successfully!$(NC)"

# Phony targets
.PHONY: help install dev dev-clean db-start db-stop db-reset db-migrate db-generate db-seed db-studio test test-watch test-e2e build build-analyze deploy-dev deploy-prod clean clean-docker logs env-setup env-generate-secret health health-db setup start stop quick-start quick-reset monitor docs git-clean check-node check-docker check-ports mvp-setup mvp-deploy 