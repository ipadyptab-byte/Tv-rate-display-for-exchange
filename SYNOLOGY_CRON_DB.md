# Synology NAS Cron Job - Fetch Rates to MariaDB

This document explains how to set up a cron job on Synology NAS to fetch exchange rates every 5 minutes from 9:00 AM to 8:00 PM and store them in MariaDB.

## Files Created

1. **scripts/fetch-rates-db.sh** - Shell script version (uses curl + mysql CLI)
2. **scripts/fetch_rates_db.py** - Python version (more reliable, requires mysql-connector or pymysql)

## Prerequisites

### Install required packages on Synology NAS

```bash
# Install Python3 and pip
apt-get update && apt-get install -y python3 python3-pip

# Install MySQL Python driver (choose one)
pip3 install mysql-connector-python
# OR
pip3 install pymysql
```

## Quick Setup

### Option 1: Shell Script (bash)

1. **Upload the script** to your Synology NAS:
   ```bash
   # Upload fetch-rates-db.sh to /volume1/scripts/
   ```

2. **Edit the script** to set your database password:
   ```bash
   nano /volume1/scripts/fetch-rates-db.sh
   ```
   
   Change this line:
   ```bash
   DB_PASS="your_password_here"
   ```

3. **Make the script executable**:
   ```bash
   chmod +x /volume1/scripts/fetch-rates-db.sh
   ```

4. **Create the scheduled task** in Synology Task Scheduler:
   - **Control Panel** → **Task Scheduler** → **Create** → **Scheduled Task** → **User-defined script**
   - Task Name: `Fetch Rates to DB`
   - User: root
   - Schedule: Daily, 09:00 - 20:00, repeat every 5 minutes
   - Run command: `/bin/bash /volume1/scripts/fetch-rates-db.sh`

### Option 2: Python Script (Recommended)

1. **Install dependencies**:
   ```bash
   pip3 install mysql-connector-python
   ```

2. **Upload the script** to `/volume1/scripts/`

3. **Make executable**:
   ```bash
   chmod +x /volume1/scripts/fetch_rates_db.py
   ```

4. **Test run**:
   ```bash
   python3 /volume1/scripts/fetch_rates_db.py --db-pass "your_password"
   ```

5. **Create scheduled task**:
   - Run command: `python3 /volume1/scripts/fetch_rates_db.py --db-pass "your_password"`

### Option 3: Using Crontab

Add this line to crontab (`crontab -e`):

```bash
# Shell script version
*/5 9-20 * * * /bin/bash /volume1/scripts/fetch-rates-db.sh >> /volume1/logs/fetch-rates-cron.log 2>&1

# OR Python version
*/5 9-20 * * * /usr/bin/python3 /volume1/scripts/fetch_rates_db.py --db-pass "your_password" >> /volume1/logs/fetch-rates-cron.log 2>&1
```

## Configuration

### Shell Script (fetch-rates-db.sh)

Edit these variables in the script:

```bash
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
```

### Python Script (fetch_rates_db.py)

You can pass arguments or use environment variables:

```bash
# Command line arguments
python3 fetch_rates_db.py \
    --url "https://your-api.com/rates" \
    --db-host "localhost" \
    --db-port 3306 \
    --db-name "devi_jewellers" \
    --db-user "root" \
    --db-pass "your_password" \
    --log-file "/volume1/logs/fetch-rates.log"

# OR environment variables
EXTERNAL_RATES_URL="https://your-api.com/rates" \
DB_PASS="your_password" \
python3 fetch_rates_db.py
```

## Cron Expression

```
*/5 9-20 * * *
```

| Field | Value | Description |
|-------|-------|-------------|
| Minute | `*/5` | Every 5 minutes (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55) |
| Hour | `9-20` | From 9 AM to 8 PM |
| Day | `*` | Every day |
| Month | `*` | Every month |
| Weekday | `*` | Every day of week |

## Testing

```bash
# Test shell script
/bin/bash /volume1/scripts/fetch-rates-db.sh

# Test Python script
python3 /volume1/scripts/fetch_rates_db.py --db-pass "your_password"

# Check logs
cat /volume1/logs/fetch-rates.log
```

## Verify Data in Database

```sql
-- Connect to MariaDB
mysql -u root -p devi_jewellers

-- Check latest rates
SELECT * FROM gold_rates ORDER BY created_date DESC LIMIT 1;

-- Check rate history
SELECT id, gold_24k_sale, silver_per_kg_sale, is_active, source, created_date 
FROM gold_rates ORDER BY created_date DESC LIMIT 10;
```

## Troubleshooting

### Permission denied
```bash
chmod +x /volume1/scripts/fetch-rates-db.sh
chmod +x /volume1/scripts/fetch_rates_db.py
```

### mysql command not found
Ensure MariaDB client is installed or use Python script instead.

### Connection refused
- Check if MariaDB is running
- Verify firewall settings
- Check credentials

### Python module not found
```bash
pip3 install mysql-connector-python
# or
pip3 install pymysql
```
