#!/bin/bash
#
# Jules Environment Setup & Validation Script
# For Rust Web Scraper Project
#
# DESCRIPTION:
#   Validates Jules execution environment and sets up Rust project.
#   Designed to run in Jules' Ubuntu Linux VM with preinstalled Rust/Cargo.
#   Can also be used for local development environment setup.
#
# USAGE:
#   ./jules_setup.sh [--validate-only] [--full-setup]
#
# OPTIONS:
#   --validate-only: Only check environment, don't modify anything
#   --full-setup: Full setup including dependencies and test run
#
# ENVIRONMENT:
#   - Ubuntu Linux (Jules VM)
#   - Rust/Cargo preinstalled
#   - Chrome/Chromium available
#   - Git available
#
# EXIT CODES:
#   0 - Success
#   1 - Environment validation failed
#   2 - Setup failed
#
# AUTHOR: Faye Håkansdotter
# VERSION: 3.0 (Jules-optimized)
#

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Log levels
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function: validate_environment
# Description: Checks that all required tools are available
# Returns: 0 if valid, 1 if missing critical tools
validate_environment() {
    log_info "Validating Jules environment..."
    
    local missing=0
    
    # Check Rust/Cargo (critical)
    if command -v rustc &>/dev/null; then
        local rust_version=$(rustc --version)
        log_success "Rust: $rust_version"
    else
        log_error "Rust not found (should be preinstalled in Jules VM)"
        missing=1
    fi
    
    if command -v cargo &>/dev/null; then
        local cargo_version=$(cargo --version)
        log_success "Cargo: $cargo_version"
    else
        log_error "Cargo not found (should be preinstalled in Jules VM)"
        missing=1
    fi
    
    # Check Git (critical)
    if command -v git &>/dev/null; then
        local git_version=$(git --version)
        log_success "Git: $git_version"
    else
        log_error "Git not found"
        missing=1
    fi
    
    # Check Chrome/Chromium (required for headless_chrome)
    if command -v google-chrome &>/dev/null || command -v chromium &>/dev/null || command -v chromium-browser &>/dev/null; then
        log_success "Chrome/Chromium: Available"
    else
        log_warn "Chrome/Chromium not found (may cause scraper failures)"
        log_info "Install with: sudo apt-get install -y chromium-browser"
    fi
    
    # Check Node.js (optional, for Raycast extension)
    if command -v node &>/dev/null; then
        local node_version=$(node --version)
        log_success "Node.js: $node_version (optional)"
    else
        log_warn "Node.js not found (needed for Raycast extension development)"
    fi
    
    # System info
    log_info "OS: $(uname -s) $(uname -r)"
    log_info "Architecture: $(uname -m)"
    
    if [[ $missing -eq 0 ]]; then
        log_success "Environment validation passed"
        return 0
    else
        log_error "Environment validation failed"
        return 1
    fi
}

# Function: verify_project_structure
# Description: Checks that we're in a Rust project directory
# Returns: 0 if valid, 1 if not
verify_project_structure() {
    log_info "Verifying project structure..."
    
    if [[ ! -f "Cargo.toml" ]]; then
        log_error "Cargo.toml not found. Are you in the project root?"
        return 1
    fi
    
    if [[ ! -d "src" ]]; then
        log_error "src/ directory not found"
        return 1
    fi
    
    log_success "Project structure valid"
    return 0
}

# Function: install_dependencies
# Description: Installs Rust dependencies via Cargo
# Returns: 0 on success, 2 on failure
install_dependencies() {
    log_info "Installing Rust dependencies..."
    
    if cargo fetch; then
        log_success "Dependencies fetched"
    else
        log_error "Failed to fetch dependencies"
        return 2
    fi
    
    return 0
}

# Function: build_project
# Description: Builds the Rust project in release mode
# Returns: 0 on success, 2 on failure
build_project() {
    log_info "Building project (release mode)..."
    
    if cargo build --release; then
        log_success "Build successful"
        
        # Show binary location
        if [[ -f "target/release/advanced_rust_scraper" ]]; then
            local binary_size=$(du -h target/release/advanced_rust_scraper | cut -f1)
            log_info "Binary: target/release/advanced_rust_scraper ($binary_size)"
        fi
    else
        log_error "Build failed"
        return 2
    fi
    
    return 0
}

# Function: run_tests
# Description: Runs the test suite
# Returns: 0 on success, 2 on failure
run_tests() {
    log_info "Running test suite..."
    
    if cargo test --all -- --nocapture; then
        log_success "All tests passed"
    else
        log_error "Tests failed"
        return 2
    fi
    
    return 0
}

# Function: run_linters
# Description: Runs clippy and rustfmt checks
# Returns: 0 on success, 2 on failure
run_linters() {
    log_info "Running linters..."
    
    # Clippy
    log_info "Running clippy..."
    if cargo clippy -- -D warnings; then
        log_success "Clippy: No warnings"
    else
        log_warn "Clippy found issues (attempting auto-fix)"
        cargo clippy --fix --allow-dirty --allow-staged || true
    fi
    
    # Rustfmt
    log_info "Checking formatting..."
    if cargo fmt -- --check; then
        log_success "Rustfmt: Code is formatted"
    else
        log_warn "Code needs formatting (running cargo fmt)"
        cargo fmt
        log_success "Code formatted"
    fi
    
    return 0
}

# Function: generate_docs
# Description: Generates and validates Rust documentation
# Returns: 0 on success
generate_docs() {
    log_info "Generating documentation..."
    
    if cargo doc --no-deps; then
        log_success "Documentation generated"
        log_info "Docs location: target/doc/advanced_rust_scraper/index.html"
    else
        log_warn "Documentation generation had warnings"
    fi
    
    return 0
}

# Function: quick_validation
# Description: Quick smoke test of the binary
# Returns: 0 on success, 2 on failure
quick_validation() {
    log_info "Running quick validation..."
    
    local binary="./target/release/advanced_rust_scraper"
    
    if [[ ! -f "$binary" ]]; then
        log_error "Binary not found at $binary"
        return 2
    fi
    
    # Test --help flag
    if $binary --help &>/dev/null; then
        log_success "Binary responds to --help"
    else
        log_error "Binary failed to respond to --help"
        return 2
    fi
    
    # Test with example.com (if network available)
    log_info "Testing scrape of example.com..."
    if timeout 30s $binary https://example.com --output /tmp/test_output.json 2>/dev/null; then
        if [[ -f /tmp/test_output.json ]]; then
            log_success "Scraping test passed"
            rm -f /tmp/test_output.json
        else
            log_warn "Scraping completed but no output file"
        fi
    else
        log_warn "Scraping test failed (may be network/timeout issue)"
    fi
    
    return 0
}

# Function: full_setup
# Description: Complete setup workflow
# Returns: 0 on success, non-zero on failure
full_setup() {
    log_info "=== Starting Full Setup ==="
    
    verify_project_structure || return 1
    install_dependencies || return 2
    build_project || return 2
    run_linters || return 2
    run_tests || return 2
    generate_docs || return 0
    quick_validation || return 0
    
    log_success "=== Full Setup Complete ==="
    return 0
}

# Function: main
# Description: Main entry point with argument parsing
# Parameters: Script arguments
# Returns: Exit code
main() {
    local validate_only=0
    local full_setup_mode=0
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --validate-only)
                validate_only=1
                shift
                ;;
            --full-setup)
                full_setup_mode=1
                shift
                ;;
            --help)
                echo "Usage: $0 [--validate-only] [--full-setup]"
                echo ""
                echo "Options:"
                echo "  --validate-only   Only validate environment, don't modify anything"
                echo "  --full-setup      Full setup including build, test, and validation"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    log_info "=== Jules Environment Setup & Validation ==="
    log_info "Project: Rust Web Scraper"
    log_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Always validate environment first
    validate_environment || exit 1
    echo ""
    
    if [[ $validate_only -eq 1 ]]; then
        log_info "Validate-only mode: Skipping setup"
        exit 0
    fi
    
    if [[ $full_setup_mode -eq 1 ]]; then
        full_setup
        exit $?
    fi
    
    # Default: minimal setup (verify + build)
    log_info "=== Running Minimal Setup ==="
    verify_project_structure || exit 1
    build_project || exit 2
    log_success "=== Minimal Setup Complete ==="
    log_info "Run with --full-setup for complete validation"
    
    exit 0
}

# Execute main function
main "$@"
