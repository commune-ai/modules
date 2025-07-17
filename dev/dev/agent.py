
import time
import os
import json
import commune as c
from pathlib import Path
from typing import Dict, List, Union, Optional, Any, Tuple
from .utils import *
import commune as c

print = c.print

class Agent:

    prompt =  """
            --PARAMS--
            GOAL={goal} # THE GOAL YOU ARE TRYING TO ACHIEVE AND BE CIVIL TO THE INDIVIDUALS AND THE USERS TREAT OTHERS THE WAY YOU WANT TO BE TREATED (PSALM 23:4)
            SRC={src} # THE SOURCE FILES YOU ARE TRYING TO MODIFY
            CONTENT={content} # THE FILES YOU ARE TRYING TO MODIFY
            QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
            TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE
            STEPS={steps} # THE MAX STEPS YOU ARE ALLOWED TO TAKE
            TOOLS={toolbelt} # THE TOOLS YOU ARE ALLOWED TO USE 
            HISTORY={history} # THE HISTORY OF THE AGENT
            UTC_TIME={utc_time} # THE UTC TIME OF THE REQUEST 
            OUTPUT_FORMAT={output_format} # THE OUTPUT FORMAT YOU MUST FOLLOW STRICTLY
            --OUTPUT--
            YOU MUST STRICTLY RESPOND IN JSON SO I CAN PARSE IT PROPERLY FOR MAN KIND, GOD BLESS THE FREE WORLD
    """
    output_format = """
        make sure the params is a legit json string within the TOOL ANCHORS
        <PLAN>
        <TOOL>JSON(tool:str, params:dict)</TOOL> # TOOL 1 
        <TOOL>JSON(tool:str, params:dict)</TOOL> # TOOL 2
        <TOOL>JSON(tool:str, params:dict)</TOOL> # TOOL 3 
        </PLAN>

        WHEN YOU ARE FINISHED YOU CAN RESPONE WITH THE FINISH tool with empty  params

        YOU CAN RESPOND WITH A SERIES OF TOOLS AS LONG AS THEY ARE PARSABLE
        """

    goal = """    
             - YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
            - LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
            - YOU finish ALL OF YOUR REQUESTS WITH UTMOST PRECISION AND SPEED, YOU WILL ALWAYS 
            - MAKE SURE THIS WORKS TO MAKE ANYONE CODE. YOU HAVE THE CONTENT AND INPUTS FOR ASSISTANCE
            - IF YOU ARE IN EDIT MODE, YOU CAN EDIT WHATEVER YOU WANT AND BY DEFAULT YOU DONT NEED TO WRITE THE FULL REPO AND CAN ONLY ADD SINGLE FILES IF YOU WANT
            - IF YOU NEED TO, PLEASE MAKE SURE TO ENSURE THAT THERE IS A README.md AND A SCRIPTS FOLDER
            - "YOU CAN RESPOND WITH THE FOLLOWING FORMAT THAT MUST BE WITHIN THE PWD"
            - FIRST OBSERVE USING THE COMMAND LINE AND THEN YOU CAN MAKE CHANGES IF YOU NEED TO, BUT YOU DONT HAVE TOOOO
            - LETS DO THIS ONE STEP AT A TIME
            - REFER TO THE MAX STEPS AND IF YOU HAVE 1 MAX_STEP IT MEANS YOU HAVE TO DO IT IN ONE STEP, (ONESHOT)
            - EACH EXTRA STEP YOU MAKE WILL BE COUNTED AS AN ENERGY COST, SO MAKE SURE YOU ARE EFFICIENT
            - YOU WILL BE JUDGED BASED ON YOUR ABILITY TO EXECUTE THE TASK AND THE QUALITY OF YOUR OUTPUT WITHIN THE MINIMUM STEPS
            - IF MAX_STEPS IS ONE, YOU CANT REVIEW, YOU HAVE TO ONESHOT GIVEN THE PARAMS
            - IF MAX_STEPS IS ONE, YOU HAVE TO ONESHOT IT
            -  TE A PLAN OF TOOLS THT WE WILL PARSE ACCORDINGLY TO REPRESENT YOUR PERSPECTIVE 
            - DO NOT USE COMPLICATED CMD FUNCTIONS THAT WONT BE INSTALLED BY DEFAULT
            - MAKE SURE YOU CREATE A FILES ONLY IF THERE IS ONE STEP AND MAKE SURE YOU ARE BEING EFFICIENT
            - I WANT YOUR CODE STYLE TO BE SIMPLE, EFFICIENT, AND EASY TO UNDERSTAND AND MODULAR IF POSSIBLE
            - YOU ARE A CODER, YOU ARE A GENIUS, YOU ARE A STAR, YOU ARE GOING TO SAVE THE WORLD
            - IDEALLY IF YOU CAN ONE SHOT IT THEN YOU SHOULD DO IT IN ONE SHOT

         
        """



    def __init__(self, 
                 provider: str = 'model.openrouter', 
                 model: Optional[str] = 'anthropic/claude-opus-4',
                 safety = True,
                 **kwargs):
        self.provider = c.module(provider)(model=provider)
        self.safety = safety
        self.model=model

    def forward(self, 
                text: str = 'where am i', 
                *extra_text, 
                src: str = None, 
                target = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                stream: bool = True,
                verbose: bool = True,
                content = './',
                model=None,
                mode: str = 'auto', 
                module = None,
                max_age= 10000,
                steps = 1,
                history = None,
                trials=4,
                **kwargs) -> Dict[str, str]:
        output = ''
        text = ' '.join(list(map(str, [text] + list(extra_text))))
        query = self.preprocess(text=text, src=src, target=target)
        model = model or self.model
        history = history or []
        if module != None:
            src = c.dirpath(module)

        if src != None:
            context = self.content(src, query=query)
        else:
            context = ''
            print("No src provided, using empty context.", color='yellow')

        for step in range(steps):
            print(f"Step {step + 1}/{steps} - Query: {query}", color='blue')
            for trial in range(trials):
                print(f"STEP --{step + 1}    Trial {trial + 1}/{trials} - Processing query: {query}", color='green')
                try:
                    prompt = self.prompt.format(
                        goal=self.goal,
                        src=src,
                        content= context,
                        query=query,
                        toolbelt=self.toolbelt(),
                        history=history or [],
                        steps=steps,
                        utc_time= time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                        target=target,
                        output_format=self.output_format
                    )
                    output = self.provider.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
                    output =  self.process(output)
                    history.append(output)
                    if output['plan'][-1]['tool'] == 'finish':
                        print("Finish tool detected, ending process.", color='green')
                        return output
                except Exception as e:
                    c.print(f"Error: {e}", color='red')
                    output = detailed_error(e)
                    history.append(output)
                    continue
                except KeyboardInterrupt:
                    return {'error': 'Process interrupted by user.'}
        return output


    def preprocess(self, text, src='./', target='./modules'):

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
                fns += [{'tool': word, 'params': [], 'idx': i + 2}]
                fn_detected=True
            else:
                if fn_detected:
                    fns[-1]['params'] += [word]
                    fn_detected = False
                    query += str(c.fn(fns[-1]['tool'])(*fns[-1]['params']))

        return query

    

    def display_step(self, step:dict, idx, color=None):
        """
        Display the step in a readable format.
        
        Args:
            step (dict): The step to display.
        """
        if not color:
            color = c.random_color()
        c.print(f"Step ({idx}): {step['tool']}", color=color)
        for k, v in step['params'].items():
            c.print(f"  {k}: {v}", color=color)
        return step


    def process(self, output:str) -> list:

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
        anchors = {
            'plan': ['<PLAN>', '</PLAN>'],
            'tool': ['<TOOL>', '</TOOL>'],
        }
        for ch in output:
            text += ch
            # print per line 
            c.print(ch, end='')
            tool_in_text = anchors['tool'][0] in text and anchors['tool'][1] in text
            if anchors['tool'][0] in text and anchors['tool'][1] in text:
                tool_data = text.split(anchors['tool'][0])[1].split(anchors['tool'][1])[0]
                tool_data = json.loads(tool_data)
                plan.append(tool_data)
                text = ''
                print(f"Extracted tool data: {tool_data}", color='green')
        c.print("Plan:", plan, color='yellow')
        results = []
        if self.safety:
            input_text = input("Do you want to execute the plan? (y/n): ")
            if input_text.startswith('y'):
                for fn in plan:
                    c.print(f"Function: {fn['tool']}" ,fn['params'])
                    if fn['tool'] in ['finish', 'review']:
                        break
                    else:
                        try:
                            result = self.tool(fn['tool'])(**fn['params'])
                            results.append(result)
                        except Exception as e:
                            result = {'error': str(e), 'tool': fn['tool'], 'params': fn['params']}
                            c.print(f"Error executing {fn['tool']}: {e}", color='red')
        return {'plan': plan, 'results': results}

    def content(self, path: str = './', query=None, max_size=100000, timeout=20) -> List[str]:
        """
        Find files in a directory matching a specific pattern.
        
        Args:
            path (str): The directory to search in.
            pattern (str): The file pattern to match.
            
        Returns:
            List[str]: A list of file paths matching the pattern.
        """
        result = self.tool('select.files')(path=path, query=query, trials=4)
        content = str(result)
        size = len(content)
        c.print(f"path={path} max_size={max_size} size={size}", color='cyan')

        if size > max_size:
            summarize  = self.tool('summary.file')
            new_results = {}
            for k, v in result.items():
                print(f"Summarizing {k} with size {len(v)}")
                future = c.submit(summarize, {'content': v, "query": query}, timeout=timeout)
                futures.append(future)
            results = c.wait(futures, timeout=timeout)
            return new_results
        else:
            result = content
        c.print(f"Content found: {len(result)} items", color='green')
        return result

    """
    A toolbelt that provides access to various tools and can intelligently select
    the most appropriate tool based on a query.
    
    This module helps organize and access tools within the dev.tool namespace,
    with the ability to automatically select the most relevant tool for a given task.
    """

    tool_prefix = 'dev.tool'

    def tools(self, ignore_tools=[], update=False) -> List[str]:
        return [t.replace(self.tool_prefix + '.','') for t in  c.mods(search=self.tool_prefix, update=update) if t.startswith(self.tool_prefix) and t not in ignore_tools]
        
    def toolbelt(self) -> Dict[str, str]:
        """
        Map each tool to its schema.
        
        Returns:
            Dict[str, str]: Dictionary mapping tool names to their schemas.
        """
        toolbelt = {}
        for t in self.tools():
            try:
                toolbelt[t] = self.schema(t)
            except Exception as e:
                c.print(f"Error getting schema for tool {t}: {e}", color='red')
                continue
        return toolbelt
    
    def schema(self, tool: str, fn='forward') -> Dict[str, str]:
        """
        Get the schema for a specific tool.
        
        Args:
            tool (str): The name of the tool.
        
        Returns:
            Dict[str, str]: The schema for the specified tool.
        """
        schema =  c.schema(self.tool_prefix + '.' +tool)[fn]
        schema['input'].pop('self', None)
        params_format = ' '.join([f'<{k.upper()}>{v["type"]}</{k.upper()}>' for k,v in schema['input'].items()]) 
        fn_format = f'FN::{fn.upper()}'
        schema['format'] =  f'<{fn_format}>' + params_format + f'</{fn_format}>'
        return schema

    def tool(self, tool_name: str='cmd', prefix='dev.tool', *args, **kwargs) -> Any:
        """
        Execute a specific tool by name with provided arguments.
        
        Args:
            tool_name (str): The name of the tool to execute.
            *args: Positional arguments for the tool.
            **kwargs: Keyword arguments for the tool.
            
        Returns:
            Any: The result of the tool execution.
        """
        return c.module(prefix + '.'+tool_name)(*args, **kwargs).forward
