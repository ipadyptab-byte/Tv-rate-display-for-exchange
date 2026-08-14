# Synology NAS Cron Job Setup for Rate Fetching

This document explains how to set up a cron job on Synology NAS to fetch exchange rates every 5 minutes from 9:00 AM to 8:00 PM.

## Quick Setup

### Option 1: Using Synology Task Scheduler (Recommended)

1. **Upload the script** to your Synology NAS:
   - Create a folder: `/volume1/scripts/`
   - Upload `fetch-rates.sh` to this folder

2. **Make the script executable**:
   ```bash
   chmod +x /volume1/scripts/fetch-rates.sh
   ```

3. **Create the scheduled task**:
   - Open **Control Panel** → **Task Scheduler**
   - Click **Create** → **Scheduled Task** → **User-defined script**
   - Configure:
     - **Task Name**: `Fetch Exchange Rates`
     - **User**: root
     - **Schedule**: 
       - Daily
       - Time: 09:00 - 20:00
       - Repeat: Every 5 minutes
     - **Task Settings**:
       - Run command: `/bin/bash /volume1/scripts/fetch-rates.sh`

4. **Save and enable** the task

### Option 2: Using Crontab

Add this line to your crontab (`crontab -e`):

```bash
*/5 9-20 * * * /bin/bash /volume1/scripts/fetch-rates.sh >> /volume1/logs/fetch-rates-cron.log 2>&1
```

This cron expression means:
- `*/5` - Every 5 minutes
- `9-20` - Hours 9 AM to 8 PM (20:00)
- `* * *` - Every day of month, every month, every day of week

## Cron Expression Breakdown

| Field | Value | Description |
|-------|-------|-------------|
| Minute | `*/5` | Every 5 minutes (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55) |
| Hour | `9-20` | From 9 AM to 8 PM (inclusive) |
| Day of Month | `*` | Every day |
| Month | `*` | Every month |
| Day of Week | `*` | Every day of the week |

## Configuration

Edit the script to customize:

```bash
# External API URL
EXTERNAL_URL="https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"

# Log file location
LOG_FILE="/volume1/logs/fetch-rates.log"

# Data directory for storing rates
DATA_DIR="/volume1/data/rates"

# Request timeout in seconds
TIMEOUT=10
```

You can also set environment variables:
```bash
EXTERNAL_RATES_URL="your-custom-url" /bin/bash /volume1/scripts/fetch-rates.sh
```

## Log Files

- **Main log**: `/volume1/logs/fetch-rates.log`
- **Cron log** (if using crontab): `/volume1/logs/fetch-rates-cron.log`
- **Rate data**: `/volume1/data/rates/current_rates.json`

## Testing

Test the script manually:
```bash
# Make executable (first time only)
chmod +x /volume1/scripts/fetch-rates.sh

# Run manually
/bin/bash /volume1/scripts/fetch-rates.sh

# Check logs
cat /volume1/logs/fetch-rates.log
```

## Troubleshooting

### Script not running
- Verify the path is correct: `ls -la /volume1/scripts/fetch-rates.sh`
- Check if curl is installed: `which curl`
- Check cron logs: `cat /var/log/cron`

### Permission denied
- Make script executable: `chmod +x /volume1/scripts/fetch-rates.sh`
- Check file permissions: `ls -la /volume1/scripts/`

### Network issues
- Test connectivity: `curl -I https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php`
- Check firewall rules on Synology

### Task Scheduler not showing
- Ensure you're using DSM 7.x or newer
- Log in as admin user with appropriate permissions
