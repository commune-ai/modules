
import commune as c
import os
from typing import Dict, Any, Optional, Union
from ..utils import abspath, put_text, ensure_directory_exists

class CreateFile:
    """
    A utility tool for creating new files at specified paths.
    
    This class provides functionality to:
    - Create new files with specified content
    - Ensure parent directories exist
    - Handle different file types appropriately
    - Provide feedback on the operation
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the CreateFile tool.
        
        Args:
            **kwargs: Additional configuration parameters
        """
        pass
    
    def forward(self, 
                file_path: str, 
                content: str = "",
                create_parent_dirs: bool = True,
                overwrite: bool = False,
                verbose: bool = True) -> Dict[str, Any]:
        """
        Create a new file at the specified path with the given content.
        
        Args:
            file_path: Path where the file should be created
            content: Content to write to the file
            create_parent_dirs: Whether to create parent directories if they don't exist
            overwrite: Whether to overwrite the file if it already exists
            verbose: Print detailed information about the operation
            
        Returns:
            Dictionary with operation results including:
            - success: Whether the operation was successful
            - file_path: Path to the created file
            - message: Description of the operation result
        """
        file_path = abspath(file_path)
        
        # Check if file already exists
        if os.path.exists(file_path) and not overwrite:
            if verbose:
                c.print(f"File already exists: {file_path}", color="yellow")
            return {
                "success": False,
                "file_path": file_path,
                "message": f"File already exists and overwrite is False"
            }
        
        # Create parent directories if needed
        parent_dir = os.path.dirname(file_path)
        if create_parent_dirs and parent_dir and not os.path.exists(parent_dir):
            try:
                ensure_directory_exists(parent_dir)
                if verbose:
                    c.print(f"Created parent directory: {parent_dir}", color="blue")
            except Exception as e:
                if verbose:
                    c.print(f"Failed to create parent directory: {str(e)}", color="red")
                return {
                    "success": False,
                    "file_path": file_path,
                    "message": f"Failed to create parent directory: {str(e)}"
                }
        
        # Write content to file
        try:
            put_text(file_path, content)
            if verbose:
                c.print(f"Successfully created file: {file_path}", color="green")
            return {
                "success": True,
                "file_path": file_path,
                "message": "File created successfully"
            }
        except Exception as e:
            if verbose:
                c.print(f"Failed to create file: {str(e)}", color="red")
            return {
                "success": False,
                "file_path": file_path,
                "message": f"Failed to create file: {str(e)}"
            }
    
    
