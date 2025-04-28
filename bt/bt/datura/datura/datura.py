import requests
from typing import List, Optional

class DaturaClient:
    BASE_URL = "https://apis.datura.ai"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"Authorization": self.api_key}
    
    def basic_web_search(self, query: str, num: int = 10, start: int = 0) -> dict:
        """
        Perform a basic web search.
        """
        params = {
            "query": query,
            "num": num,
            "start": start
        }
        response = requests.get(f"{self.BASE_URL}/web", headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def desearch_ai_search(
        self,
        prompt: List[str],
        tools: List[str],
        model: str = "NOVA",
        response_order: str = "LINKS_FIRST",
        date_filter: str = "PAST_24_HOURS",
        streaming: bool = False
    ) -> dict:
        """
        Perform an AI-powered search across multiple sources.
        """
        payload = {
            "searchType": "aisearch",
            "prompt": prompt,
            "tools": tools,
            "model": model,
            "response_order": response_order,
            "date_filter": date_filter,
            "streaming": streaming
        }
        response = requests.post(f"{self.BASE_URL}/desearch/ai-search", headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def desearch_link_search(
        self,
        prompt: List[str],
        tools: List[str],
        model: str = "NOVA",
        response_order: str = "LINKS_FIRST",
        date_filter: str = "PAST_24_HOURS",
        streaming: bool = False
    ) -> dict:
        """
        Perform a link-focused search across multiple sources.
        """
        payload = {
            "searchType": "linksearch",
            "prompt": prompt,
            "tools": tools,
            "model": model,
            "response_order": response_order,
            "date_filter": date_filter,
            "streaming": streaming
        }
        response = requests.post(f"{self.BASE_URL}/desearch/link-search", headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def desearch_twitter_search(
        self,
        prompt: List[str],
        tools: List[str],
        model: str = "NOVA",
        response_order: str = "LINKS_FIRST",
        date_filter: str = "PAST_24_HOURS",
        streaming: bool = False
    ) -> dict:
        """
        Perform a Twitter-focused search.
        """
        payload = {
            "searchType": "twittersearch",
            "prompt": prompt,
            "tools": tools,
            "model": model,
            "response_order": response_order,
            "date_filter": date_filter,
            "streaming": streaming
        }
        response = requests.post(f"{self.BASE_URL}/desearch/twitter-search", headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
