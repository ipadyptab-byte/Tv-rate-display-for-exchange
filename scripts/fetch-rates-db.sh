#!/bin/bash

# Cron job script for fetching rates from external URL and storing in MariaDB
# Runs every 5 minutes from 9:00 AM to 8:00 PM on Synology NAS
#
# Cron expression: */5 9-20 * * *
#
# Setup on Synology NAS:
# 1. Upload this script to your Synology NAS (e.g., /volume1/scripts/fetch-rates-db.sh)
# 2. Make it executable: chmod +x /volume1/scripts/fetch-rates-db.sh
# 3. Add to Task Scheduler: Control Panel -> Task Scheduler -> Create -> Scheduled Task -> User-defined script
# 4. Set schedule: Daily, repeat every 5 minutes, from 09:00 to 20:00

# ============================================
# Configuration - EDIT THESE VALUES
# ============================================

# Database credentials
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="devi_jewellers"
DB_USER="root"
DB_PASS="your_password_here"  # CHANGE THIS

# External API URL
EXTERNAL_URL="https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"

# Log file
LOG_FILE="/volume1/logs/fetch-rates.log"

# Request timeout (seconds)
TIMEOUT=10

# ============================================
# Script Logic - DO NOT EDIT BELOW
# ============================================

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to execute SQL query
execute_sql() {
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$1" 2>/dev/null
}

# Function to parse JSON and extract values
parse_json() {
    local json="$1"
    local field="$2"
    
    echo "$json" | grep -o "\"$field\":[^,}]*" | sed 's/.*://' | tr -d ' "'
}

# Function to calculate rates based on percentages
calculate_rate() {
    local base="$1"
    local percentage="$2"
    echo "scale=0; $base * $percentage / 10 * 10" | bc
}

# Main execution
log_message "========== Starting rate fetch job =========="

# Check if required commands are available
if ! command -v curl &> /dev/null; then
    log_message "ERROR: curl is not installed"
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    log_message "ERROR: mysql client is not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_message "ERROR: bc is not installed"
    exit 1
fi

# Fetch rates from external URL
log_message "Fetching rates from: $EXTERNAL_URL"

response=$(curl -s -w "\n%{http_code}" \
    --max-time "$TIMEOUT" \
    -H "accept: application/json, text/plain, */*" \
    -H "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
    "$EXTERNAL_URL" 2>&1)

# Extract HTTP code
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" != "200" ]; then
    log_message "ERROR: HTTP request failed with code: $http_code"
    log_message "Response: $body"
    exit 1
fi

# Parse JSON response
gold_24k=$(parse_json "$body" "24K Gold")
gold_22k=$(parse_json "$body" "22K Gold")
gold_18k=$(parse_json "$body" "18K Gold")
silver_raw=$(parse_json "$body" "Silver")

# Clean values (remove commas and spaces)
gold_24k=$(echo "$gold_24k" | tr -d ',')
gold_22k=$(echo "$gold_22k" | tr -d ',')
gold_18k=$(echo "$gold_18k" | tr -d ',')
silver_raw=$(echo "$silver_raw" | tr -d ',')

# Validate required fields
if [ -z "$gold_24k" ] || [ -z "$silver_raw" ]; then
    log_message "ERROR: Missing required fields (24K Gold or Silver)"
    log_message "Response: $body"
    exit 1
fi

# Convert silver from per 10 grams to per kg if needed (if value < 10000)
silver=$(echo "$silver_raw" | awk '{if($1 < 10000) print $1 * 100; else print $1}')

# Round to nearest 10
gold_24k=$(echo "$gold_24k" | awk '{print int($1/10+0.5)*10}')
gold_22k=$(echo "$gold_22k" | awk '{print int($1/10+0.5)*10}')
gold_18k=$(echo "$gold_18k" | awk '{print int($1/10+0.5)*10}')
silver=$(echo "$silver" | awk '{print int($1/10+0.5)*10}')

log_message "Raw values - 24K: $gold_24k, 22K: $gold_22k, 18K: $gold_18k, Silver: $silver"

# Get rate settings from database
rate_settings=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT external_rates_url, perc_24k_purchase, perc_24k_exchange, perc_22k_sale, perc_22k_purchase, perc_22k_exchange, perc_18k_sale, perc_18k_purchase, perc_18k_exchange, silver_purchase_offset, silver_exchange_offset FROM rate_settings LIMIT 1" 2>/dev/null)

# Set defaults if not found in DB
perc_24k_purchase=${perc_24k_purchase:-0.985}
perc_24k_exchange=${perc_24k_exchange:-0.99}
perc_22k_sale=${perc_22k_sale:-0.92}
perc_22k_purchase=${perc_22k_purchase:-0.90}
perc_22k_exchange=${perc_22k_exchange:-0.91}
perc_18k_sale=${perc_18k_sale:-0.86}
perc_18k_purchase=${perc_18k_purchase:-0.80}
perc_18k_exchange=${perc_18k_exchange:-0.85}
silver_purchase_offset=${silver_purchase_offset:--5000}
silver_exchange_offset=${silver_exchange_offset:--3000}

# Calculate all rates
gold_24k_purchase=$(echo "scale=0; $gold_24k * $perc_24k_purchase / 10 * 10" | bc)
gold_24k_exchange=$(echo "scale=0; $gold_24k * $perc_24k_exchange / 10 * 10" | bc)

# Use 22K from API if available, otherwise calculate
if [ -z "$gold_22k" ] || [ "$gold_22k" = "null" ]; then
    gold_22k=$(echo "scale=0; $gold_24k * $perc_22k_sale / 10 * 10" | bc)
fi
gold_22k_purchase=$(echo "scale=0; $gold_24k * $perc_22k_purchase / 10 * 10" | bc)
gold_22k_exchange=$(echo "scale=0; $gold_24k * $perc_22k_exchange / 10 * 10" | bc)

# Use 18K from API if available, otherwise calculate
if [ -z "$gold_18k" ] || [ "$gold_18k" = "null" ]; then
    gold_18k=$(echo "scale=0; $gold_24k * $perc_18k_sale / 10 * 10" | bc)
fi
gold_18k_purchase=$(echo "scale=0; $gold_24k * $perc_18k_purchase / 10 * 10" | bc)
gold_18k_exchange=$(echo "scale=0; $gold_24k * $perc_18k_exchange / 10 * 10" | bc)

silver_purchase=$(echo "scale=0; $silver + $silver_purchase_offset" | bc)
silver_exchange=$(echo "scale=0; $silver + $silver_exchange_offset" | bc)

log_message "Calculated rates:"
log_message "  24K - Sale: $gold_24k, Purchase: $gold_24k_purchase, Exchange: $gold_24k_exchange"
log_message "  22K - Sale: $gold_22k, Purchase: $gold_22k_purchase, Exchange: $gold_22k_exchange"
log_message "  18K - Sale: $gold_18k, Purchase: $gold_18k_purchase, Exchange: $gold_18k_exchange"
log_message "  Silver/kg - Sale: $silver, Purchase: $silver_purchase, Exchange: $silver_exchange"

# Insert into database
# First, deactivate all existing rates
deactivate_sql="UPDATE gold_rates SET is_active = FALSE WHERE is_active = TRUE"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$deactivate_sql" 2>/dev/null

# Insert new rate
insert_sql="INSERT INTO gold_rates (
    gold_24k_sale, gold_24k_purchase, gold_24k_exchange,
    gold_22k_sale, gold_22k_purchase, gold_22k_exchange,
    gold_18k_sale, gold_18k_purchase, gold_18k_exchange,
    silver_per_kg_sale, silver_per_kg_purchase, silver_per_kg_exchange,
    is_active, source
) VALUES (
    $gold_24k, $gold_24k_purchase, $gold_24k_exchange,
    $gold_22k, $gold_22k_purchase, $gold_22k_exchange,
    $gold_18k, $gold_18k_purchase, $gold_18k_exchange,
    $silver, $silver_purchase, $silver_exchange,
    TRUE, 'api'
)"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$insert_sql" 2>/dev/null

if [ $? -eq 0 ]; then
    log_message "SUCCESS: Rates saved to database"
    log_message "Job completed successfully"
    exit 0
else
    log_message "ERROR: Failed to insert rates into database"
    exit 1
fi
