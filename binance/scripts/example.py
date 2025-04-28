
"""
Example script demonstrating the use of the Binance module.
"""

import commune as c
import time
import os
from datetime import datetime

def main():
    # Initialize the Binance module
    print("Initializing Binance module...")
    binance = c.module('binance')()
    
    # Check server time to verify connection
    server_time = binance.get_server_time()
    server_datetime = datetime.fromtimestamp(server_time['serverTime']/1000)
    print(f"Connected to Binance server. Server time: {server_datetime}")
    
    # Get BTC/USDT ticker information
    symbol = "BTCUSDT"
    print(f"\nGetting current {symbol} price...")
    ticker = binance.get_ticker_price(symbol=symbol)
    print(f"Current {symbol} price: {ticker['price']}")
    
    # Get 24hr statistics
    print(f"\nGetting 24hr statistics for {symbol}...")
    stats = binance.get_ticker_24hr(symbol=symbol)
    print(f"24hr price change: {stats['priceChange']} ({stats['priceChangePercent']}%)")
    print(f"24hr volume: {stats['volume']} {symbol[:3]}")
    print(f"24hr trades: {stats['count']}")
    
    # Get historical kline data
    interval = "1d"
    limit = 7
    print(f"\nGetting last {limit} {interval} candles for {symbol}...")
    klines = binance.get_klines(symbol=symbol, interval=interval, limit=limit)
    
    print(f"{'Date':<12} {'Open':<10} {'High':<10} {'Low':<10} {'Close':<10} {'Volume':<15}")
    print("-" * 70)
    for k in klines:
        date = datetime.fromtimestamp(k[0]/1000).strftime('%Y-%m-%d')
        print(f"{date:<12} {float(k[1]):<10.2f} {float(k[2]):<10.2f} {float(k[3]):<10.2f} {float(k[4]):<10.2f} {float(k[5]):<15.2f}")
    
    # Get AI analysis
    print("\nGetting AI market analysis...")
    analysis = binance.analyze_market(symbol=symbol, interval=interval, limit=30)
    print("\nMarket Analysis:")
    print("-" * 70)
    print(analysis)
    
    # If API credentials are available, demonstrate account functions
    if binance.api_key and binance.api_secret:
        print("\nAPI credentials found. Demonstrating account functions...")
        
        try:
            # Get account information
            account = binance.get_account()
            print("\nAccount Information:")
            print(f"Account status: {account['accountType']}")
            print(f"Can trade: {account['canTrade']}")
            print(f"Can withdraw: {account['canWithdraw']}")
            print(f"Can deposit: {account['canDeposit']}")
            
            # Show balances with non-zero amounts
            print("\nBalances:")
            for balance in account['balances']:
                free = float(balance['free'])
                locked = float(balance['locked'])
                if free > 0 or locked > 0:
                    print(f"{balance['asset']}: Free={free}, Locked={locked}")
            
            # Get open orders
            open_orders = binance.get_open_orders()
            print(f"\nOpen orders: {len(open_orders)}")
            for order in open_orders:
                print(f"Order ID: {order['orderId']}, Symbol: {order['symbol']}, Type: {order['type']}, Side: {order['side']}")
        
        except Exception as e:
            print(f"Error accessing account information: {str(e)}")
            print("This might be due to invalid API credentials or insufficient permissions.")
    else:
        print("\nNo API credentials found. Skipping account functions.")
        print("To use trading features, set BINANCE_API_KEY and BINANCE_API_SECRET environment variables.")
    
    print("\nExample completed successfully!")

if __name__ == "__main__":
    main()
