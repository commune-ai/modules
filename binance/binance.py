
import commune as c
import os
import time
from typing import Dict, List, Optional, Union, Any
import hmac
import hashlib
import requests
import json
from datetime import datetime

class Binance(c.Module):
    """
    A Binance API wrapper for cryptocurrency trading and data retrieval.
    """
    
    def __init__(
        self,
        api_key: str = None,
        api_secret: str = None,
        testnet: bool = False,
        **kwargs
    ):
        """
        Initialize the Binance module with API credentials.
        
        Args:
            api_key (str, optional): Binance API key
            api_secret (str, optional): Binance API secret
            testnet (bool, optional): Whether to use testnet. Defaults to False.
            **kwargs: Additional configuration parameters
        """
        self.config = self.set_config(kwargs)
        
        # Set API credentials
        self.api_key = api_key or self.config.get('api_key', os.environ.get('BINANCE_API_KEY'))
        self.api_secret = api_secret or self.config.get('api_secret', os.environ.get('BINANCE_API_SECRET'))
        self.testnet = testnet or self.config.get('testnet', False)
        
        # Set base URLs
        if self.testnet:
            self.base_url = 'https://testnet.binance.vision/api'
            self.base_wss = 'wss://testnet.binance.vision/ws'
        else:
            self.base_url = 'https://api.binance.com/api'
            self.base_wss = 'wss://stream.binance.com:9443/ws'
        
        # Initialize AI model for analysis if needed
        self.model = c.module('model.openrouter')()
        
        # Cache for market data
        self.cache = {
            'tickers': {},
            'last_update': 0,
            'symbols': [],
        }
        
        # Initialize session
        self.session = requests.Session()
        self.session.headers.update({
            'X-MBX-APIKEY': self.api_key if self.api_key else '',
            'Content-Type': 'application/json',
        })
    
    def _generate_signature(self, params: Dict) -> str:
        """
        Generate HMAC SHA256 signature for API request.
        
        Args:
            params (Dict): Request parameters
            
        Returns:
            str: Signature for the request
        """
        if not self.api_secret:
            raise ValueError("API secret is required for authenticated endpoints")
            
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _request(
        self, 
        method: str, 
        endpoint: str, 
        signed: bool = False, 
        params: Dict = None,
        version: str = 'v3'
    ) -> Dict:
        """
        Make a request to the Binance API.
        
        Args:
            method (str): HTTP method (GET, POST, DELETE, etc.)
            endpoint (str): API endpoint
            signed (bool): Whether the request needs signature
            params (Dict, optional): Request parameters
            version (str, optional): API version. Defaults to 'v3'.
            
        Returns:
            Dict: Response from the API
        """
        url = f"{self.base_url}/{version}/{endpoint}"
        params = params or {}
        
        if signed:
            params['timestamp'] = int(time.time() * 1000)
            params['signature'] = self._generate_signature(params)
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=params)
            elif method == 'DELETE':
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = f"API request failed: {str(e)}"
            if hasattr(e.response, 'text'):
                error_msg += f" - {e.response.text}"
            raise Exception(error_msg)
    
    def get_server_time(self) -> Dict:
        """
        Get Binance server time.
        
        Returns:
            Dict: Server time information
        """
        return self._request('GET', 'time')
    
    def get_exchange_info(self) -> Dict:
        """
        Get exchange trading rules and symbol information.
        
        Returns:
            Dict: Exchange information
        """
        return self._request('GET', 'exchangeInfo')
    
    def get_ticker_price(self, symbol: str = None) -> Union[Dict, List[Dict]]:
        """
        Get latest price for a symbol or all symbols.
        
        Args:
            symbol (str, optional): Trading pair symbol (e.g., 'BTCUSDT')
            
        Returns:
            Union[Dict, List[Dict]]: Price information
        """
        params = {}
        if symbol:
            params['symbol'] = symbol
        return self._request('GET', 'ticker/price', params=params)
    
    def get_ticker_24hr(self, symbol: str = None) -> Union[Dict, List[Dict]]:
        """
        Get 24hr ticker price change statistics.
        
        Args:
            symbol (str, optional): Trading pair symbol (e.g., 'BTCUSDT')
            
        Returns:
            Union[Dict, List[Dict]]: 24hr statistics
        """
        params = {}
        if symbol:
            params['symbol'] = symbol
        return self._request('GET', 'ticker/24hr', params=params)
    
    def get_klines(
        self, 
        symbol: str, 
        interval: str, 
        start_time: int = None, 
        end_time: int = None,
        limit: int = 500
    ) -> List:
        """
        Get kline/candlestick data.
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            interval (str): Kline interval (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
            start_time (int, optional): Start time in milliseconds
            end_time (int, optional): End time in milliseconds
            limit (int, optional): Number of results. Default 500, max 1000.
            
        Returns:
            List: Kline data
        """
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        
        if start_time:
            params['startTime'] = start_time
        if end_time:
            params['endTime'] = end_time
            
        return self._request('GET', 'klines', params=params)
    
    def get_account(self) -> Dict:
        """
        Get account information (requires API key and secret).
        
        Returns:
            Dict: Account information
        """
        return self._request('GET', 'account', signed=True)
    
    def get_open_orders(self, symbol: str = None) -> List:
        """
        Get all open orders (requires API key and secret).
        
        Args:
            symbol (str, optional): Trading pair symbol (e.g., 'BTCUSDT')
            
        Returns:
            List: Open orders
        """
        params = {}
        if symbol:
            params['symbol'] = symbol
        return self._request('GET', 'openOrders', signed=True, params=params)
    
    def create_order(
        self,
        symbol: str,
        side: str,
        type: str,
        quantity: float,
        price: float = None,
        time_in_force: str = 'GTC',
        **kwargs
    ) -> Dict:
        """
        Create a new order (requires API key and secret).
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            side (str): Order side (BUY or SELL)
            type (str): Order type (LIMIT, MARKET, STOP_LOSS, etc.)
            quantity (float): Order quantity
            price (float, optional): Order price, required for limit orders
            time_in_force (str, optional): Time in force for limit orders (GTC, IOC, FOK)
            **kwargs: Additional order parameters
            
        Returns:
            Dict: Order information
        """
        params = {
            'symbol': symbol,
            'side': side,
            'type': type,
            'quantity': quantity,
            **kwargs
        }
        
        if type == 'LIMIT':
            if not price:
                raise ValueError("Price is required for LIMIT orders")
            params['price'] = price
            params['timeInForce'] = time_in_force
            
        return self._request('POST', 'order', signed=True, params=params)
    
    def cancel_order(self, symbol: str, order_id: int = None, orig_client_order_id: str = None) -> Dict:
        """
        Cancel an existing order (requires API key and secret).
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            order_id (int, optional): Order ID
            orig_client_order_id (str, optional): Original client order ID
            
        Returns:
            Dict: Canceled order information
        """
        params = {'symbol': symbol}
        
        if order_id:
            params['orderId'] = order_id
        elif orig_client_order_id:
            params['origClientOrderId'] = orig_client_order_id
        else:
            raise ValueError("Either order_id or orig_client_order_id must be provided")
            
        return self._request('DELETE', 'order', signed=True, params=params)
    
    def get_order(self, symbol: str, order_id: int = None, orig_client_order_id: str = None) -> Dict:
        """
        Check an order's status (requires API key and secret).
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            order_id (int, optional): Order ID
            orig_client_order_id (str, optional): Original client order ID
            
        Returns:
            Dict: Order information
        """
        params = {'symbol': symbol}
        
        if order_id:
            params['orderId'] = order_id
        elif orig_client_order_id:
            params['origClientOrderId'] = orig_client_order_id
        else:
            raise ValueError("Either order_id or orig_client_order_id must be provided")
            
        return self._request('GET', 'order', signed=True, params=params)
    
    def get_all_orders(self, symbol: str, limit: int = 500, **kwargs) -> List:
        """
        Get all account orders (requires API key and secret).
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            limit (int, optional): Number of results. Default 500, max 1000.
            **kwargs: Additional parameters (orderId, startTime, endTime)
            
        Returns:
            List: Order information
        """
        params = {
            'symbol': symbol,
            'limit': limit,
            **kwargs
        }
        return self._request('GET', 'allOrders', signed=True, params=params)
    
    def get_trades(self, symbol: str, limit: int = 500, **kwargs) -> List:
        """
        Get trades for a specific account and symbol (requires API key and secret).
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            limit (int, optional): Number of results. Default 500, max 1000.
            **kwargs: Additional parameters (orderId, startTime, endTime)
            
        Returns:
            List: Trade information
        """
        params = {
            'symbol': symbol,
            'limit': limit,
            **kwargs
        }
        return self._request('GET', 'myTrades', signed=True, params=params)
    
    def get_deposit_history(self, **kwargs) -> List:
        """
        Get deposit history (requires API key and secret).
        
        Args:
            **kwargs: Filter parameters (asset, status, startTime, endTime)
            
        Returns:
            List: Deposit history
        """
        return self._request('GET', 'depositHistory', signed=True, params=kwargs, version='v1')
    
    def get_withdraw_history(self, **kwargs) -> List:
        """
        Get withdrawal history (requires API key and secret).
        
        Args:
            **kwargs: Filter parameters (asset, status, startTime, endTime)
            
        Returns:
            List: Withdrawal history
        """
        return self._request('GET', 'withdrawHistory', signed=True, params=kwargs, version='v1')
    
    def get_deposit_address(self, coin: str, network: str = None) -> Dict:
        """
        Get deposit address for a coin (requires API key and secret).
        
        Args:
            coin (str): Coin name (e.g., 'BTC')
            network (str, optional): Network name (e.g., 'BTC', 'BSC')
            
        Returns:
            Dict: Deposit address information
        """
        params = {'coin': coin}
        if network:
            params['network'] = network
        return self._request('GET', 'depositAddress', signed=True, params=params, version='v1')
    
    def analyze_market(self, symbol: str = 'BTCUSDT', interval: str = '1d', limit: int = 30) -> str:
        """
        Analyze market data using AI.
        
        Args:
            symbol (str, optional): Trading pair symbol. Defaults to 'BTCUSDT'.
            interval (str, optional): Kline interval. Defaults to '1d'.
            limit (int, optional): Number of candles. Defaults to 30.
            
        Returns:
            str: Market analysis
        """
        try:
            # Get market data
            klines = self.get_klines(symbol, interval, limit=limit)
            
            # Format data for analysis
            data = []
            for k in klines:
                data.append({
                    'timestamp': datetime.fromtimestamp(k[0]/1000).strftime('%Y-%m-%d %H:%M:%S'),
                    'open': float(k[1]),
                    'high': float(k[2]),
                    'low': float(k[3]),
                    'close': float(k[4]),
                    'volume': float(k[5])
                })
            
            # Get 24hr stats
            stats = self.get_ticker_24hr(symbol)
            
            # Prepare prompt for AI analysis
            prompt = f"""
            Analyze the following {symbol} market data:
            
            Last {limit} {interval} candles: {json.dumps(data[-5:])}  # Showing last 5 for brevity
            
            24hr stats:
            - Price change: {stats.get('priceChange')}
            - Price change percent: {stats.get('priceChangePercent')}%
            - Weighted average price: {stats.get('weightedAvgPrice')}
            - Last price: {stats.get('lastPrice')}
            - Volume: {stats.get('volume')}
            
            Provide a brief technical analysis including:
            1. Current market trend
            2. Key support and resistance levels
            3. Volume analysis
            4. Potential trading opportunities
            5. Risk assessment
            """
            
            # Get AI analysis
            return self.model.forward(prompt, stream=False)
        except Exception as e:
            return f"Analysis failed: {str(e)}"
    
    def forward(self, module: str = 'explain', *args, stream=True, **kwargs):
        """
        Dynamically call a method of the class or get AI explanation.
        
        Args:
            module (str): Method name or 'explain' for AI explanation
            *args: Positional arguments to pass to the method
            stream (bool): Whether to stream the response
            **kwargs: Keyword arguments to pass to the method
            
        Returns:
            Result of the called method or AI explanation
        """
        if module == 'explain':
            return self.model.forward(f"Explain the Binance API and how to use it for cryptocurrency trading: {c.code(self.__class__)}", stream=stream)
        
        if hasattr(self, module) and callable(getattr(self, module)):
            return getattr(self, module)(*args, **kwargs)
        
        return self.model.forward(f"What does this Binance API function do? {c.code('binance')}", stream=stream)

    def symbols(self):
        """
        Get all trading symbols from the exchange.
        
        Returns:
            List: List of trading symbols
        """
        if not self.cache['symbols']:
            info = self.get_exchange_info()
            self.cache['symbols'] = [s['symbol'] for s in info['symbols']]
        return self.cache['symbols']