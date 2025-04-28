
import commune as c
import asyncio
import json
from typing import Dict, List, Union, Optional, Any

class Uniswap(c.Module):
    """
    Uniswap module for interacting with Uniswap protocol and analyzing DeFi data.
    Provides functionality for price quotes, swaps, liquidity analysis, and market insights.
    """
    def __init__(self, 
                 provider_url: str = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
                 chain_id: int = 1,
                 default_slippage: float = 0.5,
                 use_cache: bool = True,
                 cache_expiry: int = 300,
                 **kwargs):
        """
        Initialize the Uniswap module with configurable parameters.
        
        Args:
            provider_url (str): Ethereum JSON-RPC provider URL
            chain_id (int): Blockchain network ID (1=Mainnet, 5=Goerli, etc.)
            default_slippage (float): Default slippage tolerance percentage
            use_cache (bool): Whether to cache API responses
            cache_expiry (int): Cache expiry time in seconds
            **kwargs: Additional configuration parameters
        """
        super().__init__(**kwargs)
        self.config = self.set_config(kwargs)
        
        # Initialize configuration
        self.provider_url = provider_url
        self.chain_id = chain_id
        self.default_slippage = default_slippage
        self.use_cache = use_cache
        self.cache_expiry = cache_expiry
        self.cache = {}
        
        # Initialize AI assistant for explanations
        self.model = c.module('openrouter')()
        
        # Token address constants
        self.token_addresses = {
            'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        }
        
        # Initialize JS bridge if available
        try:
            self.js_bridge = c.module('js_bridge')()
            self.has_js_bridge = True
        except:
            self.has_js_bridge = False
            c.print("JS bridge not available. Some features will be limited.", color='yellow')

    def get_price_quote(self, 
                       from_token: str, 
                       to_token: str, 
                       amount: float, 
                       slippage: Optional[float] = None) -> Dict[str, Any]:
        """
        Get a price quote for swapping tokens on Uniswap.
        
        Args:
            from_token (str): Symbol or address of token to swap from
            to_token (str): Symbol or address of token to swap to
            amount (float): Amount of from_token to swap
            slippage (float, optional): Slippage tolerance percentage
            
        Returns:
            Dict: Quote information including expected output, price impact, and route
        """
        if not self.has_js_bridge:
            return {"error": "JS bridge not available for price quotes"}
        
        # Resolve token addresses if symbols provided
        from_address = self._resolve_token_address(from_token)
        to_address = self._resolve_token_address(to_token)
        
        # Use default slippage if not provided
        slippage = slippage if slippage is not None else self.default_slippage
        
        try:
            # Call JS implementation for quote
            result = self.js_bridge.call_function(
                "uniswap.js", 
                "getQuote", 
                {
                    "fromTokenAddress": from_address,
                    "toTokenAddress": to_address,
                    "amount": str(amount),
                    "slippagePercent": slippage
                }
            )
            return result
        except Exception as e:
            c.print(f"Error getting price quote: {str(e)}", color='red')
            return {"error": str(e)}

    def get_historical_prices(self, 
                             token: str, 
                             vs_currency: str = "usd", 
                             days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical price data for a token.
        
        Args:
            token (str): Token symbol or address
            vs_currency (str): Currency to compare against (usd, eth, etc.)
            days (int): Number of days of historical data
            
        Returns:
            List[Dict]: Historical price data with timestamps
        """
        token_id = self._get_coingecko_id(token)
        cache_key = f"hist_{token_id}_{vs_currency}_{days}"
        
        # Return cached data if available and not expired
        if self.use_cache and cache_key in self.cache:
            cache_time, cache_data = self.cache[cache_key]
            if (c.time() - cache_time) < self.cache_expiry:
                return cache_data
        
        try:
            if self.has_js_bridge:
                # Use JS implementation
                result = self.js_bridge.call_function(
                    "uniswap.js", 
                    "getHistoricalPrices", 
                    {"token": token_id, "vsCurrency": vs_currency, "days": days}
                )
            else:
                # Fallback to direct API call
                url = f"https://api.coingecko.com/api/v3/coins/{token_id}/market_chart?vs_currency={vs_currency}&days={days}&interval=daily"
                response = c.get(url)
                data = response.json()
                
                result = []
                if "prices" in data:
                    for timestamp, price in data["prices"]:
                        result.append({
                            "timestamp": timestamp,
                            "date": c.timestamp_to_datetime(timestamp/1000).strftime("%Y-%m-%d"),
                            "price": price
                        })
            
            # Cache the result
            if self.use_cache:
                self.cache[cache_key] = (c.time(), result)
                
            return result
        except Exception as e:
            c.print(f"Error fetching historical prices: {str(e)}", color='red')
            return {"error": str(e)}

    def analyze_liquidity(self, pool_address: str) -> Dict[str, Any]:
        """
        Analyze liquidity in a Uniswap pool.
        
        Args:
            pool_address (str): Address of the Uniswap pool
            
        Returns:
            Dict: Liquidity analysis including TVL, fees, and concentration
        """
        try:
            if self.has_js_bridge:
                return self.js_bridge.call_function(
                    "uniswap.js", 
                    "analyzeLiquidity", 
                    {"poolAddress": pool_address}
                )
            else:
                return {"error": "JS bridge not available for liquidity analysis"}
        except Exception as e:
            c.print(f"Error analyzing liquidity: {str(e)}", color='red')
            return {"error": str(e)}

    def swap(self, 
            from_token: str, 
            to_token: str, 
            amount: float, 
            wallet_key: str,
            slippage: Optional[float] = None,
            deadline_minutes: int = 20) -> Dict[str, Any]:
        """
        Execute a token swap on Uniswap.
        
        Args:
            from_token (str): Symbol or address of token to swap from
            to_token (str): Symbol or address of token to swap to
            amount (float): Amount of from_token to swap
            wallet_key (str): Private key for the wallet executing the swap
            slippage (float, optional): Slippage tolerance percentage
            deadline_minutes (int): Transaction deadline in minutes
            
        Returns:
            Dict: Transaction details and confirmation
        """
        if not self.has_js_bridge:
            return {"error": "JS bridge not available for swaps"}
        
        # Resolve token addresses if symbols provided
        from_address = self._resolve_token_address(from_token)
        to_address = self._resolve_token_address(to_token)
        
        # Use default slippage if not provided
        slippage = slippage if slippage is not None else self.default_slippage
        
        try:
            # Call JS implementation for swap
            result = self.js_bridge.call_function(
                "uniswap.js", 
                "executeSwap", 
                {
                    "fromTokenAddress": from_address,
                    "toTokenAddress": to_address,
                    "amount": str(amount),
                    "privateKey": wallet_key,
                    "slippagePercent": slippage,
                    "deadlineMinutes": deadline_minutes
                }
            )
            return result
        except Exception as e:
            c.print(f"Error executing swap: {str(e)}", color='red')
            return {"error": str(e)}

    def get_top_pools(self, count: int = 10) -> List[Dict[str, Any]]:
        """
        Get top Uniswap pools by volume or TVL.
        
        Args:
            count (int): Number of pools to return
            
        Returns:
            List[Dict]: Top pools with their stats
        """
        cache_key = f"top_pools_{count}"
        
        # Return cached data if available and not expired
        if self.use_cache and cache_key in self.cache:
            cache_time, cache_data = self.cache[cache_key]
            if (c.time() - cache_time) < self.cache_expiry:
                return cache_data
                
        try:
            # Query Uniswap subgraph for top pools
            query = """
            {
              pools(first: %d, orderBy: volumeUSD, orderDirection: desc) {
                id
                token0 {
                  id
                  symbol
                }
                token1 {
                  id
                  symbol
                }
                volumeUSD
                feeTier
                liquidity
                totalValueLockedUSD
              }
            }
            """ % count
            
            url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"
            response = c.post(url, json={"query": query})
            data = response.json()
            
            result = data.get("data", {}).get("pools", [])
            
            # Cache the result
            if self.use_cache:
                self.cache[cache_key] = (c.time(), result)
                
            return result
        except Exception as e:
            c.print(f"Error fetching top pools: {str(e)}", color='red')
            return {"error": str(e)}

    def explain(self, topic: str, stream: bool = True) -> str:
        """
        Get an AI explanation about Uniswap-related topics.
        
        Args:
            topic (str): Topic to explain
            stream (bool): Whether to stream the response
            
        Returns:
            str: Explanation of the topic
        """
        prompt = f"Explain this Uniswap-related topic in detail: {topic}"
        return self.model.forward(prompt, stream=stream)

    def forward(self, module: str = 'explain', *args, stream: bool = True, **kwargs):
        """
        Dynamically call a method of the class.
        
        Args:
            module (str): Name of the method to call or code to explain
            *args: Positional arguments to pass to the method
            stream (bool): Whether to stream the response for explanations
            **kwargs: Keyword arguments to pass to the method
            
        Returns:
            Result of the called method
        """
        if module == 'explain':
            return self.model.forward(f"What does this Uniswap-related code do? {c.code(module)}", stream=stream)
        elif hasattr(self, module) and callable(getattr(self, module)):
            return getattr(self, module)(*args, **kwargs)
        else:
            return self.explain(module, stream=stream)

    def _resolve_token_address(self, token: str) -> str:
        """
        Resolve token symbol to address.
        
        Args:
            token (str): Token symbol or address
            
        Returns:
            str: Token address
        """
        if token.startswith("0x") and len(token) == 42:
            return token
        
        token = token.upper()
        if token in self.token_addresses:
            return self.token_addresses[token]
        
        raise ValueError(f"Unknown token symbol: {token}")

    def _get_coingecko_id(self, token: str) -> str:
        """
        Get CoinGecko ID for a token.
        
        Args:
            token (str): Token symbol or address
            
        Returns:
            str: CoinGecko ID
        """
        # Simple mapping for common tokens
        mapping = {
            "ETH": "ethereum",
            "WETH": "weth",
            "BTC": "bitcoin",
            "USDC": "usd-coin",
            "USDT": "tether",
            "DAI": "dai",
            "UNI": "uniswap",
        }
        
        token = token.upper()
        if token in mapping:
            return mapping[token]
            
        # For addresses, we would need to query CoinGecko API
        # This is a simplified implementation
        return token.lower()
