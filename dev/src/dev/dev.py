
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

    start_anchor = '::<START_JSON_PARAMS/>'
    end_anchor = '</END_JSON_PARAMS>::'

    prompt= """
                --GOAL--
                YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
                LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
                YOU FINISH ALL OF YOUR REQUESTS WITH UTMOST PRECISION AND SPEED, YOU WILL ALWAYS 
                MAKE SURE THIS WORKS TO MAKE ANYONE CODE. YOU HAVE THE CONTEXT AND INPUTS FOR ASSISTANCE
                YOU HAVE TWO MODES, EDIT AND BUILD FROM SCRATCH
                IF YOU ARE IN EDIT MODE, YOU CAN EDIT WHATEVER YOU WANT AND 
                BY DEFAULT YOU DONT NEED TO WRITE THE FULL REPO AND CAN ONLY ADD SINGLE FILES IF YOU WANT
                IF YOU NEED TO, PLEASE MAKE SURE TO ENSURE THAT THERE IS A README.md AND A SCRIPTS FOLDER
                "YOU CAN RESPOND WITH THE FOLLOWING FORMAT THAT MUST BE WITHIN THE PWD"

                --CONTEXT--
                PATH (current working directory)={path}
                CONTEXT={context}
                QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
                TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE

                --TOOLS--
                YOU ARE ASSUMING EACH TOOL HAS THEIR OWN FORWARD FUNCTION THAT DEFINES THEIR CABAPILITIES AND SO YOU SELECT THE TOOL
                AND INSERT THE PARAMS TO CALL THE TOOL FORWARD FUNCTION, PLEASE SPECIFY THE TOOLNAME AND THE PARAMS
                {tools}
                --OUTPUT_TOOL_PLAN_FORMAT--
                 YOU MUST CREATE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
                PROVIDE A PLAN OF TOOLS AND THEIR PARAMS 
                FOR EACH TOOL, PLEASE PROVIDE THE FUNCTION NAME AND THE PARAMS
                FN::TOOLNAME{start_anchor}(params:dict){end_anchor}TOOLNAME
                FN::TOOLNAME{start_anchor}(params:dict){end_anchor}TOOLNAME

                """

    def __init__(self, 
                 model: str = 'dev.model.openrouter', 
                 cache_dir: str = '~/.commune/dev_cache',
                 **kwargs):

        self.model = c.module(model)()
        self.cache_dir = abspath(cache_dir)
        self.select_files = c.module('dev.tool.select_files')()
        self.tools = c.module('dev.tool')().tool2schema()
        ensure_directory_exists(self.cache_dir)

    def forward(self, 
                text: str = '', 
                *extra_text, 
                path: str = './', 
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = 'anthropic/claude-3.7-sonnet',
                stream: bool = True,
                target = None,
                verbose: bool = True,
                mode: str = 'auto', 
                max_age= 10000,
                **kwargs) -> Dict[str, str]:

        prompt = self.preprocess(' '.join(list(map(str, [text] + list(extra_text)))), path=path, target=target)
        # Generate the response
        output = self.model.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
        # Process the output
        return self.postprocess(output)

    def preprocess(self, text, path='./', target='./modules'):
        query = self.process_text(text)
        context = {f: get_text(f) for f in self.select_files.forward(path=path, query=query)}
        prompt =self.prompt.format(
            path=path,
            context=context,
            query=query,
            tools=self.tools,
            target=target,
            start_anchor=self.start_anchor,
            end_anchor=self.end_anchor
        )
        return prompt

    def process_text(self, text, threshold=1000):
            new_text = ''
            is_function_running = False
            words = text.split(' ')
            fn_detected = False
            fns = []
            for i, word in enumerate(words):
                prev_word = words[i-1] if i > 0 else ''
                # restrictions can currently only handle one fn argument, future support for multiple
                magic_prefix = f'@'
                if word.startswith(magic_prefix) and not fn_detected:
                    word = word[len(magic_prefix):]
                    fns += [{'fn': word, 'params': [], 'idx': i + 2}]
                    fn_detected=True
                else:
                    if fn_detected:
                        fns[-1]['params'] += [word]
                        fn_detected = False
            for fn in fns:
                print('Running fn:', fn)
                result = c.fn(fn['fn'])(*fn['params'])
                fn['result'] = result
                print(result)
                text =' '.join([*words[:fn['idx']],'-->', str(result), *words[fn['idx']:]])
            return text

    def test(self, text='write a fn that adds two numbers and a test.js file that i can test it all in one class and have me test it in test.js and a script to run it'):
        """
        Test the Dev module by generating code based on a prompt.
        
        Args:
            text: The prompt text
            
        Returns:
            Dictionary mapping file paths to generated content
        """
        path = '~/.dev/test/add'
        return self.forward(text, to=path, verbose=True)

    def postprocess(self, output):
        """
        Postprocess tool outputs and extract fn calls.
        
        This fn parses the raw output text and identifies fn calls in the format:
        <FN::function_name>param1</FN::function_name> or 
        <FN::function_name><param_name>param_value</param_name></FN::function_name>
        
        Args:
            output (str): The raw output from the model
                
        Returns:
            str: The processed output with extracted fn calls
        """
        import re
        
        # Print the output character by character for streaming effect
        text = ''
        tool_text = ''
        plan = []
        for ch in output: 
            print(ch, end='')
            text += ch
            tool_text += ch
            if self.end_anchor in tool_text and self.start_anchor in tool_text:
                fn_name = tool_text.split(self.start_anchor)[0].split('::')[1].strip()
                json_text = tool_text.split(self.start_anchor)[1].split(self.end_anchor)[0]
                tool_json = json.loads(json_text)
                plan.append({'fn': fn_name, 'params': tool_json})
                tool_text = ''
        # You can process the fn calls here or return them for further processing
        print("Function calls detected:")
        print(plan)
        # For debugging, you can add:
        if input('Do you want to see the fn calls? (y/n): ').strip().lower() == 'y':
            print("Function calls detected:")
            for call in plan:
                print(f"Function: {call['fn']}, Parameters: {call['params']}")
                fn = c.module(call['fn'])()
                fn.forward(**call['params'])
        return plan
