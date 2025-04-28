
import commune as c
import time
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description='Run a Uniswap trading bot')
    parser.add_argument('--strategy', type=str, default='price_threshold', 
                        choices=['price_threshold', 'dca', 'moving_average'],
                        help='Trading strategy to use')
    parser.add_argument('--from_token', type=str, default='UNI', 
                        help='Token to sell')
    parser.add_argument('--to_token', type=str, default='WETH', 
                        help='Token to buy')
    parser.add_argument('--amount', type=float, default=100.0, 
                        help='Amount to trade per transaction')
    parser.add_argument('--min_price', type=float, default=None, 
                        help='Minimum price to trigger sell (for price_threshold)')
    parser.add_argument('--max_price', type=float, default=None, 
                        help='Maximum price to trigger buy (for price_threshold)')
    parser.add_argument('--interval', type=int, default=60, 
                        help='Check interval in seconds')
    parser.add_argument('--duration', type=int, default=3600, 
                        help='Bot run duration in seconds (0 for infinite)')
    parser.add_argument('--wallet_key', type=str, default=None, 
                        help='Private key for transactions (BE CAREFUL!)')
    args = parser.parse_args()

    # Initialize the Uniswap module
    uniswap = c.module('uniswap')()
    
    # Set up logging
    def log_message(msg):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {msg}")
        
    log_message(f"Starting Uniswap trading bot with {args.strategy} strategy")
    
    # Configure strategy
    if args.strategy == 'price_threshold':
        if not args.min_price and not args.max_price:
            log_message("Error: Either min_price or max_price must be specified for price_threshold strategy")
            return
            
        log_message(f"Price thresholds: min={args.min_price}, max={args.max_price}")
        
    elif args.strategy == 'dca':
        log_message(f"DCA strategy: Trading {args.amount} {args.from_token} for {args.to_token} every {args.interval} seconds")
        
    elif args.strategy == 'moving_average':
        log_message(f"Moving average strategy: Using 7-day and 25-day moving averages")
    
    # Main trading loop
    start_time = time.time()
    trade_count = 0
    
    try:
        while True:
            current_time = time.time()
            elapsed = current_time - start_time
            
            # Check if duration limit reached
            if args.duration > 0 and elapsed >= args.duration:
                log_message(f"Duration limit reached ({args.duration} seconds). Stopping bot.")
                break
                
            # Get current price
            try:
                quote = uniswap.get_price_quote(
                    from_token=args.from_token,
                    to_token=args.to_token,
                    amount=1.0
                )
                current_price = float(quote.get('quote', 0))
                log_message(f"Current price: 1 {args.from_token} = {current_price} {args.to_token}")
                
                # Execute strategy logic
                if args.strategy == 'price_threshold':
                    if args.min_price and current_price >= args.min_price:
                        log_message(f"Price {current_price} >= {args.min_price}. Selling {args.amount} {args.from_token}...")
                        # In a real implementation, we would execute the swap here
                        # if args.wallet_key:
                        #     result = uniswap.swap(
                        #         from_token=args.from_token,
                        #         to_token=args.to_token,
                        #         amount=args.amount,
                        #         wallet_key=args.wallet_key
                        #     )
                        #     log_message(f"Swap executed: {result}")
                        #     trade_count += 1
                        # else:
                        log_message("Swap simulation (no wallet key provided)")
                        trade_count += 1
                        
                    elif args.max_price and current_price <= args.max_price:
                        log_message(f"Price {current_price} <= {args.max_price}. Buying {args.from_token}...")
                        # Simulate buy
                        log_message("Swap simulation (no wallet key provided)")
                        trade_count += 1
                    else:
                        log_message("No price thresholds triggered. Waiting...")
                        
                elif args.strategy == 'dca':
                    # In DCA, we trade at regular intervals regardless of price
                    log_message(f"Executing scheduled DCA trade: {args.amount} {args.from_token} to {args.to_token}")
                    # Simulate trade
                    log_message("Swap simulation (no wallet key provided)")
                    trade_count += 1
                    
                elif args.strategy == 'moving_average':
                    # Get historical prices for moving average calculation
                    historical = uniswap.get_historical_prices(args.from_token, days=30)
                    
                    if historical and not isinstance(historical, dict):
                        prices = [float(item.get('price', 0)) for item in historical]
                        
                        # Calculate moving averages
                        short_period = 7
                        long_period = 25
                        
                        if len(prices) >= long_period:
                            short_ma = sum(prices[:short_period]) / short_period
                            long_ma = sum(prices[:long_period]) / long_period
                            
                            # Previous day's moving averages
                            prev_short_ma = sum(prices[1:short_period+1]) / short_period
                            prev_long_ma = sum(prices[1:long_period+1]) / long_period
                            
                            log_message(f"Short MA: {short_ma}, Long MA: {long_ma}")
                            
                            # Check for crossover
                            current_crossover = short_ma > long_ma
                            previous_crossover = prev_short_ma > prev_long_ma
                            
                            if current_crossover and not previous_crossover:
                                log_message("Bullish crossover detected! Executing buy...")
                                # Simulate buy
                                log_message("Swap simulation (no wallet key provided)")
                                trade_count += 1
                            elif not current_crossover and previous_crossover:
                                log_message("Bearish crossover detected! Executing sell...")
                                # Simulate sell
                                log_message("Swap simulation (no wallet key provided)")
                                trade_count += 1
                            else:
                                log_message("No crossover detected. Holding position.")
                        else:
                            log_message(f"Not enough historical data. Need {long_period} days.")
                    else:
                        log_message("Failed to get historical prices")
                
            except Exception as e:
                log_message(f"Error during trading cycle: {str(e)}")
            
            # Sleep until next check
            log_message(f"Completed trading cycle. Next check in {args.interval} seconds.")
            log_message(f"Bot stats: Running for {int(elapsed)}s, Executed {trade_count} trades")
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        log_message("Bot stopped by user.")
    
    log_message(f"Bot finished. Total runtime: {int(time.time() - start_time)}s, Total trades: {trade_count}")

if __name__ == "__main__":
    main()
