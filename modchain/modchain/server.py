import commune as c 
import os
class Mod:
    """
    A base class that provides fundamental functionality for commune modules.
    """
    def __init__(self, **kwargs):
        """
        Initialize the base class with configurable parameters.
        Args:
            **kwargs: Arbitrary keyword arguments to configure the instance
        """
        # Store configuration as a Munch object for dot notation access
        self.model = c.mod('openrouter')()
        self.my_dir = os.path.dirname(__file__)
        self.my_module = os.path.basename(self.my_dir)
        
    def forward(self,query = "what does this do", *extra_query , module: str=None, stream=1,  **kwargs):
        """
        Dynamically call a method of the class.
        Args:
            fn_name (str): Name of the method to call
            *args: Positional arguments to pass to the method
            **kwargs: Keyword arguments to pass to the method
        Returns:
            Result of the called method
        """
        query = query + ' ' + ' '.join(extra_query)
        module = module or self.my_module
        return self.model.forward(f'{query}  {c.code_map(module)}', stream=stream)