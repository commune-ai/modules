 # start of file
import commune as c
import os
import re
from typing import Dict, List, Union, Optional, Any, Tuple
from .utils import abspath, get_text, put_text, ensure_directory_exists

class Edit:
    """
    Advanced code editing module that proposes specific changes to files.
    
    This module provides functionality for:
    - Editing existing files with specific changes
    - Adding new files to a codebase
    - Refactoring code sections
    - Implementing feature requests through targeted edits
    """
    
    def __init__(self, dev_module=None):
        """
        Initialize the Edit module.
        
        Args:
            dev_module: Reference to the parent Dev module (optional)
        """
        self.dev = c.module('dev')()
    
    def forward(self, 
                instructions: str = "make this better", 
                target: str = './',
                files: Optional[List[str]] = None,
                temperature: float = 0.3,
                model: Optional[str] = None,
                auto_save: bool = False,
                verbose: bool = True,
                max_tokens: int = 1000000,
                stream: bool = True) -> Dict[str, Dict[str, Any]]:
        """
        Propose specific edits to files based on instructions.
        
        Args:
            instructions: Instructions for editing the files
            target: Target directory containing files to edit
            files: Specific files to edit (if None, will determine from instructions)
            temperature: Temperature for generation
            model: Model to use for generation
            auto_save: Whether to automatically save the edited files
            verbose: Whether to print detailed information
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the output tokens
            
        Returns:
            Dictionary mapping file paths to edit information:
            {
                'file_path': {
                    'original': 'original content',
                    'edited': 'edited content',
                    'changes': [
                        {
                            'type': 'add'|'remove'|'modify',
                            'line_start': int,
                            'line_end': int,
                            'original': 'original section',
                            'replacement': 'replacement section',
                            'explanation': 'explanation of change'
                        },
                        ...
                    ]
                },
                ...
            }
        """
        target = abspath(target)
        
        # If no specific files provided, try to determine from instructions
        if files is None:
            files = self._extract_files_from_instructions(instructions, target)
        
        # If still no files, use dev.find to identify relevant files
        if not files and hasattr(self.dev, 'model'):
            try:
                all_files = c.files(target)
                files = c.module('dev.find')().forward(all_files, query=instructions)
            except Exception as e:
                if verbose:
                    c.print(f"Error finding relevant files: {e}", color="yellow")
                files = []
        
        # Build context of existing files
        file_contents = {}
        for file_path in files:
            full_path = os.path.join(target, file_path) if not os.path.isabs(file_path) else file_path
            if os.path.exists(full_path):
                file_contents[full_path] = get_text(full_path)
            else:
                file_contents[full_path] = ""  # New file to be created
        
        # Build the prompt
        prompt = self._build_edit_prompt(instructions, file_contents)
        
        # Generate the response using the dev module
        if not hasattr(self.dev, 'model'):
            raise ValueError("Edit module requires a reference to the Dev module")
        
        if verbose:
            c.print(f"🧠 Generating edits with model: {model or self.dev.default_model}", color="cyan")
            c.print(f"📁 Target directory: {target}", color="cyan")
            c.print(f"📄 Files to edit: {', '.join(files) or 'to be determined'}", color="cyan")
        
        output = self.dev.model.generate(
            prompt, 
            stream=stream, 
            model=model or self.dev.default_model, 
            max_tokens=max_tokens, 
            temperature=temperature
        )
        
        # Process the output
        edit_results = self._process_edit_output(output, file_contents, target, verbose)
        
        # Handle saving files if auto_save is enabled or user confirms
        if edit_results:
            if verbose:
                print('Proposed file changes:')
                for path, info in edit_results.items():
                    rel_path = os.path.relpath(path, target)
                    if not os.path.exists(path):
                        c.print(f" + Create new file: {rel_path}", color="green")
                    else:
                        c.print(f" ~ Edit file: {rel_path}", color="yellow")
                        for change in info.get('changes', []):
                            c.print(f"   - {change['explanation']}", color="blue")
            
            if auto_save or input(f'Would you like to apply these changes? [y/n] ').lower() == 'y':
                for path, info in edit_results.items():
                    ensure_directory_exists(os.path.dirname(path))
                    put_text(path, info['edited'])
                    if verbose:
                        c.print(f'✅ Saved file: {path}', color="green")
        else:
            if verbose:
                c.print("No edits generated.", color="red")
        
        return edit_results
    
    def _extract_files_from_instructions(self, instructions: str, target_dir: str) -> List[str]:
        """
        Extract file paths mentioned in the instructions.
        
        Args:
            instructions: The edit instructions
            target_dir: The target directory
            
        Returns:
            List of file paths mentioned in instructions
        """
        # Simple regex to find file paths in instructions
        file_patterns = [
            r'(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s|$|[,.;:])',  # Files with extensions
            r'(?:^|\s)([a-zA-Z0-9_\-./]+/[a-zA-Z0-9_\-./]+)(?:\s|$|[,.;:])'  # Directory paths
        ]
        
        potential_files = []
        for pattern in file_patterns:
            matches = re.findall(pattern, instructions)
            potential_files.extend(matches)
        
        # Filter to files that exist in the target directory
        existing_files = []
        for file in potential_files:
            full_path = os.path.join(target_dir, file) if not os.path.isabs(file) else file
            if os.path.exists(full_path):
                existing_files.append(file)
        
        return existing_files
    
    def _build_edit_prompt(self, instructions: str, file_contents: Dict[str, str]) -> str:
        """
        Build a prompt for the edit operation.
        
        Args:
            instructions: The edit instructions
            file_contents: Dictionary mapping file paths to their contents
            
        Returns:
            Formatted prompt for the LLM
        """
        prompt = f"""
        You are a code editing assistant. You need to propose specific edits to files based on these instructions:
        
        INSTRUCTIONS:
        {instructions}
        
        FILES TO EDIT:
        """
        
        for path, content in file_contents.items():
            file_status = "EXISTING FILE" if content else "NEW FILE TO CREATE"
            prompt += f"\n--- {file_status}: {path} ---\n"
            if content:
                prompt += f"```\n{content}\n```\n"
            else:
                prompt += "This file needs to be created.\n"
        
        prompt += """
        For each file, provide:
        1. The complete edited content
        2. A list of specific changes made with line numbers and explanations
        
        Format your response as follows:
        
        file/path

        {
            "original": "original content",
            "edited": "edited content",
            "changes": [
                {
                    "type": "add"|"remove"|"modify",
                    "line_start": int,
                    "line_end": int,
                    "original": "original section",
                    "replacement": "replacement section",
                    "explanation": "explanation of change"
                },
                ...
            ]
        }
        """
        return prompt
        
    def _process_edit_output(self, output: str, file_contents: Dict[str, str], target_dir: str, verbose: bool = True) -> Dict[str, Dict[str, Any]]:
        """
        Process the output from the LLM to extract file edits.
        
        Args:
            output: The output text from the LLM
            file_contents: Original file contents
            target_dir: Target directory
            verbose: Whether to print detailed information
            
        Returns:
            Dictionary mapping file paths to edit information
        """
        edit_results = {}
        
        # Handle both string and streaming outputs
        if not isinstance(output, str):
            output = "".join(output)
        
        # Extract file sections from the output
        file_sections = re.split(r'\n(?=[\w\./]+\n\n\{)', output.strip())
        
        for section in file_sections:
            if not section.strip():
                continue
                
            # Extract file path and JSON content
            try:
                # Split into file path and JSON content
                parts = section.strip().split('\n\n', 1)
                if len(parts) != 2:
                    if verbose:
                        c.print(f"Skipping malformed section: {section[:100]}...", color="red")
                    continue
                    
                file_path, json_content = parts
                file_path = file_path.strip()
                
                # Make sure the file path is absolute
                if not os.path.isabs(file_path):
                    file_path = os.path.join(target_dir, file_path)
                    
                # Parse the JSON content
                try:
                    edit_info = c.load_json(json_content)
                except Exception as e:
                    if verbose:
                        c.print(f"Error parsing JSON for {file_path}: {e}", color="red")
                        c.print(f"JSON content: {json_content[:200]}...", color="yellow")
                    continue
                    
                # Validate the edit info structure
                if not isinstance(edit_info, dict) or 'edited' not in edit_info:
                    if verbose:
                        c.print(f"Invalid edit info for {file_path}: missing 'edited' field", color="red")
                    continue
                    
                # If original content wasn't provided, use the existing content
                if 'original' not in edit_info and file_path in file_contents:
                    edit_info['original'] = file_contents[file_path]
                    
                # If changes weren't provided, compute a basic diff
                if 'changes' not in edit_info:
                    edit_info['changes'] = [{
                        'type': 'modify',
                        'line_start': 1,
                        'line_end': len(file_contents.get(file_path, '').split('\n')),
                        'original': edit_info.get('original', ''),
                        'replacement': edit_info['edited'],
                        'explanation': 'Complete file replacement'
                    }]
                    
                edit_results[file_path] = edit_info
                    
            except Exception as e:
                if verbose:
                    c.print(f"Error processing section: {e}", color="red")
                    c.print(f"Section content: {section[:200]}...", color="yellow")
        
        return edit_results
