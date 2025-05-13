
import commune as c
import json
import os
from typing import List, Dict, Union, Optional, Any

print = c.print
class SelectFiles:
    """
    Advanced search and relevance ranking module powered by LLMs.
    
    This module helps find the most relevant items from a list of options based on a query,
    using LLM-based semantic understanding to rank and filter options.
    """

    def __init__(self, provider='dev.model.openrouter'):
        """
        Initialize the Find module.
        
        Args:
            model: Pre-initialized model instance (optional)
            default_provider: Provider to use if no model is provided
            default_model: Default model to use for ranking
        """
        self.model = c.module(provider)()

    def forward(self,  
              query: str = 'most relevant', 
              path: Union[List[str], Dict[Any, str]] = './',  
              n: int = 10,  
              trials: int = 3,
              min_score: int = 0,
              max_score: int = 10,
              threshold: int = 5,
              model: str = None,
              context: Optional[str] = None,
              temperature: float = 0.5,
              allow_selection: bool = False,
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
            allow_selection: Whether to allow user to select files by index
            verbose: Whether to print output during generation
            
        Returns:
            List of the most relevant options
        """
        

        anchors = ["<START_JSON>", "</END_JSON>"]
        options = self.files(path)
        home_path = os.path.expanduser("~")
        idx2options = {i: option.replace(home_path, '~') for i, option in enumerate(options)}
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
        '''
        
        # Generate the response
        output = ''

        response = self.model.forward( 
            prompt, 
            model=model, 
            stream=True,
            temperature=temperature
        )
        for ch in response: 
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
                        filtered_options.append((idx, idx2options[idx]))         
            if verbose:
                print(f"Found {filtered_options} relevant options", color="green")
            # Allow user to select files by index if requested
            if allow_selection and filtered_options:
                selected_options = self.select_by_index(filtered_options, verbose)
                return [option[1] for option in selected_options]
            return [os.path.expanduser(option[1]) for option in filtered_options]
            
        except json.JSONDecodeError as e:
            if verbose:
                print(f"JSON parsing error: {e}", color="red")
                print(f"Raw output: {output}", color="red")
            if trials > 0:
                print(f"Retrying... ({trials} attempts left)", color="yellow")
                return self.forward(options, query, n, trials - 1, min_score, max_score, threshold, model, context, temperature, allow_selection, verbose)
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")
    
    def select_by_index(self, options, verbose=True):
        """
        Allow user to select files by index from a list of options.
        
        Args:
            options: List of tuples containing (idx, option)
            verbose: Whether to print output during selection
            
        Returns:
            List of selected options
        """
        if verbose:
            print("\nSelect files by index (comma-separated, e.g. '0,2,3')", color="yellow")
            print("Press Enter to accept all files, or Ctrl+C to cancel", color="yellow")
            
        # Display options with indices
        for i, (idx, option) in enumerate(options):
            print(f"[{i}] {option}", color="cyan")
        
        try:
            # Get user input
            selection = input("\nEnter indices of files to select: ")
            
            # If empty, select all
            if not selection.strip():
                if verbose:
                    print("Selecting all files", color="green")
                return options
            
            # Parse selection
            selected_indices = [int(idx.strip()) for idx in selection.split(',') if idx.strip().isdigit()]
            selected_options = [options[idx] for idx in selected_indices if 0 <= idx < len(options)]
            
            if verbose:
                print(f"Selected {len(selected_options)} files", color="green")
            
            return selected_options
            
        except (KeyboardInterrupt, EOFError):
            # Handle keyboard interrupt (Ctrl+C) or EOF
            if verbose:
                print("\nSelection cancelled, defaulting to all files", color="yellow")
            return options
        except Exception as e:
            # Handle any other errors
            if verbose:
                print(f"\nError during selection: {e}", color="red")
                print("Defaulting to all files", color="yellow")
            return options

    def files(self, path: str) -> List[str]:
        return c.files(path)