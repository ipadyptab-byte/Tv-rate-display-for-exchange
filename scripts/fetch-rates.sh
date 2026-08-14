#!/bin/bash

# Cron job script for fetching rates from external URL
# Runs every 5 minutes from 9:00 AM to 8:00 PM on Synology NAS
#
# Cron expression: */5 9-20 * * *
# This runs at minutes 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
# between hours 9 (9 AM) and 20 (8 PM) every day
#
# Setup on Synology NAS:
# 1. Upload this script to your Synology NAS (e.g., /volume1/scripts/fetch-rates.sh)
# 2. Make it executable: chmod +x /volume1/scripts/fetch-rates.sh
# 3. Add to Task Scheduler: Control Panel -> Task Scheduler -> Create -> Scheduled Task -> User-defined script
# 4. Set schedule: Daily, repeat every 5 minutes, from 09:00 to 20:00

# Configuration
EXTERNAL_URL="${EXTERNAL_RATES_URL:-https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php}"
LOG_FILE="/volume1/logs/fetch-rates.log"
DATA_DIR="/volume1/data/rates"
TIMEOUT=10

# Create directories if they don't exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$DATA_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to fetch rates
fetch_rates() {
    local response
    local http_code
    
    log_message "Fetching rates from: $EXTERNAL_URL"
    
    # Fetch rates from external URL with timeout
    response=$(curl -s -w "\n%{http_code}" \
        --max-time "$TIMEOUT" \
        -H "accept: application/json, text/plain, */*" \
        -H "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
        "$EXTERNAL_URL" 2>&1)
    
    # Extract HTTP code (last line)
    http_code=$(echo "$response" | tail -n1)
    
    # Get body (all except last line)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" != "200" ]; then
        log_message "ERROR: HTTP request failed with code: $http_code"
        log_message "Response: $body"
        return 1
    fi
    
    # Validate JSON response
    if ! echo "$body" | grep -q '"24K Gold"'; then
        log_message "ERROR: Invalid JSON response - missing 24K Gold field"
        log_message "Response: $body"
        return 1
    fi
    
    # Save rates to file with timestamp
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    echo "$body" > "$DATA_DIR/rates_$timestamp.json"
    
    # Also save as current rates
    echo "$body" > "$DATA_DIR/current_rates.json"
    
    log_message "SUCCESS: Rates fetched and saved"
    log_message "Data: $body"
    
    return 0
}

# Main execution
log_message "========== Starting rate fetch job =========="

# Check if curl is available
if ! command -v curl &> /dev/null; then
    log_message "ERROR: curl is not installed"
    exit 1
fi

# Run fetch
if fetch_rates; then
    log_message "Job completed successfully"
    exit 0
else
    log_message "Job failed"
    exit 1
fi
