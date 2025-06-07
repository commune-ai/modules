
import time
import os
import json
import commune as c
from pathlib import Path
from typing import Dict, List, Union, Optional, Any, Tuple
from .utils import *
import commune as c

class Dev:

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

        """

    output_format = """
        make sure the params is a legit json string
        # <FN(fn_name)><PARAMS>JSON</PARAMS></FN(fn_name)>

        IF YOU NEED TO RUN THE TOOLS AND PAUSE SAY 
        <FN(review)><PARAMS></PARAMS></FN(review)> FOR review

        IF YOU NEED TO finish THE MARKOV DO 
        <FN(finish)><PARAMS></PARAMS></FN(finish)> FOR finishING

        CRITICAL NOTES:
            MAKE SURE YOU review BEFORE YOU WRITE ANYTHING
        IF YOU DO WELL, WE WILL GROW YOU, IF YOU FAIL, WE WILL DELETE YOU

        """

    prompt =  """
            --PARAMS--
            GOAL={goal}
            SOURCE={source} # THE SOURCE FILES YOU ARE TRYING TO MODIFY
            CONTENT={content} # THE FILES YOU ARE TRYING TO MODIFY
            QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
            TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE
            MAX_STEPS={steps} # THE MAX STEPS YOU ARE ALLOWED TO TAKE
            MIN_STEPS=1 # THE MIN STEPS YOU ARE ALLOWED TO TAKE
            HISTORY={history} # THE HISTORY OF THE AGENT
            TOOLS={toolbelt} # THE TOOLS YOU ARE ALLOWED TO USE 
            OUTPUT_FORMAT={output_format} # THE OUTPUT FORMAT YOU MUST FOLLOW STRICTLY
            --OUTPUT--
            YOU MUST STRICTLY RESPOND IN JSON NOW IN 3..2..1..GO
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
                source: str = './', 
                target = None,
                temperature: float = 0.5, 
                max_tokens: int = 1000000, 
                stream: bool = True,
                verbose: bool = True,
                content = None,
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
        query = self.preprocess(text=text, source=source, target=target)
        # Generate the response
        history = history if history else []
        model = model or self.model
        if module != None:
            print('Module  --> ', module)
            source = c.dirpath(module)
        for step in range(steps):

            try:
                for trial in range(trials):
                    try:
                        prompt =self.prompt.format(
                            goal=self.goal,
                            source=source,
                            content= self.content(source, query=query),
                            query=query,
                            toolbelt=self.toolbelt(),
                            history=history,
                            steps=steps,
                            target=target,
                            output_format=self.output_format
                        )
                        output = self.provider.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
                        output =  self.process(output)
                        history.append(output)
                        break
                    except Exception as e:
                        c.print(f"Error: {e}", color='red')
                        time.sleep(1)
                        output = detailed_error(e)
                        history.append(output)
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



    def process(self, output):
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
                try:
                    params = json.loads(params_str)
                except JSONDecodeError as e:
                    c.print(f"Error parsing params: {e}", color='red')
                    break
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





    def content(self, path: str = './', query=None, max_size=100000) -> List[str]:
        """
        Find files in a directory matching a specific pattern.
        
        Args:
            path (str): The directory to search in.
            pattern (str): The file pattern to match.
            
        Returns:
            List[str]: A list of file paths matching the pattern.
        """
        result = self.tool('select_files')(path=path, query=query)
        content = str(result)
        size = len(content)
        c.print(f"path={path} max_size={max_size} size={size}", color='cyan')

        if size > max_size:
            summarize = self.tool('summarize_file')
            new_results = {}
            f2k = {}
            for k, v in result.items():
                future = c.submit(summarize, {'content': v, "query": query})
                f2k[future] = k
            for future in c.as_completed(f2k):
                k = f2k[future]
                print(f"Processing {k}")
                v = future.result()
                new_results[k] = v

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

    def tools(self, tool_prefix='dev.tool') -> List[str]:
        return [t for t in  c.mods(search=tool_prefix) if t.startswith(tool_prefix)]
        
    def toolbelt(self) -> Dict[str, str]:
        """
        Map each tool to its schema.
        
        Returns:
            Dict[str, str]: Dictionary mapping tool names to their schemas.
        """
        toolbelt = {}
        tools = self.tools()
        for tool in tools:
            toolbelt[tool] = self.schema(tool)
            toolbelt[tool].pop('name', None)
            toolbelt[tool].pop('format', None)
        return toolbelt
    
    def schema(self, tool: str, fn='forward') -> Dict[str, str]:
        """
        Get the schema for a specific tool.
        
        Args:
            tool (str): The name of the tool.
        
        Returns:
            Dict[str, str]: The schema for the specified tool.
        """
        schema =  c.schema(tool)[fn]
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