#!/bin/bash

echo "🚀 COMPREHENSIVE ROLE-BASED TESTING SUITE - PHASES 1-5"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to verify server is running
verify_server() {
    print_status $BLUE "🔍 Verifying server is running on port 3001..."
    
    # Check if server responds
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        print_status $GREEN "✅ Server is running and responding"
        
        # Additional endpoint checks
        if curl -f http://localhost:3001/login >/dev/null 2>&1; then
            print_status $GREEN "✅ Login page accessible"
        else
            print_status $YELLOW "⚠️  Login page check failed"
        fi
        
        return 0
    else
        print_status $RED "❌ Server not responding on port 3001"
        return 1
    fi
}

# Function to start server if needed
start_server() {
    print_status $YELLOW "🔄 Starting Next.js development server..."
    
    # Kill any existing processes
    pkill -f "next dev" 2>/dev/null
    
    # Start server in background
    PORT=3001 npm run dev &
    SERVER_PID=$!
    
    print_status $BLUE "⏳ Waiting for server to start..."
    sleep 8
    
    # Verify server started
    if verify_server; then
        print_status $GREEN "✅ Server started successfully (PID: $SERVER_PID)"
        return 0
    else
        print_status $RED "❌ Failed to start server"
        return 1
    fi
}

# Function to run specific test suite
run_test_suite() {
    local test_file=$1
    local description=$2
    
    print_status $BLUE "🧪 Running: $description"
    print_status $BLUE "📁 Test file: $test_file"
    
    # Create screenshots directory if it doesn't exist
    mkdir -p tests/screenshots
    
    # Run the test with headed browser
    if npx playwright test "$test_file" --headed --reporter=line; then
        print_status $GREEN "✅ $description - PASSED"
        return 0
    else
        print_status $RED "❌ $description - FAILED"
        return 1
    fi
}

# Function to run debug mode
run_debug_mode() {
    print_status $BLUE "🔬 Starting debug mode..."
    print_status $YELLOW "   This will open Playwright UI for interactive debugging"
    
    npx playwright test --ui tests/e2e/comprehensive-debugging-role-test-suite.spec.ts
}

# Function to show menu
show_menu() {
    echo ""
    print_status $BLUE "📋 TEST EXECUTION OPTIONS:"
    echo "1. Run All Comprehensive Tests (Phases 1-5)"
    echo "2. Run Debugging-Focused Test Suite"
    echo "3. Run Both Test Suites"
    echo "4. Run Specific Phase Tests"
    echo "5. Run Role-Specific Tests"
    echo "6. Debug Mode (Interactive)"
    echo "7. Server Status Check"
    echo "8. Start/Restart Server"
    echo "0. Exit"
    echo ""
}

# Function to run phase-specific tests
run_phase_tests() {
    echo ""
    print_status $BLUE "📋 SELECT PHASE TO TEST:"
    echo "1. Phase 1: Authentication Foundation"
    echo "2. Phase 2: Clients Module"
    echo "3. Phase 2B: UI/UX Polish & Design System"
    echo "4. Phase 3: Services & Tasks"
    echo "5. Phase 4: File Attachments"
    echo "6. Phase 5: Requests & Webhooks"
    echo "7. All Phases"
    echo "0. Back to main menu"
    echo ""
    
    read -p "Enter your choice (0-7): " phase_choice
    
    case $phase_choice in
        1)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 1"
            ;;
        2)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 2"
            ;;
        3)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 2B"
            ;;
        4)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 3"
            ;;
        5)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 4"
            ;;
        6)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "PHASE 5"
            ;;
        7)
            run_test_suite "tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts" "All Phases Testing"
            ;;
        0)
            return
            ;;
        *)
            print_status $RED "❌ Invalid choice"
            ;;
    esac
}

# Function to run role-specific tests
run_role_tests() {
    echo ""
    print_status $BLUE "📋 SELECT ROLE TO TEST:"
    echo "1. ADMIN (Full system access)"
    echo "2. SERVICE_MANAGER (Management permissions)"
    echo "3. COPYWRITER (Limited assigned access)"
    echo "4. EDITOR (Limited assigned access)"
    echo "5. VA (Basic access)"
    echo "6. CLIENT (Client dashboard only)"
    echo "7. All Roles"
    echo "0. Back to main menu"
    echo ""
    
    read -p "Enter your choice (0-7): " role_choice
    
    case $role_choice in
        1)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "ADMIN"
            ;;
        2)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "SERVICE_MANAGER"
            ;;
        3)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "COPYWRITER"
            ;;
        4)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "EDITOR"
            ;;
        5)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "VA"
            ;;
        6)
            npx playwright test tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts --headed -g "CLIENT"
            ;;
        7)
            run_test_suite "tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts" "All Roles Testing"
            ;;
        0)
            return
            ;;
        *)
            print_status $RED "❌ Invalid choice"
            ;;
    esac
}

# Main execution
main() {
    # Initial server check
    if ! verify_server; then
        print_status $YELLOW "⚠️  Server not running, attempting to start..."
        if ! start_server; then
            print_status $RED "❌ Cannot proceed without server running"
            exit 1
        fi
    fi
    
    # Main menu loop
    while true; do
        show_menu
        read -p "Enter your choice (0-8): " choice
        
        case $choice in
            1)
                run_test_suite "tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts" "Comprehensive Test Suite - All Phases"
                ;;
            2)
                run_test_suite "tests/e2e/comprehensive-debugging-role-test-suite.spec.ts" "Debugging-Focused Test Suite"
                ;;
            3)
                print_status $BLUE "🧪 Running both test suites..."
                run_test_suite "tests/e2e/comprehensive-phases-1-5-role-testing-suite.spec.ts" "Main Comprehensive Suite"
                run_test_suite "tests/e2e/comprehensive-debugging-role-test-suite.spec.ts" "Debugging Suite"
                ;;
            4)
                run_phase_tests
                ;;
            5)
                run_role_tests
                ;;
            6)
                run_debug_mode
                ;;
            7)
                verify_server
                ;;
            8)
                start_server
                ;;
            0)
                print_status $GREEN "👋 Goodbye!"
                exit 0
                ;;
            *)
                print_status $RED "❌ Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Trap to cleanup on exit
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status $YELLOW "🧹 Cleaning up server process..."
        kill $SERVER_PID 2>/dev/null
    fi
}

trap cleanup EXIT

# Start main execution
main 