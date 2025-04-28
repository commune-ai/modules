
# Binance Module for Commune

A comprehensive Binance API wrapper for cryptocurrency trading and data retrieval within the Commune framework.

## Features

- Complete Binance API integration
- Real-time market data retrieval
- Trading functionality (orders, account management)
- Deposit and withdrawal management
- AI-powered market analysis

## Installation

```bash
# Clone the commune repository if you haven't already
git clone https://github.com/commune-ai/commune.git
cd commune

# Install dependencies
pip install -r requirements.txt

# Install additional dependencies for this module
pip install requests
```

## Configuration

Set your Binance API credentials using one of these methods:

1. Environment variables:
```bash
export BINANCE_API_KEY="your_api_key"
export BINANCE_API_SECRET="your_api_secret"
```

2. Direct initialization:
```python
import commune as c
binance = c.module('binance')(api_key="your_api_key", api_secret="your_api_secret")
```

3. Configuration file:
Create a config file at `commune/modules/binance/config.yaml`:
```yaml
api_key: your_api_key
api_secret: your_api_secret
testnet: false  # Set to true for testing
```

## Usage Examples

### Initialize the module

```python
import commune as c
binance = c.module('binance')()
```

### Get market data

```python
# Get current BTC/USDT price
btc_price = binance.get_ticker_price(symbol="BTCUSDT")
print(f"Current BTC price: {btc_price['price']}")

# Get historical candlestick data
btc_candles = binance.get_klines(symbol="BTCUSDT", interval="1d", limit=30)
```

### Trading operations

```python
# Get account information
account = binance.get_account()
print(f"Available balances: {account['balances']}")

# Place a limit order
order = binance.create_order(
    symbol="BTCUSDT",
    side="BUY",
    type="LIMIT",
    quantity=0.001,
    price=20000,
    timeInForce="GTC"
)

# Check open orders
open_orders = binance.get_open_orders(symbol="BTCUSDT")

# Cancel an order
cancel_result = binance.cancel_order(symbol="BTCUSDT", order_id=order['orderId'])
```

### AI-powered market analysis

```python
# Get AI analysis of BTC market
analysis = binance.analyze_market(symbol="BTCUSDT", interval="1d", limit=30)
print(analysis)
```

## API Reference

See the docstrings in the code for detailed information about each method.

## Security Notes

- Never commit your API keys to version control
- Use testnet for development and testing
- Set appropriate API key permissions in your Binance account

## License

This module is part of the Commune framework and follows its licensing.
