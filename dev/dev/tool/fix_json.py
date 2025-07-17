from typing import Dict, Any, List, Optional, Union
import json
import os
import re


class FixJson:
    """
    A class to fix JSON files by removing specific keys and updating file paths.
    """

    def __init__(self, model='model.openrouter'):
        self.model = model
        
    def forward(self, 
                json_data: Union[Dict[str, Any], str, List[Dict[str, Any]]], 
                remove_keys: Optional[List[str]] = None,
                fix_paths: bool = True,
                path_replacements: Optional[Dict[str, str]] = None,
                validate: bool = True,
                output_file: Optional[str] = None) -> Dict[str, Any]:
        """
        Fix JSON data by removing specified keys and updating file paths.
        
        Args:
            json_data: JSON data as dict, string (file path or JSON string), or list of dicts
            remove_keys: List of keys to remove from the JSON (supports nested keys with dot notation)
            fix_paths: Whether to fix file paths in the JSON
            path_replacements: Dictionary of path replacements {old_path: new_path}
            validate: Whether to validate the JSON after fixing
            output_file: Optional file path to save the fixed JSON
            
        Returns:
            Dictionary containing:
            - success: Whether the operation was successful
            - data: The fixed JSON data
            - removed_keys: List of keys that were removed
            - fixed_paths: List of paths that were fixed
            - message: Description of the operation
        """
        try:
            # Load JSON data if it's a file path or string
            if isinstance(json_data, str):
                if os.path.exists(json_data):
                    with open(json_data, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                else:
                    # Try to parse as JSON string
                    try:
                        data = json.loads(json_data)
                    except json.JSONDecodeError:
                        return {
                            "success": False,
                            "error": "Invalid JSON string or file path",
                            "message": f"Could not parse '{json_data}' as JSON or find it as a file"
                        }
            else:
                data = json_data
            
            # Initialize tracking lists
            removed_keys_list = []
            fixed_paths_list = []
            
            # Remove specified keys
            if remove_keys:
                data, removed = self._remove_keys(data, remove_keys)
                removed_keys_list.extend(removed)
            
            # Fix file paths
            if fix_paths:
                data, fixed = self._fix_paths(data, path_replacements)
                fixed_paths_list.extend(fixed)
            
            # Validate JSON if requested
            if validate:
                try:
                    json.dumps(data)
                except (TypeError, ValueError) as e:
                    return {
                        "success": False,
                        "error": "Invalid JSON after fixing",
                        "message": str(e)
                    }
            
            # Save to file if output path provided
            if output_file:
                os.makedirs(os.path.dirname(output_file), exist_ok=True)
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "data": data,
                "removed_keys": removed_keys_list,
                "fixed_paths": fixed_paths_list,
                "message": f"Successfully fixed JSON. Removed {len(removed_keys_list)} keys, fixed {len(fixed_paths_list)} paths."
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Error fixing JSON: {str(e)}"
            }
    
    def _remove_keys(self, data: Any, keys_to_remove: List[str]) -> tuple:
        """
        Remove specified keys from the data structure.
        Supports nested keys with dot notation (e.g., 'parent.child.key').
        """
        removed_keys = []
        
        def remove_from_dict(d: dict, key_path: str):
            keys = key_path.split('.')
            if len(keys) == 1:
                if keys[0] in d:
                    del d[keys[0]]
                    removed_keys.append(key_path)
            else:
                if keys[0] in d and isinstance(d[keys[0]], dict):
                    remove_from_dict(d[keys[0]], '.'.join(keys[1:]))
        
        def process_data(obj):
            if isinstance(obj, dict):
                for key_to_remove in keys_to_remove:
                    remove_from_dict(obj, key_to_remove)
                # Process nested structures
                for key, value in obj.items():
                    process_data(value)
            elif isinstance(obj, list):
                for item in obj:
                    process_data(item)
        
        # Deep copy to avoid modifying original
        import copy
        data_copy = copy.deepcopy(data)
        process_data(data_copy)
        
        return data_copy, removed_keys
    
    def _fix_paths(self, data: Any, replacements: Optional[Dict[str, str]] = None) -> tuple:
        """
        Fix file paths in the data structure.
        """
        fixed_paths = []
        
        # Default replacements
        default_replacements = {
            '\\': '/',  # Windows to Unix paths
            '/Users/': '~/',  # Absolute to home-relative
            'C:\\Users\\': '~/',  # Windows absolute to home-relative
        }
        
        if replacements:
            default_replacements.update(replacements)
        
        def fix_path_string(s: str) -> str:
            """Fix a single path string."""
            original = s
            
            # Apply replacements
            for old, new in default_replacements.items():
                s = s.replace(old, new)
            
            # Normalize path separators
            s = s.replace('\\', '/')
            
            # Remove duplicate slashes
            s = re.sub(r'/+', '/', s)
            
            if s != original:
                fixed_paths.append(f"{original} -> {s}")
            
            return s
        
        def process_data(obj):
            if isinstance(obj, dict):
                return {k: process_data(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [process_data(item) for item in obj]
            elif isinstance(obj, str):
                # Check if string looks like a path
                if any(indicator in obj for indicator in ['/', '\\', '~', '.py', '.json', '.txt', '.md']):
                    return fix_path_string(obj)
                return obj
            else:
                return obj
        
        fixed_data = process_data(data)
        return fixed_data, fixed_paths
    
    def batch_fix(self, 
                  json_files: List[str], 
                  remove_keys: Optional[List[str]] = None,
                  fix_paths: bool = True,
                  output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Fix multiple JSON files in batch.
        """
        results = {}
        successful = 0
        failed = 0
        
        for json_file in json_files:
            if output_dir:
                output_file = os.path.join(output_dir, os.path.basename(json_file))
            else:
                output_file = None
            
            result = self.forward(
                json_data=json_file,
                remove_keys=remove_keys,
                fix_paths=fix_paths,
                output_file=output_file
            )
            
            results[json_file] = result
            if result['success']:
                successful += 1
            else:
                failed += 1
        
        return {
            "success": failed == 0,
            "results": results,
            "summary": {
                "total": len(json_files),
                "successful": successful,
                "failed": failed
            },
            "message": f"Processed {len(json_files)} files: {successful} successful, {failed} failed"
        }
