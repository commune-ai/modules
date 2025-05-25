#!/usr/bin/env python3
"""
Script to run the API server
"""

import os
import sys
import argparse

# Add parent directory to path so we can import the app package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.api import run_server

def parse_args():
    parser = argparse.ArgumentParser(description="Run the API server")
    parser.add_argument("--host", default="localhost", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run_server(host=args.host, port=args.port)
