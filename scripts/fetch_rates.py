#!/usr/bin/env python3
"""
Cron job script for fetching rates from external URL.
Runs every 5 minutes from 9:00 AM to 8:00 PM on Synology NAS.

Cron expression: */5 9-20 * * *

Usage:
    python3 fetch_rates.py [--url URL] [--output-dir DIR] [--log-file FILE]

Environment Variables:
    EXTERNAL_RATES_URL - External API URL (default: https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php)
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class RateFetcher:
    """Fetches exchange rates from external URL."""
    
    DEFAULT_URL = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php"
    TIMEOUT = 10  # seconds
    
    def __init__(
        self,
        url: Optional[str] = None,
        output_dir: str = "/volume1/data/rates",
        log_file: str = "/volume1/logs/fetch-rates.log"
    ):
        self.url = url or os.environ.get("EXTERNAL_RATES_URL", self.DEFAULT_URL)
        self.output_dir = Path(output_dir)
        self.log_file = Path(log_file)
        
        # Ensure directories exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
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
    
    def validate_rates(self, data: Dict[str, Any]) -> bool:
        """Validate that required fields are present."""
        required_fields = ["24K Gold"]
        
        for field in required_fields:
            if field not in data:
                self._log(f"Missing required field: {field}", "ERROR")
                return False
            
            value = data.get(field)
            if value is None:
                self._log(f"Null value for field: {field}", "ERROR")
                return False
        
        return True
    
    def save_rates(self, data: Dict[str, Any]) -> None:
        """Save rates to files."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save with timestamp
        timestamped_file = self.output_dir / f"rates_{timestamp}.json"
        with open(timestamped_file, "w") as f:
            json.dump(data, f, indent=2)
        
        # Save as current
        current_file = self.output_dir / "current_rates.json"
        with open(current_file, "w") as f:
            json.dump(data, f, indent=2)
        
        self._log(f"Rates saved to: {current_file}")
    
    def run(self) -> bool:
        """Main execution."""
        self._log("=" * 50)
        self._log("Starting rate fetch job")
        
        try:
            data = self.fetch()
            
            if not self.validate_rates(data):
                self._log("Validation failed", "ERROR")
                return False
            
            self.save_rates(data)
            
            # Log the data
            self._log(f"Success! Data: {json.dumps(data)}")
            self._log("Job completed successfully")
            return True
            
        except Exception as e:
            self._log(f"Job failed: {e}", "ERROR")
            return False


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Fetch exchange rates from external URL"
    )
    parser.add_argument(
        "--url", "-u",
        help="External API URL",
        default=None
    )
    parser.add_argument(
        "--output-dir", "-o",
        help="Output directory for rate files",
        default="/volume1/data/rates"
    )
    parser.add_argument(
        "--log-file", "-l",
        help="Log file path",
        default="/volume1/logs/fetch-rates.log"
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    fetcher = RateFetcher(
        url=args.url,
        output_dir=args.output_dir,
        log_file=args.log_file
    )
    
    success = fetcher.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
