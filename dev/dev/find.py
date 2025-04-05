 # start of file
import commune as c
import json
import os
from typing import List, Dict, Union, Optional, Any

print = c.print
class Find:
    """
    Advanced search and relevance ranking module powered by LLMs.
    
    This module helps find the most relevant items from a list of options based on a query,
    using LLM-based semantic understanding to rank and filter options.
    """

    def __init__(self, model=None, default_provider='openrouter', default_model='anthropic/claude-3.5-sonnet'):
        """
        Initialize the Find module.
        
        Args:
            model: Pre-initialized model instance (optional)
            default_provider: Provider to use if no model is provided
            default_model: Default model to use for ranking
        """
        if model is None:
            self.model = c.module(default_provider)()
        else:
            self.model = model
        self.default_model = default_model

    def forward(self,  
              options: Union[List[str], Dict[Any, str]] = [],  
              query: str = 'most relevant', 
              n: int = 10,  
              trials: int = 3,
              min_score: int = 0,
              max_score: int = 10,
              threshold: int = 5,
              model: str = None,
              context: Optional[str] = None,
              temperature: float = 0.2,
              verbose: bool = True) -> List[str]:
        """
        Find the most relevant options based on a query.
        
        Args:
            options: List of options or dictionary of options
            query: Search query to match against options
            n: Maximum number of results to return
            trials: Number of retry attempts if an error occurs
            min_score: Minimum possible score
            max_score: Maximum possible score
            threshold: Minimum score required to include in results
            model: Model to use for ranking
            context: Additional context to help with ranking
            temperature: Temperature for generation (lower = more deterministic)
            verbose: Whether to print output during generation
            
        Returns:
            List of the most relevant options
        """
        # Handle retries for robustness
        if trials > 0:
            try:
                return self._execute_search(
                    options=options, 
                    query=query, 
                    n=n, 
                    min_score=min_score,
                    max_score=max_score,
                    threshold=threshold, 
                    context=context, 
                    model=model,
                    temperature=temperature,
                    verbose=verbose
                )
            except Exception as e:
                if verbose:
                    print(f"Error during search (attempts left: {trials-1}): {e}", color="yellow")
                if trials == 1:
                    raise e
                return self.forward(
                    options=options, 
                    query=query, 
                    n=n, 
                    trials=trials-1, 
                    threshold=threshold, 
                    context=context, 
                    model=model,
                    temperature=temperature,
                    verbose=verbose
                )
        else:
            raise ValueError("Maximum retry attempts exceeded")

    def _execute_search(self, options, query, n, min_score, max_score, threshold, context, model, temperature, verbose):
        """Internal method to execute the search with proper error handling"""
        anchors = ["<START_JSON>", "</END_JSON>"]
        
        # Convert dict to list if needed
        if isinstance(options, dict):
            idx2options = {i: option for i, option in enumerate(options.keys())}
        else:
            idx2options = {i: option for i, option in enumerate(options)}
            
        if not idx2options:
            return []
            
        # Format context if provided
        context_str = f"\nCONTEXT:\n{context}" if context else ""
        
        # Build the prompt
        prompt = f'''
        --QUERY--
        {query}
        {context_str}
        
        --OPTIONS--
        {idx2options} 
        
        --RULES--
        - Evaluate each option based on its relevance to the query
        - Return at most {n} options with their scores
        - Score range: {min_score} (lowest) to {max_score} (highest)
        - Only include options with scores >= {threshold}
        - Be conservative with scoring to prioritize quality over quantity
        - Respond ONLY with the JSON format specified below
        
        --OUTPUT_FORMAT--
        {anchors[0]}(data:(idx:INT, score:INT)]){anchors[1]}
        
        --OUTPUT--
        '''
        
        # Generate the response
        output = ''
        model_to_use = model or self.default_model
        
        for ch in self.model.generate(
            prompt, 
            model=model_to_use, 
            stream=True,
            temperature=temperature
        ): 
            if verbose:
                print(ch, end='')
            output += ch
            if anchors[1] in output:
                break
                
        # Extract and parse the JSON
        try:
            if anchors[0] in output:
                json_str = output.split(anchors[0])[1].split(anchors[1])[0]
            else:
                json_str = output
                
            if verbose:
                print("\nParsing response...", color="cyan")
                
            result = json.loads(json_str)
            
            # Validate the response structure
            if not isinstance(result, dict) or "data" not in result:
                if verbose:
                    print("Invalid response format, missing 'data' field", color="red")
                result = {"data": []}
                
            # Filter and convert to final output format
            filtered_options = []
            for item in result["data"]:
                if isinstance(item, dict) and "idx" in item and "score" in item:
                    idx, score = item["idx"], item["score"]
                    if score >= threshold and idx in idx2options:
                        filtered_options.append(idx2options[idx])
                        
            if verbose:
                print(f"Found {len(filtered_options)} relevant options", color="green")
                
            return filtered_options
            
        except json.JSONDecodeError as e:
            if verbose:
                print(f"JSON parsing error: {e}", color="red")
                print(f"Raw output: {output}", color="red")
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")

    def files(self,
              query: str = 'the most relevant files',
              *extra_query,
              path: str = './',  
              n: int = 30,
              **kwargs) -> List[str]:
        """
        Find the most relevant files in a directory based on a query.
        
        Args:
            query: Search query
            *extra_query: Additional query terms
            path: Directory path to search
            n: Maximum number of results
            **kwargs: Additional arguments for forward()
            
        Returns:
            List of relevant file paths
        """
        if len(extra_query) > 0:
            query = ' '.join([query, *extra_query])
        options = self.forward(options=c.files(path), query=query, n=n, **kwargs)
        return options

    def text(self, 
             query: str = 'the most relevant text files', 
             path: str = './', 
             n: int = 30,
             **kwargs) -> List[str]:
        """
        Find the most relevant text files in a directory based on a query.
        
        Args:
            query: Search query
            path: Directory path to search
            n: Maximum number of results
            **kwargs: Additional arguments for forward()
            
        Returns:
            List of relevant text file paths
        """
        options = self.forward(options=c.text_files(path), query=query, n=n, **kwargs)
        return options

    def modules(self, 
                query: str = 'relevant modules', 
                **kwargs) -> List[str]:
        """
        Find the most relevant modules based on a query.
        
        Args:
            query: Search query
            **kwargs: Additional arguments for forward()
            
        Returns:
            List of relevant module names
        """
        return self.forward(options=c.get_modules(), query=query, **kwargs)

    def utils(self, 
              query: str = 'utility functions', 
              **kwargs) -> List[str]:
        """
        Find the most relevant utility functions based on a query.
        
        Args:
            query: Search query
            **kwargs: Additional arguments for forward()
            
        Returns:
            List of relevant utility function names
        """
        return self.forward(query=query, options=c.get_utils(), **kwargs)
    
    def search(self, 
               query: str = 'how can I stake on chain', 
               **kwargs) -> List[str]:
        """
        Search for relevant module functions based on a query.
        
        Args:
            query: Search query describing what you want to do
            **kwargs: Additional arguments for forward()
            
        Returns:
            List of relevant module/function paths
        """
        module2schema = c.module2schema()
        options = []
        for module, schema in module2schema.items():
            for fn in schema.keys():
                options.append(f"{module}/{fn}")
                
        return self.forward(query=query, options=options, **kwargs)
