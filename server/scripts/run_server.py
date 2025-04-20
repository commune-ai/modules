
#!/usr/bin/env python3
"""
Script to run a Commune server with specified parameters.
"""

import argparse
import commune as c

def main():
    parser = argparse.ArgumentParser(description="Run a Commune server")
    
    # Basic server configuration
    parser.add_argument("--module", type=str, default="module", 
                        help="Module to serve")
    parser.add_argument("--name", type=str, default=None, 
                        help="Server name (defaults to module name)")
    parser.add_argument("--port", type=int, default=None, 
                        help="Port to run the server on")
    parser.add_argument("--key", type=str, default=None, 
                        help="Key to use for authentication")
    
    # Network configuration
    parser.add_argument("--network", type=str, default="local", 
                        help="Network to run on")
    parser.add_argument("--remote", action="store_true", 
                        help="Run server in remote mode")
    
    # Security and performance
    parser.add_argument("--max-requests", type=int, default=1000, 
                        help="Maximum requests per minute")
    parser.add_argument("--max-bytes", type=int, default=1000000, 
                        help="Maximum request size in bytes")
    parser.add_argument("--timeout", type=int, default=10, 
                        help="Request timeout in seconds")
    
    # Transaction tracking
    parser.add_argument("--tx-retention", type=int, default=30, 
                        help="Transaction retention period in days")
    
    # Misc
    parser.add_argument("--verbose", action="store_true", 
                        help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Create server instance
    server = c.module('server')(
        verbose=args.verbose,
        timeout=args.timeout,
        network=args.network
    )
    
    # Configure middleware
    middleware_params = {
        'max_bytes': args.max_bytes,
        'max_requests': args.max_requests
    }
    
    # Configure transaction collector
    tx_collector_params = {
        'retention_days': args.tx_retention
    }
    
    # Start server
    server.serve(
        module=args.module,
        name=args.name,
        port=args.port,
        key=args.key,
        remote=args.remote,
        middleware_params=middleware_params,
        tx_collector_params=tx_collector_params
    )

if __name__ == "__main__":
    main()
