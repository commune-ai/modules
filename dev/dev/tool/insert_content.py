class Tool: 

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
              trials = 4,
            
              **kwargs) -> List[str]:
        """
        insert content into a conten between start and end anchors
        """
        for t in range(trials):
            prompt = f'''
                TASK={self.task}
                CONTENT={content} 
                OUTPUT_FORMAT={self.anchors[0]}{self.output_format}{self.anchors[1]}
                HISTORY={history}
                '''
            try:
                result = self.model.forward( prompt, stream=True)
                result = self.process(result)
                return  json.loads(result['data'])
            except json.JSONDecodeError as e:
                history.append(str(e))
        raise ValueError("Failed to process JSON after multiple attempts.")

