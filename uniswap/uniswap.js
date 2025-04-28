
const { ethers } = require("ethers");
const { AlphaRouter } = require("@uniswap/smart-order-router");
const { Token, CurrencyAmount, TradeType, Percent } = require("@uniswap/sdk-core");
const { Pool } = require("@uniswap/v3-sdk");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const fetch = require("node-fetch");

class UniswapService {
  constructor({
    providerUrl = "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    privateKey = null,
    chainId = 1,
    defaultSlippage = 0.5,
  }) {
    // Setup provider
    this.providerUrl = providerUrl;
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.chainId = chainId;
    
    // Setup wallet if private key provided
    if (privateKey && privateKey !== "YOUR_PRIVATE_KEY") {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
    
    // Initialize router
    this.router = new AlphaRouter({ chainId: this.chainId, provider: this.provider });
    
    // Config
    this.defaultSlippage = defaultSlippage;
    this.swapRouterAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"; // Uniswap V3 SwapRouter02
    this.quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter
    
    // Common token addresses
    this.tokenAddresses = {
      ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Virtual ETH address
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    };
    
    // Token decimals cache
    this.tokenDecimals = {
      [this.tokenAddresses.ETH]: 18,
      [this.tokenAddresses.WETH]: 18,
      [this.tokenAddresses.USDC]: 6,
      [this.tokenAddresses.USDT]: 6,
      [this.tokenAddresses.DAI]: 18,
      [this.tokenAddresses.UNI]: 18,
    };
    
    // Initialize rate limiting
    this.lastApiCall = 0;
    this.minApiInterval = 1000; // 1 second between API calls
  }

  // Get token decimals (with caching)
  async getTokenDecimals(tokenAddress) {
    if (this.tokenDecimals[tokenAddress]) {
      return this.tokenDecimals[tokenAddress];
    }
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function decimals() external view returns (uint8)"],
        this.provider
      );
      
      const decimals = await tokenContract.decimals();
      this.tokenDecimals[tokenAddress] = decimals;
      return decimals;
    } catch (error) {
      console.error(`Error getting decimals for ${tokenAddress}:`, error.message);
      return 18; // Default to 18 decimals
    }
  }

  // Create Token instance with proper decimals
  async createToken(tokenAddress, symbol = "") {
    const decimals = await this.getTokenDecimals(tokenAddress);
    return new Token(this.chainId, tokenAddress, decimals, symbol);
  }

  // Get quote for token swap
  async getQuote({
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippagePercent = null
  }) {
    try {
      // Use default slippage if not provided
      const slippage = slippagePercent !== null ? slippagePercent : this.defaultSlippage;
      
      // Create token instances
      const fromToken = await this.createToken(fromTokenAddress);
      const toToken = await this.createToken(toTokenAddress);
      
      // Parse amount with proper decimals
      const amountWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
      const amountIn = CurrencyAmount.fromRawAmount(fromToken, amountWei.toString());
      
      // Get route
      const route = await this.router.route(
        amountIn,
        toToken,
        TradeType.EXACT_INPUT,
        {
          slippageTolerance: new Percent(Math.floor(slippage * 100), 10000), // Convert to basis points
          deadline: Math.floor(Date.now() / 1000) + 1800, // 30 min deadline
        }
      );
      
      if (!route) {
        throw new Error("No route found");
      }
      
      // Format the result
      const result = {
        quote: route.quote.toExact(),
        quoteWei: route.quote.quotient.toString(),
        route: route.route.map(r => ({
          protocol: r.protocol,
          tokenPath: r.tokenPath.map(t => ({
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
          })),
          poolFees: r.poolFees,
        })),
        estimatedGas: route.estimatedGasUsed.toString(),
        gasPriceWei: route.gasPriceWei.toString(),
        methodParameters: route.methodParameters,
        priceImpact: route.trade.priceImpact.toFixed(4),
      };
      
      return result;
    } catch (error) {
      console.error("Error getting quote:", error.message);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  // Execute a token swap
  async executeSwap({
    fromTokenAddress,
    toTokenAddress,
    amount,
    privateKey,
    slippagePercent = null,
    deadlineMinutes = 20
  }) {
    try {
      // Use provided private key or the one from constructor
      const wallet = privateKey 
        ? new ethers.Wallet(privateKey, this.provider) 
        : this.wallet;
      
      if (!wallet) {
        throw new Error("No wallet available. Provide a private key.");
      }
      
      // Get quote first
      const quote = await this.getQuote({
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippagePercent
      });
      
      // Check if token approval is needed (skip for ETH)
      if (fromTokenAddress !== this.tokenAddresses.ETH) {
        const fromToken = await this.createToken(fromTokenAddress);
        const amountWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
        
        // Check current allowance
        const tokenContract = new ethers.Contract(
          fromTokenAddress,
          [
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
          ],
          wallet
        );
        
        const allowance = await tokenContract.allowance(wallet.address, this.swapRouterAddress);
        
        // Approve if needed
        if (allowance.lt(amountWei)) {
          console.log(`Approving ${amount} tokens for Uniswap...`);
          const approveTx = await tokenContract.approve(this.swapRouterAddress, amountWei);
          const approveReceipt = await approveTx.wait();
          console.log(`Approval confirmed: ${approveReceipt.transactionHash}`);
        }
      }
      
      // Execute the swap
      const tx = {
        data: quote.methodParameters.calldata,
        to: this.swapRouterAddress,
        value: quote.methodParameters.value,
        from: wallet.address,
        gasPrice: quote.gasPriceWei,
        gasLimit: ethers.BigNumber.from(quote.estimatedGas).mul(12).div(10), // Add 20% buffer
      };
      
      const txResponse = await wallet.sendTransaction(tx);
      const receipt = await txResponse.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        amountIn: amount,
        estimatedOut: quote.quote,
      };
    } catch (error) {
      console.error("Error executing swap:", error.message);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  // Get historical price data from CoinGecko
  async getHistoricalPrices(token = "uniswap", vsCurrency = "usd", days = 30) {
    await this._rateLimit();
    
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${token}/market_chart?vs_currency=${vsCurrency}&days=${days}&interval=daily`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.prices) {
        throw new Error("Failed to fetch historical data");
      }
      
      const historicalData = data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp).toISOString().split("T")[0],
        price,
      }));
      
      return historicalData;
    } catch (error) {
      console.error("Error fetching historical prices:", error.message);
      throw new Error(`Failed to fetch historical prices: ${error.message}`);
    }
  }

  // Analyze liquidity in a Uniswap pool
  async analyzeLiquidity(poolAddress) {
    try {
      // Get pool contract
      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        this.provider
      );
      
      // Get pool data
      const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);
      
      // Get token details
      const token0Contract = new ethers.Contract(
        token0,
        ["function symbol() view returns (string)", "function decimals() view returns (uint8)"],
        this.provider
      );
      
      const token1Contract = new ethers.Contract(
        token1,
        ["function symbol() view returns (string)", "function decimals() view returns (uint8)"],
        this.provider
      );
      
      const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
        token0Contract.symbol(),
        token0Contract.decimals(),
        token1Contract.symbol(),
        token1Contract.decimals(),
      ]);
      
      // Query the Graph for more pool data
      const poolData = await this._getPoolDataFromGraph(poolAddress);
      
      return {
        address: poolAddress,
        token0: {
          address: token0,
          symbol: token0Symbol,
          decimals: token0Decimals,
        },
        token1: {
          address: token1,
          symbol: token1Symbol,
          decimals: token1Decimals,
        },
        fee: fee / 10000, // Convert to percentage
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick,
        tvlUSD: poolData?.totalValueLockedUSD || "Unknown",
        volume24h: poolData?.volumeUSD24h || "Unknown",
        feesUSD24h: poolData?.feesUSD24h || "Unknown",
      };
    } catch (error) {
      console.error("Error analyzing liquidity:", error.message);
      throw new Error(`Failed to analyze liquidity: ${error.message}`);
    }
  }

  // Get pool data from The Graph
  async _getPoolDataFromGraph(poolAddress) {
    await this._rateLimit();
    
    try {
      const query = `{
        pool(id: "${poolAddress.toLowerCase()}") {
          totalValueLockedUSD
          volumeUSD
          feesUSD
          volumeUSD24h: volumeUSD
          feesUSD24h: feesUSD
        }
      }`;
      
      const response = await fetch(
        "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`The Graph API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data?.pool;
    } catch (error) {
      console.error("Error fetching pool data from The Graph:", error.message);
      return null;
    }
  }

  // Get top pools from Uniswap
  async getTopPools(count = 10, orderBy = "volumeUSD") {
    await this._rateLimit();
    
    try {
      const query = `{
        pools(first: ${count}, orderBy: ${orderBy}, orderDirection: desc) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          feeTier
          liquidity
          volumeUSD
          totalValueLockedUSD
          token0Price
          token1Price
        }
      }`;
      
      const response = await fetch(
        "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`The Graph API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data?.pools || [];
    } catch (error) {
      console.error("Error fetching top pools:", error.message);
      throw new Error(`Failed to fetch top pools: ${error.message}`);
    }
  }

  // Rate limiting helper
  async _rateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minApiInterval) {
      const delay = this.minApiInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }
}

// Bot for automated trading
class UniswapTradingBot {
  constructor({
    uniswap,
    strategyType = "priceThreshold",
    config = {},
    logCallback = console.log
  }) {
    this.uniswap = uniswap;
    this.strategyType = strategyType;
    this.config = config;
    this.log = logCallback;
    this.isRunning = false;
    this.interval = null;
  }

  // Start the trading bot
  start() {
    if (this.isRunning) {
      this.log("Bot is already running");
      return false;
    }
    
    this.isRunning = true;
    this.log(`Starting Uniswap trading bot with ${this.strategyType} strategy...`);
    
    // Run immediately
    this._executeStrategy();
    
    // Then set interval
    const checkIntervalSeconds = this.config.intervalSeconds || 60;
    this.interval = setInterval(() => this._executeStrategy(), checkIntervalSeconds * 1000);
    
    return true;
  }

  // Stop the trading bot
  stop() {
    if (!this.isRunning) {
      this.log("Bot is not running");
      return false;
    }
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.isRunning = false;
    this.log("Uniswap trading bot stopped");
    return true;
  }

  // Execute the selected strategy
  async _executeStrategy() {
    try {
      switch (this.strategyType) {
        case "priceThreshold":
          await this._priceThresholdStrategy();
          break;
        case "dca":
          await this._dollarCostAveragingStrategy();
          break;
        case "movingAverage":
          await this._movingAverageStrategy();
          break;
        default:
          throw new Error(`Unknown strategy type: ${this.strategyType}`);
      }
    } catch (error) {
      this.log(`Strategy execution error: ${error.message}`);
    }
  }

  // Price threshold strategy
  async _priceThresholdStrategy() {
    const { 
      fromToken, 
      toToken, 
      minPrice, 
      maxPrice, 
      amountPerTrade,
      privateKey
    } = this.config;
    
    if (!fromToken || !toToken || !amountPerTrade || !privateKey) {
      throw new Error("Missing required configuration for price threshold strategy");
    }
    
    try {
      // Get current price
      const quote = await this.uniswap.getQuote({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: "1", // Get price for 1 token
      });
      
      const currentPrice = parseFloat(quote.quote);
      this.log(`Current price: ${currentPrice} ${toToken} per ${fromToken}`);
      
      // Check if we should sell (price >= minPrice)
      if (minPrice && currentPrice >= parseFloat(minPrice)) {
        this.log(`Price ${currentPrice} >= ${minPrice}. Selling ${amountPerTrade} tokens...`);
        
        const result = await this.uniswap.executeSwap({
          fromTokenAddress: fromToken,
          toTokenAddress: toToken,
          amount: amountPerTrade.toString(),
          privateKey,
        });
        
        this.log(`Swap executed: ${result.transactionHash}`);
        return result;
      }
      
      // Check if we should buy (price <= maxPrice)
      if (maxPrice && currentPrice <= parseFloat(maxPrice)) {
        this.log(`Price ${currentPrice} <= ${maxPrice}. Buying tokens...`);
        
        const result = await this.uniswap.executeSwap({
          fromTokenAddress: toToken,
          toTokenAddress: fromToken,
          amount: amountPerTrade.toString(),
          privateKey,
        });
        
        this.log(`Swap executed: ${result.transactionHash}`);
        return result;
      }
      
      this.log("Current price doesn't meet threshold conditions. Waiting...");
      return null;
    } catch (error) {
      this.log(`Price threshold strategy error: ${error.message}`);
      throw error;
    }
  }

  // Dollar-cost averaging strategy
  async _dollarCostAveragingStrategy() {
    const { 
      fromToken, 
      toToken, 
      amountPerTrade,
      privateKey,
      tradingDays = [1, 15], // Days of month to trade
      tradingHour = 12, // Hour of day to trade (UTC)
    } = this.config;
    
    if (!fromToken || !toToken || !amountPerTrade || !privateKey) {
      throw new Error("Missing required configuration for DCA strategy");
    }
    
    // Check if we should trade today
    const now = new Date();
    const today = now.getUTCDate();
    const currentHour = now.getUTCHours();
    
    if (!tradingDays.includes(today)) {
      this.log(`Today (${today}) is not a trading day. Skipping.`);
      return null;
    }
    
    if (currentHour !== tradingHour) {
      this.log(`Current hour (${currentHour}) is not trading hour (${tradingHour}). Skipping.`);
      return null;
    }
    
    try {
      this.log(`Executing scheduled DCA trade: ${amountPerTrade} ${fromToken} to ${toToken}`);
      
      const result = await this.uniswap.executeSwap({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amountPerTrade.toString(),
        privateKey,
      });
      
      this.log(`DCA swap executed: ${result.transactionHash}`);
      return result;
    } catch (error) {
      this.log(`DCA strategy error: ${error.message}`);
      throw error;
    }
  }

  // Moving average strategy
  async _movingAverageStrategy() {
    const { 
      token,
      vsCurrency = "usd",
      shortPeriod = 7,
      longPeriod = 25,
      amountPerTrade,
      privateKey,
    } = this.config;
    
    if (!token || !amountPerTrade || !privateKey) {
      throw new Error("Missing required configuration for moving average strategy");
    }
    
    try {
      // Get historical prices
      const historicalPrices = await this.uniswap.getHistoricalPrices(token, vsCurrency, longPeriod + 1);
      
      // Calculate moving averages
      const prices = historicalPrices.map(item => item.price).reverse(); // Most recent first
      
      const shortMA = prices.slice(0, shortPeriod).reduce((sum, price) => sum + price, 0) / shortPeriod;
      const longMA = prices.slice(0, longPeriod).reduce((sum, price) => sum + price, 0) / longPeriod;
      
      this.log(`Short MA (${shortPeriod} days): ${shortMA}`);
      this.log(`Long MA (${longPeriod} days): ${longMA}`);
      
      // Trading logic: Buy when short MA crosses above long MA
      const previousShortMA = prices.slice(1, shortPeriod + 1).reduce((sum, price) => sum + price, 0) / shortPeriod;
      const previousLongMA = prices.slice(1, longPeriod + 1).reduce((sum, price) => sum + price, 0) / longPeriod;
      
      // Check for crossover
      const currentCrossover = shortMA > longMA;
      const previousCrossover = previousShortMA > previousLongMA;
      
      if (currentCrossover && !previousCrossover) {
        // Bullish crossover - buy signal
        this.log("Bullish crossover detected! Executing buy...");
        
        const result = await this.uniswap.executeSwap({
          fromTokenAddress: this.uniswap.tokenAddresses.USDC, // Assuming buying with USDC
          toTokenAddress: this.uniswap.tokenAddresses[token.toUpperCase()] || token,
          amount: amountPerTrade.toString(),
          privateKey,
        });
        
        this.log(`Buy executed: ${result.transactionHash}`);
        return result;
      } else if (!currentCrossover && previousCrossover) {
        // Bearish crossover - sell signal
        this.log("Bearish crossover detected! Executing sell...");
        
        const result = await this.uniswap.executeSwap({
          fromTokenAddress: this.uniswap.tokenAddresses[token.toUpperCase()] || token,
          toTokenAddress: this.uniswap.tokenAddresses.USDC, // Selling to USDC
          amount: amountPerTrade.toString(),
          privateKey,
        });
        
        this.log(`Sell executed: ${result.transactionHash}`);
        return result;
      }
      
      this.log("No crossover detected. Holding position.");
      return null;
    } catch (error) {
      this.log(`Moving average strategy error: ${error.message}`);
      throw error;
    }
  }
}

// Export both classes
module.exports = {
  UniswapService,
  UniswapTradingBot
};
