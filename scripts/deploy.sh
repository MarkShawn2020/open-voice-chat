#!/bin/bash

# ================================
# Open Voice Chat Deployment Script
# ================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
BUILD_ONLY=false
SKIP_TESTS=false
VERBOSE=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Open Voice Chat Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Set deployment environment (default: production)
    -b, --build-only        Only build, don't deploy
    -s, --skip-tests        Skip running tests
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

Examples:
    $0                      # Deploy to production
    $0 -e staging          # Deploy to staging
    $0 --build-only        # Only build the application
    $0 -s -v               # Skip tests and enable verbose output

EOF
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if required commands exist
    local deps=("node" "pnpm" "docker" "git")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed or not in PATH"
            exit 1
        fi
    done
    
    log_success "All dependencies are satisfied"
}

setup_environment() {
    log_info "Setting up environment for $ENVIRONMENT..."
    
    # Check if .env.local exists
    if [[ ! -f ".env.local" ]]; then
        if [[ -f ".env.example" ]]; then
            log_warning ".env.local not found. Creating from .env.example..."
            cp .env.example .env.local
            log_warning "Please update .env.local with your actual environment variables"
        else
            log_error ".env.local not found and .env.example doesn't exist"
            exit 1
        fi
    fi
    
    # Set environment variables
    export NODE_ENV="$ENVIRONMENT"
    export NEXT_TELEMETRY_DISABLED=1
    
    log_success "Environment setup complete"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    if [[ "$VERBOSE" == "true" ]]; then
        pnpm install --frozen-lockfile
    else
        pnpm install --frozen-lockfile --silent
    fi
    
    log_success "Dependencies installed"
}

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests as requested"
        return 0
    fi
    
    log_info "Running tests and checks..."
    
    # Linting
    log_info "Running ESLint..."
    pnpm lint
    
    # Type checking
    log_info "Running TypeScript type check..."
    pnpm type-check
    
    # Unit tests
    log_info "Running unit tests..."
    pnpm test --passWithNoTests
    
    log_success "All tests and checks passed"
}

build_application() {
    log_info "Building application..."
    
    if [[ "$VERBOSE" == "true" ]]; then
        pnpm build
    else
        pnpm build > /dev/null 2>&1
    fi
    
    log_success "Application built successfully"
}

build_docker_image() {
    log_info "Building Docker image..."
    
    local image_tag="open-voice-chat:latest"
    
    if [[ "$VERBOSE" == "true" ]]; then
        docker build -t "$image_tag" .
    else
        docker build -t "$image_tag" . > /dev/null 2>&1
    fi
    
    log_success "Docker image built: $image_tag"
}

deploy_application() {
    if [[ "$BUILD_ONLY" == "true" ]]; then
        log_warning "Build-only mode enabled. Skipping deployment."
        return 0
    fi
    
    log_info "Deploying application..."
    
    case "$ENVIRONMENT" in
        "production")
            deploy_production
            ;;
        "staging")
            deploy_staging
            ;;
        "development")
            deploy_development
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_success "Deployment complete"
}

deploy_production() {
    log_info "Deploying to production..."
    
    # Stop existing containers
    docker-compose -f docker-compose.yml down || true
    
    # Start new containers
    docker-compose -f docker-compose.yml up -d
    
    # Wait for application to be ready
    wait_for_health_check
}

deploy_staging() {
    log_info "Deploying to staging..."
    
    # Similar to production but with different compose file
    docker-compose -f docker-compose.staging.yml down || true
    docker-compose -f docker-compose.staging.yml up -d
    
    wait_for_health_check
}

deploy_development() {
    log_info "Starting development server..."
    
    # Just start the development server
    pnpm dev
}

wait_for_health_check() {
    log_info "Waiting for application to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Application is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for application..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Application failed to start within expected time"
    exit 1
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove any temporary files created during deployment
    rm -rf .next/cache || true
    
    log_success "Cleanup complete"
}

main() {
    log_info "Starting Open Voice Chat deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Build only: $BUILD_ONLY"
    log_info "Skip tests: $SKIP_TESTS"
    
    check_dependencies
    setup_environment
    install_dependencies
    run_tests
    build_application
    build_docker_image
    deploy_application
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Application is now available at: http://localhost:3000"
        log_info "Traefik dashboard: http://localhost:8080"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
