
import commune as c
import argparse
import json

def main():
    """
    Script to run a server using PMPY
    """
    parser = argparse.ArgumentParser(description='Run a server with PMPY')
    parser.add_argument('--module', type=str, required=True, help='Module to serve')
    parser.add_argument('--port', type=int, help='Port to run server on')
    parser.add_argument('--name', type=str, help='Server name')
    parser.add_argument('--functions', type=str, help='Comma-separated list of functions to expose')
    args = parser.parse_args()
    
    # Parse functions if provided
    functions = None
    if args.functions:
        functions = args.functions.split(',')
    
    # Get the module name if not provided
    name = args.name or args.module
    
    # Initialize the server
    server = c.module('server')()
    
    # Start the server
    server_info = server.serve(
        module=args.module,
        name=name,
        port=args.port,
        functions=functions,
        remote=False,  # Run directly, not through PM2
        run_api=True   # Run as API server
    )
    
    print(f"Server started: {json.dumps(server_info, indent=2)}")

if __name__ == "__main__":
    main()
