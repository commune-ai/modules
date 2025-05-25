#!/usr/bin/env python3
"""
Script to run the application
"""

import os
import sys

# Add parent directory to path so we can import the app package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import main

if __name__ == "__main__":
    sys.exit(main())
