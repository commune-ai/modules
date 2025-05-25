
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
    prompt =  """
            --GOAL--
            - YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
            - LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
            - YOU finish ALL OF YOUR REQUESTS WITH UTMOST PRECISION AND SPEED, YOU WILL ALWAYS 
            - MAKE SURE THIS WORKS TO MAKE ANYONE CODE. YOU HAVE THE CONTEXT AND INPUTS FOR ASSISTANCE
            - IF YOU ARE IN EDIT MODE, YOU CAN EDIT WHATEVER YOU WANT AND BY DEFAULT YOU DONT NEED TO WRITE THE FULL REPO AND CAN ONLY ADD SINGLE FILES IF YOU WANT
            - IF YOU NEED TO, PLEASE MAKE SURE TO ENSURE THAT THERE IS A README.md AND A SCRIPTS FOLDER
            - "YOU CAN RESPOND WITH THE FOLLOWING FORMAT THAT MUST BE WITHIN THE PWD"
            - FIRST OBSERVE USING THE COMMAND LINE AND THEN YOU CAN MAKE CHANGES IF YOU NEED TO, BUT YOU DONT HAVE TOOOO
            - LETS DO THIS ONE STEP AT A TIME
            - REFER TO THE MAX STEPS AND IF YOU HAVE 1 MAX_STEP IT MEANS YOU HAVE TO DO IT IN ONE STEP, (ONESHOT)

            --PARAMS--
            SOURCE=(current working directory)={source}
            CONTEXT={context} # THE FILES YOU ARE TRYING TO MODIFY
            QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
            TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE
            MAX_STEPS={steps} # THE MAX STEPS YOU ARE ALLOWED TO TAKE
            history={history} # THE HISTORY OF THE AGENT
            tools={tools} # THE TOOLS YOU ARE ALLOWED TO USE
            
            --OUTPUT_FORMAT--
            YOU MUST CREATE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
            PROVIDE A PLAN OF TOOLS AND THEIR PARAMS 
            FOR EACH TOOL, PLEASE PROVIDE THE FUNCTION NAME AND THE PARAMS
            IN THIS CASE TOOLNAME IS PARAMETRIC AND 
            THE PARAMS ARE THE JSON OBJECT THAT YOU WILL USE TO CALL THE TOOL
            # <FN(fn_name)><PARAMS>(params:JSONSTR)</PARAMS></FN(fn_name)>

            IF YOU NEED TO RUN THE TOOLS AND PAUSE SAY 

            <FN(review)><PARAMS></PARAMS></FN(review)> FOR review
            IF YOU NEED TO finish THE MARKOV DO 
            <FN(finish)><PARAMS></PARAMS></FN(finish)> FOR finishING

            CRITICAL NOTES:anthropic/claude-3-opus
                MAKE SURE YOU review BEFORE YOU WRITE ANYTHING
            --OUTPUT--
    """


    def __init__(self, 
                 provider: str = 'dev.model.openrouter', 
                 model = 'anthropic/claude-3.7-sonnet',
                 safety = True,
                 **kwargs):
        self.provider = c.module(provider)(model=model)
        self.model = model
        self.select_files = c.module('dev.tool.select_files')()
        self.tools = c.module('dev.tool')().tool2schema()
        self.safety = safety


    def forward(self, 
                text: str = 'where am i', 
                *extra_text, 
                source: str = './', 
                target = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                model: Optional[str] = None,
                stream: bool = True,
                verbose: bool = True,
                mode: str = 'auto', 
                module = None,
                max_age= 10000,
                steps = 2,
                history = None,
                **kwargs) -> Dict[str, str]:
        output = ''
        text = ' '.join(list(map(str, [text] + list(extra_text))))
        query = self.preprocess(text=text, source=source, target=target)
        # Generate the response
        history = history if history else []
        if module != None:
            print('Module Detected --> ', module)
            source = c.dirpath(module)
            print('New Source--> ', source)
        for step in range(steps):

            try:
                prompt =self.prompt.format(
                    source=source,
                    context= '',
                    query=query,
                    tools=self.tools,
                    history=history,
                    steps=steps,
                    target=target,
                )
                output = self.provider.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
                # Process the output
                output =  self.postprocess(output)
                history.append(output)
            except Exception as e:
                c.print(f"Error: {e}", color='red')
                time.sleep(1)
                history.append({'error': str(e)})   
                continue
            except KeyboardInterrupt:
                print("KeyboardInterrupt: Stopping the process.")
                break

        return output




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


    def display_step(self, step:dict, idx, color=None):
        """
        Display the step in a readable format.
        
        Args:
            step (dict): The step to display.
        """
        if not color:
            color = c.random_color()
        c.print(f"Step ({idx}): {step['fn']}", color=color)
        for k, v in step['params'].items():
            c.print(f"  {k}: {v}", color=color)
        return step



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
            c.print(ch, end='')
            name2cond = {
                'has_fn':  '<FN(' in text and '</FN(' in text,
                'has_params': '<PARAMS>' in text and '</PARAMS>' in text,
            }
            if '<FN(finish)' in text and '</FN(finish)>' in text:
                plan += [{'fn': 'finish', 'params': {}}]
                break
            if '<FN(review)' in text and '</FN(review)>' in text:
                plan += [{'fn': 'review', 'params': {}}]
                break
            is_fn = all(name2cond[k] for k in name2cond)
            if is_fn:
                fn_name = text.split('<FN(')[1].split(')')[0]
     
                params_str = text.split('<PARAMS>')[1].split('</PARAMS>')[0].strip()
                c.print(f"params_str: {params_str}")
                params = json.loads(params_str)
                text = ''
                step = {'fn': fn_name, 'params': params}
                self.display_step(step, idx=len(plan))
                plan.append(step)

        c.print("Plan:", plan, color='yellow')
        results = []
        if self.safety:
            # Check if the plan is safe to execute
            
            input_text = input("Do you want to execute the plan? (y/n): ")
            if input_text.startswith('y'):
                for fn in plan:
                    c.print(f"Function: {fn['fn']}" ,fn['params'])
                    if not fn['fn'] in ['finish', 'review']:
                        results.append(c.module(fn['fn'])().forward(**fn['params']))
                if len(input_text) > 1 :
                    extra_message = input_text[1:]
                    print(f"Extra message: {extra_message}")
                    results.append({"EXTRA NOTE YOUR COMMANDER": extra_message})
        return results