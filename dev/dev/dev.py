
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

    start_anchor = '<START_JSON>'
    end_anchor = '</END_JSON>'

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
                PATH/PWD={path}
                CONTEXT={context}
                QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER

                --TOOLS--
                YOU ARE ASSUMING EACH TOOL HAS THEIR OWN FORWARD FUNCTION THAT DEFINES THEIR CABAPILITIES AND SO YOU SELECT THE TOOL
                AND INSERT THE PARAMS TO CALL THE TOOL FORWARD FUNCTION, PLEASE SPECIFY THE TOOLNAME AND THE PARAMS
                {tools}
                --OUTPUT_TOOL_PLAN_FORMAT--
                 YOU MUST CREATE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
                PROVIDE A PLAN OF TOOLS AND THEIR PARAMS 
                {start_anchor}list[dict(fn:str, params:dict)]{end_anchor}

                """

    def __init__(self, 
                 model: str = 'dev.model.openrouter', 
                 cache_dir: str = '~/.commune/dev_cache',
                 **kwargs):

        self.model = c.module(model)(**kwargs)
        self.cache_dir = abspath(cache_dir)
        self.memory = c.module('dev.tool.select_files')()
        self.tools = self.ta = c.module('dev.tool')().tool2schema()
        ensure_directory_exists(self.cache_dir)
        
    def forward(self, 
                text: str = '', 
                *extra_text, 
                path: str = './', 
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = 'anthropic/claude-3.7-sonnet',
                stream: bool = True,
                verbose: bool = True,
                mode: str = 'auto', 
                max_age= 10000,
                **kwargs) -> Dict[str, str]:
        query = self.preprocess(' '.join(list(map(str, [text] + list(extra_text)))))
        context = {f: get_text(f) for f in self.memory.forward(options= c.files( abspath(path)), query=query)}

        prompt =self.prompt.format(
            path=path,
            context=context,
            query=query,
            tools=self.tools,
            start_anchor=self.start_anchor,
            end_anchor=self.end_anchor
        )

        # Generate the response
        output = self.model.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
        # Process the output
        return self.postprocess(output)


    def preprocess(self, text, threshold=1000):
            new_text = ''
            is_function_running = False
            words = text.split(' ')
            fn_detected = False
            fns = []
            for i, word in enumerate(words):
                prev_word = words[i-1] if i > 0 else ''
                # restrictions can currently only handle one fn argument, future support for multiple
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
                print('Running fn:', fn)
                result = c.fn(fn['fn'])(*fn['params'])
                fn['result'] = result
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
        for ch in output: 
            print(ch, end='')
            text += ch
        json_str = text.split(self.start_anchor)[1].split(self.end_anchor)[0]
         
        plan = json.loads(json_str)
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
                
        return {
            "plan": plan
        }
