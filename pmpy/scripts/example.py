
import commune as c
import time
import argparse

def main():
    """
    Example script to demonstrate PMPY functionality
    """
    parser = argparse.ArgumentParser(description='PMPY Example Script')
    parser.add_argument('--name', type=str, default='example', help='Process name')
    parser.add_argument('--interval', type=int, default=5, help='Logging interval in seconds')
    args = parser.parse_args()
    
    print(f"Starting example process: {args.name}")
    print(f"Logging every {args.interval} seconds")
    
    counter = 0
    try:
        while True:
            counter += 1
            print(f"[{args.name}] Process running - count: {counter}")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print(f"Process {args.name} terminated by user")

if __name__ == "__main__":
    main()
