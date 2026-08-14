#!/usr/bin/env python3
"""
Cron job script for fetching rates from external URL and storing in MariaDB.
Runs every 5 minutes from 9:00 AM to 8:00 PM on Synology NAS.

Cron expression: */5 9-20 * * *

Usage:
    python3 fetch_rates_db.py [--url URL] [--db-host HOST] [--db-port PORT] [--db-name NAME] [--db-user USER] [--db-pass PASS]

Environment Variables:
    EXTERNAL_RATES_URL - External API URL
    DB_HOST - Database host (default: localhost)
    DB_PORT - Database port (default: 3306)
    DB_NAME - Database name (default: devi_jewellers)
    DB_USER - Database user (default: root)
    DB_PASS - Database password
"""

import argparse
import datetime
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

import urllib.request
import urllib.error
import urllib.parse

# Try to import mysql connector, fall back to pymysql
try:
    import mysql.connector
    MYSQL_DRIVER = 'mysql-connector'
except ImportError:
    try:
        import pymysql
        pymysql.install_as_MySQLdb()
        import MySQLdb as mysql_connector
        MYSQL_DRIVER = 'pymysql'
    except ImportError:
        MYSQL_DRIVER = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class RateFetcherDB:
    """Fetches exchange rates from external URL and stores in MariaDB."""
    
    DEFAULT_URL = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"
    TIMEOUT = 10  # seconds
    
    # Default rate calculation percentages
    DEFAULT_PERCENTAGES = {
        'perc_24k_purchase': 0.985,
        'perc_24k_exchange': 0.99,
        'perc_22k_sale': 0.92,
        'perc_22k_purchase': 0.90,
        'perc_22k_exchange': 0.91,
        'perc_18k_sale': 0.86,
        'perc_18k_purchase': 0.80,
        'perc_18k_exchange': 0.85,
        'silver_purchase_offset': -5000,
        'silver_exchange_offset': -3000,
    }
    
    def __init__(
        self,
        url: Optional[str] = None,
        db_host: str = "localhost",
        db_port: int = 3306,
        db_name: str = "devi_jewellers",
        db_user: str = "root",
        db_pass: str = "",
        log_file: str = "/volume1/logs/fetch-rates.log"
    ):
        self.url = url or os.environ.get("EXTERNAL_RATES_URL", self.DEFAULT_URL)
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name
        self.db_user = db_user
        self.db_pass = db_pass
        self.log_file = Path(log_file)
        
        # Ensure directories exist
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log to both console and file."""
        log_entry = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{level}] {message}"
        print(log_entry)
        
        try:
            with open(self.log_file, "a") as f:
                f.write(log_entry + "\n")
        except Exception as e:
            logger.warning(f"Could not write to log file: {e}")
    
    def fetch(self) -> Dict[str, Any]:
        """Fetch rates from external URL."""
        self._log(f"Fetching rates from: {self.url}")
        
        try:
            request = urllib.request.Request(
                self.url,
                headers={
                    "accept": "application/json, text/plain, */*",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            )
            
            with urllib.request.urlopen(request, timeout=self.TIMEOUT) as response:
                if response.status != 200:
                    raise urllib.error.HTTPError(
                        self.url,
                        response.status,
                        f"HTTP {response.status}",
                        response.headers,
                        None
                    )
                
                data = response.read().decode("utf-8")
                return json.loads(data)
                
        except urllib.error.URLError as e:
            self._log(f"Network error: {e}", "ERROR")
            raise
        except urllib.error.HTTPError as e:
            self._log(f"HTTP error: {e.code} {e.reason}", "ERROR")
            raise
        except json.JSONDecodeError as e:
            self._log(f"JSON parse error: {e}", "ERROR")
            raise
        except Exception as e:
            self._log(f"Unexpected error: {e}", "ERROR")
            raise
    
    def parse_rates(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and clean rate values from JSON response."""
        def parse_value(val):
            if val is None:
                return None
            if isinstance(val, (int, float)):
                return val
            # Remove commas and spaces
            cleaned = str(val).replace(',', '').strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        
        gold_24k = parse_value(data.get("24K Gold"))
        gold_22k = parse_value(data.get("22K Gold"))
        gold_18k = parse_value(data.get("18K Gold"))
        silver_raw = parse_value(data.get("Silver"))
        
        if not gold_24k or not silver_raw:
            raise ValueError("Missing required fields: 24K Gold or Silver")
        
        # Convert silver from per 10 grams to per kg if < 10000
        silver = silver_raw * 100 if silver_raw < 10000 else silver_raw
        
        # Round to nearest 10
        gold_24k = round(gold_24k / 10) * 10
        gold_22k = round(gold_22k / 10) * 10 if gold_22k else None
        gold_18k = round(gold_18k / 10) * 10 if gold_18k else None
        silver = round(silver / 10) * 10
        
        return {
            'gold_24k': gold_24k,
            'gold_22k': gold_22k,
            'gold_18k': gold_18k,
            'silver': silver
        }
    
    def calculate_rates(self, raw_rates: Dict[str, Any], db_rates: Optional[Dict] = None) -> Dict[str, Any]:
        """Calculate all rates based on percentages."""
        # Use DB rates or defaults
        perc = db_rates if db_rates else self.DEFAULT_PERCENTAGES
        
        gold_24k = raw_rates['gold_24k']
        gold_22k_raw = raw_rates.get('gold_22k')
        gold_18k_raw = raw_rates.get('gold_18k')
        silver = raw_rates['silver']
        
        # Calculate 24K rates
        gold_24k_purchase = round(gold_24k * perc.get('perc_24k_purchase', 0.985) / 10) * 10
        gold_24k_exchange = round(gold_24k * perc.get('perc_24k_exchange', 0.99) / 10) * 10
        
        # Calculate 22K rates (use API value or calculate)
        if gold_22k_raw and gold_22k_raw > 0:
            gold_22k_sale = gold_22k_raw
        else:
            gold_22k_sale = round(gold_24k * perc.get('perc_22k_sale', 0.92) / 10) * 10
        gold_22k_purchase = round(gold_24k * perc.get('perc_22k_purchase', 0.90) / 10) * 10
        gold_22k_exchange = round(gold_24k * perc.get('perc_22k_exchange', 0.91) / 10) * 10
        
        # Calculate 18K rates (use API value or calculate)
        if gold_18k_raw and gold_18k_raw > 0:
            gold_18k_sale = gold_18k_raw
        else:
            gold_18k_sale = round(gold_24k * perc.get('perc_18k_sale', 0.86) / 10) * 10
        gold_18k_purchase = round(gold_24k * perc.get('perc_18k_purchase', 0.80) / 10) * 10
        gold_18k_exchange = round(gold_24k * perc.get('perc_18k_exchange', 0.85) / 10) * 10
        
        # Calculate silver rates
        silver_purchase = round(silver + perc.get('silver_purchase_offset', -5000) / 10) * 10
        silver_exchange = round(silver + perc.get('silver_exchange_offset', -3000) / 10) * 10
        
        return {
            'gold_24k_sale': gold_24k,
            'gold_24k_purchase': gold_24k_purchase,
            'gold_24k_exchange': gold_24k_exchange,
            'gold_22k_sale': gold_22k_sale,
            'gold_22k_purchase': gold_22k_purchase,
            'gold_22k_exchange': gold_22k_exchange,
            'gold_18k_sale': gold_18k_sale,
            'gold_18k_purchase': gold_18k_purchase,
            'gold_18k_exchange': gold_18k_exchange,
            'silver_per_kg_sale': silver,
            'silver_per_kg_purchase': silver_purchase,
            'silver_per_kg_exchange': silver_exchange,
        }
    
    def get_db_connection(self):
        """Get database connection."""
        if MYSQL_DRIVER == 'mysql-connector':
            return mysql.connector.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_pass,
                database=self.db_name
            )
        elif MYSQL_DRIVER == 'pymysql':
            return pymysql.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_pass,
                database=self.db_name,
                charset='utf8mb4'
            )
        else:
            raise ImportError("No MySQL driver available. Install mysql-connector-python or pymysql")
    
    def get_rate_settings(self) -> Optional[Dict]:
        """Get rate settings from database."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT perc_24k_purchase, perc_24k_exchange, perc_22k_sale,
                       perc_22k_purchase, perc_22k_exchange, perc_18k_sale,
                       perc_18k_purchase, perc_18k_exchange, silver_purchase_offset,
                       silver_exchange_offset
                FROM rate_settings LIMIT 1
            """)
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return result
        except Exception as e:
            self._log(f"Could not fetch rate settings: {e}", "WARNING")
            return None
    
    def save_rates(self, rates: Dict[str, Any]) -> bool:
        """Save rates to database."""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Deactivate existing rates
            cursor.execute("UPDATE gold_rates SET is_active = FALSE WHERE is_active = TRUE")
            
            # Insert new rate
            cursor.execute("""
                INSERT INTO gold_rates (
                    gold_24k_sale, gold_24k_purchase, gold_24k_exchange,
                    gold_22k_sale, gold_22k_purchase, gold_22k_exchange,
                    gold_18k_sale, gold_18k_purchase, gold_18k_exchange,
                    silver_per_kg_sale, silver_per_kg_purchase, silver_per_kg_exchange,
                    is_active, source
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                rates['gold_24k_sale'], rates['gold_24k_purchase'], rates['gold_24k_exchange'],
                rates['gold_22k_sale'], rates['gold_22k_purchase'], rates['gold_22k_exchange'],
                rates['gold_18k_sale'], rates['gold_18k_purchase'], rates['gold_18k_exchange'],
                rates['silver_per_kg_sale'], rates['silver_per_kg_purchase'], rates['silver_per_kg_exchange'],
                True, 'api'
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            self._log("Rates saved to database successfully")
            return True
            
        except Exception as e:
            self._log(f"Failed to save rates: {e}", "ERROR")
            return False
    
    def run(self) -> bool:
        """Main execution."""
        self._log("=" * 50)
        self._log("Starting rate fetch job")
        
        try:
            # Fetch from external URL
            data = self.fetch()
            
            # Parse rates
            raw_rates = self.parse_rates(data)
            self._log(f"Raw rates: {raw_rates}")
            
            # Get rate settings from DB
            db_settings = self.get_rate_settings()
            
            # Calculate all rates
            rates = self.calculate_rates(raw_rates, db_settings)
            self._log(f"Calculated rates: {rates}")
            
            # Save to database
            success = self.save_rates(rates)
            
            if success:
                self._log("Job completed successfully")
                return True
            else:
                return False
            
        except Exception as e:
            self._log(f"Job failed: {e}", "ERROR")
            return False


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Fetch exchange rates and store in MariaDB"
    )
    parser.add_argument("--url", "-u", help="External API URL")
    parser.add_argument("--db-host", default="localhost", help="Database host")
    parser.add_argument("--db-port", type=int, default=3306, help="Database port")
    parser.add_argument("--db-name", default="devi_jewellers", help="Database name")
    parser.add_argument("--db-user", default="root", help="Database user")
    parser.add_argument("--db-pass", default="", help="Database password")
    parser.add_argument("--log-file", "-l", default="/volume1/logs/fetch-rates.log", help="Log file")
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    fetcher = RateFetcherDB(
        url=args.url,
        db_host=args.db_host,
        db_port=args.db_port,
        db_name=args.db_name,
        db_user=args.db_user,
        db_pass=args.db_pass,
        log_file=args.log_file
    )
    
    success = fetcher.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
