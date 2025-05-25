
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
                - YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
                - LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
                - YOU FINISH ALL OF YOUR REQUESTS WITH UTMOST PRECISION AND SPEED, YOU WILL ALWAYS 
                - MAKE SURE THIS WORKS TO MAKE ANYONE CODE. YOU HAVE THE CONTEXT AND INPUTS FOR ASSISTANCE
                - IF YOU ARE IN EDIT MODE, YOU CAN EDIT WHATEVER YOU WANT AND BY DEFAULT YOU DONT NEED TO WRITE THE FULL REPO AND CAN ONLY ADD SINGLE FILES IF YOU WANT
                - IF YOU NEED TO, PLEASE MAKE SURE TO ENSURE THAT THERE IS A README.md AND A SCRIPTS FOLDER
                - "YOU CAN RESPOND WITH THE FOLLOWING FORMAT THAT MUST BE WITHIN THE PWD"
                - FIRST OBSERVE USING THE COMMAND LINE AND THEN YOU CAN MAKE CHANGES IF YOU NEED TO, BUT YOU DONT HAVE TOOOO
                - LETS DO THIS ONE STEP AT A TIME

                --CONTEXT--
                SOURCE=(current working directory)={source}
                CONTEXT={context} $# THE CONTEXT OF THE REPO YOU ARE TRYING TO MODIFY
                QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
                TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE
                
                --TOOLS--
                - YOU ARE ASSUMING EACH TOOL/FN  IS A CLASS THAT HAS THEIR OWN FORWARD FUNCTION THAT DEFINES THEIR CABAPILITIES AND SO YOU SELECT THE TOOL
                -AND INSERT THE PARAMS TO CALL THE TOOL FORWARD FUNCTION, PLEASE SPECIFY THE TOOLNAME AND THE PARAMS
                - YOU DONT HAVE TO USE TOOLS IF YOU DONT WANT TO
                PLEASE MAKE SURE YOU UNDERSTAND THE SOURCE AND CONTEXT AND IF YOU DONT, THEN USE THE TOOLS TO UNDERSTNAD IT AND IT WILL FEED BACK TO YOU IN THE MEMORY
                {tools}
                --TOOL_HISTORY--
                - YOU HAVE A MEMORY THAT IS A JSON OBJECT THAT IS THE MEMORY OF THE AGENT
                {history}
    
                YOU HAVE A MEMORY THAT IS A JSON OBJECT THAT IS THE MEMORY OF THE AGENT
                --OUTPUT_FORMAT--
                YOU MUST CREATE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
                PROVIDE A PLAN OF TOOLS AND THEIR PARAMS 
                FOR EACH TOOL, PLEASE PROVIDE THE FUNCTION NAME AND THE PARAMS
                IN THIS CASE TOOLNAME IS PARAMETRIC AND 
                THE PARAMS ARE THE JSON OBJECT THAT YOU WILL USE TO CALL THE TOOL
                # <FN(fn_name)><PARAMS>(params:JSONSTR)</PARAMS></FN(fn_name)>

                IF YOU NEED TO RUN THE TOOLS AND PAUSE SAY 

                <FN(REVIEW)><PARAMS></PARAMS></FN(REVIEW)> FOR REVIEW
                IF YOU NEED TO FINISH THE MARKOV DO 
                <FN(FINISH)><PARAMS></PARAMS></FN(FINISH)> FOR FINISHING

                CRITICAL NOTES:
                    MAKE SURE YOU REVIEW BEFORE YOU WRITE ANYTHING
                --OUTPUT--
                """

    def __init__(self, 
                 model: str = 'dev.model.openrouter', 
                 safety = True,
                 **kwargs):
        self.safety = safety
        self.model = c.module(model)()
        self.select_files = c.module('dev.tool.select_files')()
        self.tools = c.module('dev.tool')().tool2schema()




    def preprocess(self, text, source='./', target='./modules'):

        query = ''
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
        return query


    def forward(self, 
                text: str = 'where am i', 
                *extra_text, 
                source: str = None, 
                target = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = 'anthropic/claude-3.7-sonnet',
                stream: bool = True,
                verbose: bool = True,
                mode: str = 'auto', 
                max_age= 10000,
                steps = 10,
                history = None,
                **kwargs) -> Dict[str, str]:
        text = ' '.join(list(map(str, [text] + list(extra_text))))
        query = self.preprocess(text=text, source=source, target=target)
        # Generate the response
        history = history if history else []
        for step in range(steps):

            try:
                prompt =self.prompt.format(
                    source=source,
                    context= self.select_files.forward(path=source, query=query, content=True) if source else '',
                    query=query,
                    tools=self.tools,
                    history=history,
                    target=target,
                )
                output = self.model.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
                # Process the output
                output =  self.postprocess(output )
                history.append(output)
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(1)
                continue

        return output


    def postprocess(self, output, steps=1):
        """
        Postprocess tool outputs and extract fn calls.
        
        This fn parses the raw output text and identifies fn calls in the format:
        <FN::function_name><PARAMS/>{"param1": "value1"}</PARAMS/><FN_END>
        
        Args:
            output (str): The raw output from the model                
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
            if '<FN(FINISH)' in text and '</FN(FINISH)>' in text:
                plan += [{'fn': 'FINISH', 'params': {}}]
                break
            if '<FN(REVIEW)' in text and '</FN(REVIEW)>' in text:
                plan += [{'fn': 'REVIEW', 'params': {}}]
                break
            is_fn = all(name2cond[k] for k in name2cond)
            if is_fn:
                fn_name = text.split('<FN(')[1].split(')')[0]
                params_str = text.split('<PARAMS>')[1].split('</PARAMS>')[0].strip()
                try:
                    params = json.loads(params_str)
                except json.JSONDecodeError:
                    break
                text = ''
                plan.append({'fn': fn_name, 'params': params})
                c.print(plan[-1], color='blue')

                
        c.print(plan, color='green')
        print("Plan:", plan)
        results = []
        if self.safety:
            # Check if the plan is safe to execute
            
            if input("Do you want to execute the plan? (y/n): ").lower() == 'y':
                for fn in plan:
                    print(f"Function: {fn['fn']}" ,fn['params'])
                    if not fn['fn'] in ['FINISH', 'REVIEW']:
                        results.append(c.module(fn['fn'])().forward(**fn['params']))
        return results