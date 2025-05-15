
import commune as c
import time
import os
import glob
import re
import json
from pathlib import Path
from typing import Dict, List, Union, Optional, Any, Tuple
from .utils import *


class Dev:


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
                SOURCE=(current working directory)={source}
                CONTEXT={context}
                QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
                TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE

                --FUNCTIONS--
                YOU ARE ASSUMING EACH TOOL/FN  IS A CLASS THAT HAS THEIR OWN FORWARD FUNCTION THAT DEFINES THEIR CABAPILITIES AND SO YOU SELECT THE TOOL
                AND INSERT THE PARAMS TO CALL THE TOOL FORWARD FUNCTION, PLEASE SPECIFY THE TOOLNAME AND THE PARAMS
                YOU DONT HAVE TO USE TOOLS IF YOU DONT WANT TO
                {tools}

                --OUTPUT_FORMAT--
                YOU MUST CREATE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
                PROVIDE A PLAN OF TOOLS AND THEIR PARAMS 
                FOR EACH TOOL, PLEASE PROVIDE THE FUNCTION NAME AND THE PARAMS
                IN THIS CASE TOOLNAME IS PARAMETRIC AND 
                ONLY RESPOND IN THE FOLLOWING FORMAT and make sure you dont effect the style ONLY OUTPUT JSON INSIDE THE PARAMS
                # <FN(fn_name)><PARAMS>(params:JSONSTR)</PARAMS></FN(fn_name)>
                --OUTPUT--
                """

    def __init__(self, 
                 model: str = 'dev.model.openrouter', 
                 **kwargs):

        self.model = c.module(model)()
        self.select_files = c.module('dev.tool.select_files')()
        self.tools = c.module('dev.tool')().tool2schema()



    def forward(self, 
                text: str = '', 
                *extra_text, 
                source: str = './', 
                target = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = 'anthropic/claude-3.7-sonnet',
                stream: bool = True,
                verbose: bool = True,
                mode: str = 'auto', 
                max_age= 10000,
                **kwargs) -> Dict[str, str]:

        prompt = self.preprocess(' '.join(list(map(str, [text] + list(extra_text)))), source=source, target=target)
        # Generate the response
        output = self.model.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
        # Process the output
        return self.postprocess(output )

    def preprocess(self, text, source='./', target='./modules'):

        query = ''
        is_function_running = False
        words = text.split(' ')
        fn_detected = False
        fns = []
        for i, word in enumerate(words):
            query += word + ' '
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
                    query += str(c.fn(fns[-1]['fn'])(*fns[-1]['params']))
        prompt =self.prompt.format(
            source=source,
            context= self.select_files.forward(path=source, query=query, content=True),
            query=query,
            tools=self.tools,
            target=target,
        )
        return prompt
    
    
    def postprocess(self, output, force_save=False):
        """
        Postprocess tool outputs and extract fn calls.
        
        This fn parses the raw output text and identifies fn calls in the format:
        <FN::function_name><PARAMS/>{"param1": "value1"}</PARAMS/><FN_END>
        
        Args:
            output (str): The raw output from the model
            force_save (bool): Whether to execute the functions without asking
                
        Returns:
            list: The processed output with extracted fn calls
        """
        text = ''
        plan = []
        text_lines = []
        for ch in output:
            text += ch
            # print per line 
            print(ch, end='', flush=True)
            name2cond = {
                'has_fn':  '<FN(' in text and '</FN(' in text,
                'has_params': '<PARAMS>' in text and '</PARAMS>' in text,
            }
            is_fn = all(name2cond[k] for k in name2cond)
            if is_fn:
                fn_name = text.split('<FN(')[1].split(')')[0]
                params_str = text.split('<PARAMS>')[1].split('</PARAMS>')[0].strip()
                print("PARAMSSTR", f"{params_str}", 'PARAMSSTR')

                params = json.loads(params_str)
                text = ''
                plan.append({'fn': fn_name, 'params': params})

        if len(plan) == 0:
            print("No fn calls detected in the output.")
            return text

        else:
            print(f"Detected {len(plan)} fn calls.")
            print("Plan:")
            for fn in plan:
                print(f"Function: {fn['fn']}" ,fn['params'])
            if force_save or input("Do you want to execute the functions? (y/n): ").lower() == 'y':
                for fn in plan:
                    result = c.module(fn['fn'])().forward(**fn['params'])
        return plan