import commune as c
import json
import os
from typing import List, Dict, Union, Optional, Any

print = c.print

class Tool:

    def forward(self,  
              path: str = './',
              content: str = 'hey',
              start_anchor: str = 'blah blah',
              end_anchor: str = 'is up',
              trials: int = 4,
              **kwargs) -> str:
        """
        Insert content into a file between start and end anchors
        """
        path = os.path.abspath(path)
        
        # Read the file content
        text = c.text(path)
        
        # Check if start anchor exists
        if start_anchor not in text:
            raise ValueError(f"Start anchor '{start_anchor}' not found in text")

        # assert when there are more than one instance of the start anchor and end anchor
        assert text.count(start_anchor) == 1, f"Multiple instances of start anchor '{start_anchor}' found"
        assert text.count(end_anchor) == 1, f"Multiple instances of end anchor '{end_anchor}' found"
        
        # Check if end anchor exists
        if end_anchor not in text:
            raise ValueError(f"End anchor '{end_anchor}' not found in text")
        
        # Find the position of anchors
        start_pos = text.find(start_anchor)
        end_pos = text.find(end_anchor)
        
        # Make sure end anchor comes after start anchor
        if end_pos <= start_pos:
            raise ValueError("End anchor must come after start anchor")
        
        # Extract parts of the text
        before_start = text[:start_pos]
        after_end = text[end_pos + len(end_anchor):]
        
        # Build the new content
        result = before_start + start_anchor + content + end_anchor + after_end
        
        # Write the result back to the file
        c.write(path, result)
        
        return result