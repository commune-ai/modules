
# Uniswap Module

A comprehensive module for interacting with Uniswap protocol and analyzing DeFi data. This module provides functionality for price quotes, swaps, liquidity analysis, and market insights.

## Features

- Get price quotes for token swaps
- Execute token swaps on Uniswap
- Analyze liquidity in Uniswap pools
- Get historical price data for tokens
- Get top Uniswap pools by volume or TVL
- Automated trading bot with multiple strategies:
  - Price threshold strategy
  - Dollar-cost averaging (DCA)
  - Moving average crossover

## Installation

```bash
pip install commune
```

## Usage

### Python Interface

```python
import commune as c

# Initialize the module
uniswap = c.module('uniswap')()

# Get a price quote
quote = uniswap.get_price_quote(
    from_token="UNI",
    to_token="WETH",
    amount=100
)
print(f"100 UNI = {quote['quote']} WETH")

# Get historical prices
historical = uniswap.get_historical_prices("UNI", days=30)
print(f"Historical prices for the last 30 days: {historical[:5]}")

# Get top pools
top_pools = uniswap.get_top_pools(count=5)
print(f"Top 5 Uniswap pools: {top_pools}")

# Get an explanation about Uniswap
explanation = uniswap.explain("What is impermanent loss?")
print(explanation)
```

### JavaScript Interface

```javascript
const { UniswapService, UniswapTradingBot } = require('./uniswap.js');

// Initialize the service
const uniswap = new UniswapService({
  providerUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
  chainId: 1
});

// Get a price quote
async function getQuote() {
  const quote = await uniswap.getQuote({
    fromTokenAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
    toTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    amount: "100"
  });
  
  console.log(`100 UNI = ${quote.quote} WETH`);
  console.log(`Price impact: ${quote.priceImpact}%`);
}

// Initialize a trading bot
const bot = new UniswapTradingBot({
  uniswap,
  strategyType: "priceThreshold",
  config: {
    fromToken: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
    toToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    minPrice: "0.01", // Sell if 1 UNI >= 0.01 WETH
    amountPerTrade: "100",
    privateKey: "YOUR_PRIVATE_KEY",
    intervalSeconds: 60
  }
});

// Start the bot
bot.start();

// Stop the bot after 1 hour
setTimeout(() => bot.stop(), 60 * 60 * 1000);
```

## Configuration

The module can be configured with the following parameters:

- `provider_url`: Ethereum JSON-RPC provider URL
- `chain_id`: Blockchain network ID (1=Mainnet, 5=Goerli, etc.)
- `default_slippage`: Default slippage tolerance percentage
- `use_cache`: Whether to cache API responses
- `cache_expiry`: Cache expiry time in seconds

## Trading Bot Strategies

### Price Threshold Strategy

Executes trades when the price reaches certain thresholds:
- Sells when price is above minPrice
- Buys when price is below maxPrice

### Dollar-Cost Averaging (DCA)

Executes trades at regular intervals regardless of price:
- Trades on specific days of the month
- Trades at a specific hour of the day

### Moving Average Crossover

Uses technical analysis to determine entry and exit points:
- Buys when short-term moving average crosses above long-term moving average
- Sells when short-term moving average crosses below long-term moving average

## Dependencies

- ethers.js
- @uniswap/smart-order-router
- @uniswap/sdk-core
- @uniswap/v3-sdk
- node-fetch
- commune

## License

MIT
