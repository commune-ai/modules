
from typing import List
import commune as c

class ContentTool:

    def forward(self, path: str = './', max_size=10000) -> List[str]:
        """
        Find files in a directory matching a specific pattern.
        
        Args:
            path (str): The directory to search in.
            pattern (str): The file pattern to match.
            
        Returns:
            List[str]: A list of file paths matching the pattern.
        """
        result = c.fn('dev.tool.select_files/forward')(path)
        content = str(result)
        size = len(content)
        c.print(f"path={path} max_size={max_size} size={size}", color='cyan')

        if size > max_size:
            summarize = c.fn('dev.tool.summarize_file/forward')
            new_results = {}
            f2k = {}
            for k, v in result.items():
                future = c.submit(summarize, {'content': v})
                f2k[future] = k
            try:
                results = {}
                for future in c.as_completed(f2k, timeout=30):
                    k = f2k[future]
                    print(f"Processing {k}")
                    v = future.result()
                    results[k] = v
            except TimeoutError as e:
                c.print(f"Timeout while processing content: {e}", color='red')

            return results
        else:
            result = content
        c.print(f"Content found: {len(result)} items", color='green')
        return result
