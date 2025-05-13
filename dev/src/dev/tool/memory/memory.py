
import commune as c
import os
import json
import time
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

class Memory:
    """
    A memory management tool that provides both short-term and long-term memory capabilities.
    
    This tool helps maintain context across interactions by:
    - Storing temporary information in short-term memory (in-memory)
    - Persisting important information in long-term memory (file-based)
    - Retrieving and filtering memories based on relevance
    - Managing memory expiration and prioritization
    """
    
    def __init__(
        self,
        long_term_path: str = "~/.commune/memory/long_term",
        short_term_capacity: int = 100,
        default_ttl: int = 3600,  # 1 hour default TTL for short-term memory
        model: str = 'dev.model.openrouter',
        **kwargs
    ):
        """
        Initialize the Memory module.
        
        Args:
            long_term_path: Path to store long-term memories
            short_term_capacity: Maximum number of items in short-term memory
            default_ttl: Default time-to-live for short-term memories (in seconds)
            model: Model to use for relevance scoring
            **kwargs: Additional arguments to pass to the model
        """
        self.model = c.module(model)(**kwargs)
        self.long_term_path = os.path.expanduser(long_term_path)
        self.short_term_capacity = short_term_capacity
        self.default_ttl = default_ttl
        
        # Initialize memory stores
        self.short_term = {}  # {key: {'data': Any, 'timestamp': float, 'ttl': int}}
        
        # Ensure long-term storage directory exists
        os.makedirs(self.long_term_path, exist_ok=True)
        
    def add_short_term(
        self, 
        key: str, 
        data: Any, 
        ttl: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Add an item to short-term memory.
        
        Args:
            key: Unique identifier for the memory
            data: Data to store
            ttl: Time-to-live in seconds (None for default)
            
        Returns:
            Dictionary with status and info about the stored memory
        """
        # Clean expired items first
        self._clean_expired_short_term()
        
        # Check capacity
        if len(self.short_term) >= self.short_term_capacity:
            self._evict_short_term()
            
        # Store with timestamp
        self.short_term[key] = {
            'data': data,
            'timestamp': time.time(),
            'ttl': ttl if ttl is not None else self.default_ttl
        }
        
        return {
            'status': 'success',
            'key': key,
            'ttl': ttl if ttl is not None else self.default_ttl,
            'expires_at': time.time() + (ttl if ttl is not None else self.default_ttl)
        }
    
    def get_short_term(self, key: str) -> Optional[Any]:
        """
        Retrieve an item from short-term memory.
        
        Args:
            key: Key of the memory to retrieve
            
        Returns:
            The stored data or None if not found or expired
        """
        # Clean expired items first
        self._clean_expired_short_term()
        
        if key in self.short_term:
            # Update access timestamp (keeps frequently accessed items alive)
            self.short_term[key]['timestamp'] = time.time()
            return self.short_term[key]['data']
        
        return None
    
    def add_long_term(self, key: str, data: Any) -> Dict[str, Any]:
        """
        Add an item to long-term memory.
        
        Args:
            key: Unique identifier for the memory
            data: Data to store
            
        Returns:
            Dictionary with status and info about the stored memory
        """
        # Sanitize key for filename
        safe_key = self._sanitize_key(key)
        file_path = os.path.join(self.long_term_path, f"{safe_key}.json")
        
        memory_data = {
            'data': data,
            'timestamp': time.time(),
            'metadata': {
                'created_at': time.time(),
                'key': key,
                'type': type(data).__name__
            }
        }
        
        try:
            with open(file_path, 'w') as f:
                json.dump(memory_data, f, indent=2)
                
            return {
                'status': 'success',
                'key': key,
                'path': file_path
            }
        except Exception as e:
            return {
                'status': 'error',
                'key': key,
                'error': str(e)
            }
    
    def get_long_term(self, key: str) -> Optional[Any]:
        """
        Retrieve an item from long-term memory.
        
        Args:
            key: Key of the memory to retrieve
            
        Returns:
            The stored data or None if not found
        """
        safe_key = self._sanitize_key(key)
        file_path = os.path.join(self.long_term_path, f"{safe_key}.json")
        
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    memory_data = json.load(f)
                return memory_data['data']
            except Exception:
                return None
        
        return None
    
    def list_memories(
        self, 
        memory_type: str = 'all'
    ) -> Dict[str, List[str]]:
        """
        List available memories.
        
        Args:
            memory_type: Type of memories to list ('short', 'long', or 'all')
            
        Returns:
            Dictionary with lists of memory keys
        """
        result = {'short_term': [], 'long_term': []}
        
        # Clean expired items first
        self._clean_expired_short_term()
        
        if memory_type in ['short', 'all']:
            result['short_term'] = list(self.short_term.keys())
            
        if memory_type in ['long', 'all']:
            try:
                files = os.listdir(self.long_term_path)
                result['long_term'] = [
                    os.path.splitext(f)[0] for f in files 
                    if f.endswith('.json')
                ]
            except Exception:
                result['long_term'] = []
                
        return result
    
    def delete_memory(
        self, 
        key: str, 
        memory_type: str = 'all'
    ) -> Dict[str, Any]:
        """
        Delete a memory.
        
        Args:
            key: Key of the memory to delete
            memory_type: Type of memory to delete ('short', 'long', or 'all')
            
        Returns:
            Dictionary with deletion status
        """
        result = {'status': 'success', 'deleted': []}
        
        if memory_type in ['short', 'all']:
            if key in self.short_term:
                del self.short_term[key]
                result['deleted'].append('short_term')
                
        if memory_type in ['long', 'all']:
            safe_key = self._sanitize_key(key)
            file_path = os.path.join(self.long_term_path, f"{safe_key}.json")
            
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    result['deleted'].append('long_term')
                except Exception as e:
                    result['status'] = 'partial'
                    result['error'] = str(e)
        
        if not result['deleted']:
            result['status'] = 'not_found'
            
        return result
    
    def forward(
        self, 
        data: Union[List[str], Dict[str, Any], str],
        query: str = None,
        n: int = 5,
        memory_type: str = 'short',
        store: bool = True,
        key: str = None,
        **kwargs
    ) -> Union[List[str], Dict[str, Any], str]:
        """
        Process data through memory, optionally storing it and retrieving
        relevant items based on a query.
        
        Args:
            data: Data to process (can be a list, dict, or string)
            query: Optional query to filter/retrieve relevant memories
            n: Number of items to return when filtering
            memory_type: Where to store/retrieve from ('short' or 'long')
            store: Whether to store the data in memory
            key: Optional key for storing (generated if not provided)
            **kwargs: Additional arguments for the model
            
        Returns:
            Processed data, potentially filtered by relevance to query
        """
        # Generate a key if not provided
        if store and key is None:
            if isinstance(data, str):
                key = f"mem_{hash(data) & 0xffffffff}"
            else:
                key = f"mem_{int(time.time())}_{hash(str(data)) & 0xffffffff}"
        
        # Store the data if requested
        if store:
            if memory_type == 'short':
                self.add_short_term(key, data)
            else:
                self.add_long_term(key, data)
        
        # If there's a query, filter the data by relevance
        if query and isinstance(data, list):
            return self._filter_by_relevance(data, query, n, **kwargs)
        
        return data
    
    def _filter_by_relevance(
        self, 
        items: List[Any], 
        query: str, 
        n: int = 5,
        **kwargs
    ) -> List[Any]:
        """
        Filter a list of items by relevance to a query.
        
        Args:
            items: List of items to filter
            query: Query to compare against
            n: Maximum number of items to return
            **kwargs: Additional arguments for the model
            
        Returns:
            List of most relevant items
        """
        if not items:
            return []
        
        # For simple string items, we can use the model to score relevance
        if all(isinstance(item, str) for item in items):
            # Prepare the prompt for relevance scoring
            prompt = str({
                "task": "Rank these items by relevance to the query and return the top N most relevant items.",
                "query": query,
                "items": items,
                "n": n,
                "format": "Return a JSON array of the most relevant items in order of relevance."
            })
            
            try:
                # Get relevance scores from model
                result = self.model.forward(prompt, **kwargs)
                
                # Parse the result - expecting a JSON array
                import re
                json_match = re.search(r'\[.*\]', result, re.DOTALL)
                if json_match:
                    try:
                        relevant_items = json.loads(json_match.group(0))
                        # Ensure we only return items that were in the original list
                        return [item for item in relevant_items if item in items][:n]
                    except json.JSONDecodeError:
                        pass
            except Exception as e:
                c.print(f"Error in relevance filtering: {e}", color="red")
        
        # Fallback: return first n items
        return items[:n]
    
    def _clean_expired_short_term(self) -> int:
        """
        Remove expired items from short-term memory.
        
        Returns:
            Number of items removed
        """
        now = time.time()
        expired_keys = [
            key for key, value in self.short_term.items()
            if now > value['timestamp'] + value['ttl']
        ]
        
        for key in expired_keys:
            del self.short_term[key]
            
        return len(expired_keys)
    
    def _evict_short_term(self) -> None:
        """
        Evict items from short-term memory when capacity is reached.
        Uses LRU (Least Recently Used) strategy.
        """
        if not self.short_term:
            return
            
        # Find oldest item by timestamp
        oldest_key = min(
            self.short_term.keys(),
            key=lambda k: self.short_term[k]['timestamp']
        )
        
        # Remove it
        del self.short_term[oldest_key]
    
    def _sanitize_key(self, key: str) -> str:
        """
        Sanitize a key for use as a filename.
        
        Args:
            key: Key to sanitize
            
        Returns:
            Sanitized key
        """
        # Replace invalid filename characters
        import re
        return re.sub(r'[^\w\-\.]', '_', str(key))
    
    def search_long_term(
        self, 
        query: str, 
        n: int = 5,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search long-term memory for relevant items.
        
        Args:
            query: Search query
            n: Maximum number of items to return
            **kwargs: Additional arguments for the model
            
        Returns:
            List of relevant memory items with metadata
        """
        # Get all long-term memories
        memories = []
        try:
            files = os.listdir(self.long_term_path)
            for filename in files:
                if filename.endswith('.json'):
                    file_path = os.path.join(self.long_term_path, filename)
                    try:
                        with open(file_path, 'r') as f:
                            memory_data = json.load(f)
                            memories.append({
                                'key': os.path.splitext(filename)[0],
                                'data': memory_data['data'],
                                'timestamp': memory_data['timestamp'],
                                'metadata': memory_data.get('metadata', {})
                            })
                    except Exception:
                        continue
        except Exception as e:
            c.print(f"Error searching long-term memory: {e}", color="red")
            return []
        
        if not memories:
            return []
            
        # Use the model to rank memories by relevance
        memory_texts = [
            f"Memory {i}: {str(mem['data'])[:500]}" 
            for i, mem in enumerate(memories)
        ]
        
        prompt = str({
            "task": "Rank these memory items by relevance to the query and return the indices of the top N most relevant items in order.",
            "query": query,
            "memory_items": memory_texts,
            "n": n,
            "format": "Return a JSON array of indices, e.g. [2, 5, 0]"
        })
        
        try:
            result = self.model.forward(prompt, **kwargs)
            
            # Parse the result - expecting a JSON array of indices
            import re
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                try:
                    indices = json.loads(json_match.group(0))
                    # Return the memories in order of relevance
                    return [memories[i] for i in indices if i < len(memories)]
                except (json.JSONDecodeError, TypeError, IndexError):
                    pass
        except Exception as e:
            c.print(f"Error in relevance ranking: {e}", color="red")
        
        # Fallback: return most recent memories
        memories.sort(key=lambda x: x['timestamp'], reverse=True)
        return memories[:n]
    
    def summarize_memories(
        self, 
        query: Optional[str] = None, 
        memory_type: str = 'all',
        **kwargs
    ) -> str:
        """
        Generate a summary of relevant memories.
        
        Args:
            query: Optional query to filter relevant memories
            memory_type: Type of memories to summarize ('short', 'long', or 'all')
            **kwargs: Additional arguments for the model
            
        Returns:
            Summary text
        """
        memories = []
        
        # Collect short-term memories if requested
        if memory_type in ['short', 'all']:
            self._clean_expired_short_term()
            for key, value in self.short_term.items():
                memories.append({
                    'key': key,
                    'data': value['data'],
                    'source': 'short_term',
                    'timestamp': value['timestamp']
                })
        
        # Collect long-term memories if requested
        if memory_type in ['long', 'all']:
            long_term_memories = self.search_long_term(
                query if query else "recent important information", 
                n=10,
                **kwargs
            )
            for mem in long_term_memories:
                memories.append({
                    'key': mem['key'],
                    'data': mem['data'],
                    'source': 'long_term',
                    'timestamp': mem['timestamp']
                })
        
        if not memories:
            return "No memories available."
        
        # Sort by timestamp (newest first)
        memories.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Filter by relevance if query provided
        if query:
            memory_texts = [
                f"Memory {i} ({mem['source']}): {str(mem['data'])[:500]}" 
                for i, mem in enumerate(memories)
            ]
            
            prompt = str({
                "task": "Filter these memory items by relevance to the query and return the indices of relevant items.",
                "query": query,
                "memory_items": memory_texts,
                "format": "Return a JSON array of indices, e.g. [2, 5, 0]"
            })
            
            try:
                result = self.model.forward(prompt, **kwargs)
                
                # Parse the result
                import re
                json_match = re.search(r'\[.*\]', result, re.DOTALL)
                if json_match:
                    try:
                        indices = json.loads(json_match.group(0))
                        memories = [memories[i] for i in indices if i < len(memories)]
                    except (json.JSONDecodeError, TypeError, IndexError):
                        pass
            except Exception:
                pass
        
        # Generate summary
        memory_texts = [
            f"Memory {i+1} ({mem['source']}): {str(mem['data'])}" 
            for i, mem in enumerate(memories)
        ]
        
        prompt = str({
            "task": "Summarize these memory items into a coherent summary.",
            "memory_items": memory_texts,
            "query": query if query else "Summarize recent important information",
            "format": "Return a concise summary that captures the key information."
        })
        
        try:
            summary = self.model.forward(prompt, **kwargs)
            return summary
        except Exception as e:
            return f"Error generating summary: {e}"
