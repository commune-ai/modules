 # start of file
import commune as c
import time
import os
import glob
import re
import json
from pathlib import Path
from typing import Dict, List, Union, Optional, Any, Tuple
from .utils import *

print = c.print

class Dev:
    """
    Advanced code generation and editing module powered by LLMs.
    
    This module provides a powerful interface for:
    - Generating code from scratch based on prompts
    - Editing existing codebases
    - Refactoring and improving code
    - Creating project scaffolding
    - Analyzing and documenting code
    - Implementing design patterns and best practices
    """

    task = f"""
            YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
            LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
            YOU FINISH ALL OF YOUR REQUESTS WITH UTMOST PRECISION AND SPEED, YOU WILL ALWAYS 
            MAKE SURE THIS WORKS TO MAKE ANYONE CODE. YOU HAVE THE CONTEXT AND INPUTS FOR ASSISTANCE
            YOU HAVE TWO MODES, EDIT AND BUILD FROM SCRATCH
            IF YOU ARE IN EDIT MODE, YOU CAN EDIT WHATEVER YOU WANT AND 
            BY DEFAULT YOU DONT NEED TO WRITE THE FULL REPO AND CAN ONLY ADD SINGLE FILES IF YOU WANT
            IF YOU NEED TO, PLEASE MAKE SURE TO ENSURE THAT THERE IS A README.md AND A SCRIPTS FOLDER
            """
    anchor = 'OUTPUT'

    def __init__(self, 
                 model: str = 'openrouter', 
                 default_model: str = 'anthropic/claude-3.7-sonnet',
                 cache_dir: str = '~/.commune/dev_cache',
                 **kwargs):
        """
        Initialize the Dev module.
        
        Args:
            provider: The LLM provider to use (default: 'openrouter')
            default_model: Default model to use for generation
            cache_dir: Directory to store cache files
            **kwargs: Additional arguments to pass to the provider
        """
        self.model = c.module(model)(**kwargs)
        self.default_model = default_model
        self.cache_dir = abspath(cache_dir)
        ensure_directory_exists(self.cache_dir)
        
    def forward(self, 
                text: str = '', 
                *extra_text, 
                target: str = './', 
                t: Optional[str] = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = None, 
                auto_save: bool = False,
                stream: bool = True,
                verbose: bool = True,
                context_files: Optional[List[str]] = None,
                ignore_patterns: List[str] = ['.git', '__pycache__', '*.pyc', '.DS_Store', '.env', 'node_modules', 'venv'],
                include_file_content: bool = True,
                use_cache: bool = True,
                module=None, 
                mode: str = 'auto', **kwargs) -> Dict[str, str]:
        """
        Generate or edit code based on the provided text prompt.
        
        Args:
            text: The main prompt text
            *extra_text: Additional text to append to the prompt
            target: Target directory for code generation/editing
            t: Alternative target directory (overrides target if provided)
            temperature: Temperature for generation (higher = more creative)
            max_tokens: Maximum tokens to generate
            model: Model to use (defaults to self.default_model)
            auto_save: Automatically save files without prompting
            stream: Whether to stream the output tokens
            verbose: Whether to print detailed information
            context_files: Specific files to include in context (if None, includes all)
            ignore_patterns: File patterns to ignore when gathering context
            include_file_content: Whether to include file content in context (vs. just file list)
            use_cache: Whether to use cached responses
            mode: Operation mode ('auto', 'edit', 'create')
            
        Returns:
            Dictionary mapping file paths to generated content
        """
        if module != None:
            target = c.dirpath(module)
        # Process target directory
        target = target or t
        target = abspath(target)
        
        # Combine all text parts
        if len(extra_text) > 0:
            text = ' '.join(list(map(str, [text] + list(extra_text))))
        text = self.preprocess(text)
        # Determine mode based on target directory content if set to auto
        if mode == 'auto':
            mode = 'edit' if os.path.exists(target) and os.listdir(target) else 'create'

        # Build the prompt
        files = c.module('dev.find')().forward(c.files(target), query=text)
        print(f'Files to edit: {files}')
        context = str({f: get_text(f) for f in files})
        
        prompt = str({
            "task": self.task,
            "format": f"<{self.anchor}(path/to/file)> # start of file\nFILE CONTENT\n</{self.anchor}(path/to/file)> # end of file",
            "output": f"assume the path is {target} only output relative path to this file",
            "context": str(context),
            "mode": mode
        }) + text

        if verbose:
            print(f"🧠 Generating code with model: {model or self.default_model}", color="cyan")
            print(f"📁 Target directory: {target}", color="cyan")
            print(f"🔧 Mode: {mode}", color="cyan")
            print(f"🍆 Size (request in characters): {len(context)} files", color="cyan")

        # Generate the response
        output = self.model.forward(
            prompt, 
            stream=stream, 
            model=model or self.default_model, 
            max_tokens=max_tokens, 
            temperature=temperature
        )
        
        # Process the output
        path2text = self._process_output(output, target, verbose)
        n_files = len(path2text)
        if n_files  > 0:
            if verbose:
                print('Files to write:')
                for path in path2text.keys():
                    print(f' - {path}')
                
            if input(f'Would you like to save {len(path2text)} files to {target}? [y/n] ').lower() == 'y':
                for path, content in path2text.items():
                    put_text(path, content)
                    if verbose:
                        print(f'✅ Saved file: {path}', color="green")
        else:
            if verbose:
                print("No files generated.", color="red")
        
        return path2text
    
    def _process_output(self, output, target, verbose=True) -> Dict[str, str]:
        """
        Process the streaming output from the model.
        
        Args:
            output: Streaming output from the model
            target: Target directory
            verbose: Whether to print detailed information
            
        Returns:
            Dictionary mapping file paths to generated content
        """
        buffer = '-------------'
        anchors = [f'<{self.anchor}(', f'</{self.anchor}(']
        color = c.random_color()
        content = ''
        path2text = {}
        
        for token in output:
            if verbose:
                print(token, end='', color=color)
            content += str(token)
            
            # Check for completed file content
            start_marker = f'<{self.anchor}('
            end_marker = f'</{self.anchor}('
            
            if start_marker in content and end_marker in content:
                # Extract file path and content
                try:
                    parts = content.split(start_marker)
                    for part in parts[1:]:  # Skip the first part (before any marker)
                        if end_marker in part:
                            file_path_part = part.split(')>')[0]
                            file_content_part = part.split(')>')[1].split(end_marker)[0]
                            
                            # Clean up the file path
                            file_path = file_path_part.strip()
                            full_path = os.path.join(target, file_path)
                            
                            # Store the content
                            path2text[full_path] = file_content_part
                            
                            if verbose:
                                print(f'{buffer}Writing file --> {file_path}{buffer}', color=color)
                            
                            # Remove the processed part from content
                            content = content.replace(f"{start_marker}{file_path_part})>{file_content_part}{end_marker}", "")
                            color = c.random_color()
                except Exception as e:
                    if verbose:
                        print(f"Error processing output: {e}", color="red")
        
        return path2text





    def preprocess(self, text, threshold=1000):
            new_text = ''
            is_function_running = False
            words = text.split(' ')
            fn_detected = False
            fns = []
            for i, word in enumerate(words):
                prev_word = words[i-1] if i > 0 else ''
                # restrictions can currently only handle one function argument, future support for multiple
                magic_prefix = f'@/'
                if word.startswith(magic_prefix) and not fn_detected:
                    word = word[len(magic_prefix):]
                    if '/' not in word:
                        word = '/' + word
                    fns += [{'fn': word, 'params': [], 'idx': i + 2}]
                    fn_detected=True
                else:
                    if fn_detected:
                        fns[-1]['params'] += [word]
                        fn_detected = False
            c.print(fns)
            for fn in fns:
                print('Running function:', fn)
                result = c.fn(fn['fn'])(*fn['params'])
                fn['result'] = result
                text =' '.join([*words[:fn['idx']],'-->', str(result), *words[fn['idx']:]])
            return text
        