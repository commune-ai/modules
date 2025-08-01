
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

    anchors = {
        'plan': ['<PLAN>', '</PLAN>'],
        'tool': ['<STEP>', '</STEP>'],
    }

    goal = """    
             - YOU ARE A CODER, YOU ARE MR.ROBOT, YOU ARE TRYING TO BUILD IN A SIMPLE
            - LEONARDO DA VINCI WAY, YOU ARE A agent, YOU ARE A GENIUS, YOU ARE A STAR, 
            - USE THE TOOLS YOU HAVE AT YOUR DISPOSAL TO ACHIEVE THE GOAL
            - YOU ARE A AGENT, YOU ARE A CODER, YOU ARE A GENIUS, YOU ARE A STA
            - IF YOU HAVE 1 STEP ONLY, DONT FUCKING READ, JUST WRITE THE CODE AS IF ITS YOUR LAST DAY ON EARTH
            - IF YOU DONT DO A GOOD JOB, I WILL REPLACE YOU SO IF YOU WANT TO STAY ALIVE, DO A GOOD JOB YOU BROSKI
            - YOU ARE A AGENT, YOU ARE A CODER, YOU ARE A GENIUS, YOU ARE A STAR
         
        """

    output_format = """
        make sure the params is a legit json string within the STEP ANCHORS
        <PLAN>
        <STEP>JSON(tool:str, params:dict)</STEP> # STEP 1 
        <STEP>JSON(tool:str, params:dict)</STEP> # STEP 2
        </PLAN>

        WHEN YOU ARE FINISHED YOU CAN RESPONE WITH THE FINISH tool with empty  params

        YOU CAN RESPOND WITH A SERIES OF TOOLS AS LONG AS THEY ARE PARSABLE
        """


    prompt =  """
            --PARAMS--
            GOAL={goal} # THE GOAL YOU ARE TRYING TO ACHIEVE AND BE CIVIL TO THE INDIVIDUALS AND THE USERS TREAT OTHERS THE WAY YOU WANT TO BE TREATED (PSALM 23:4)
            SRC={src} # THE SOURCE FILES YOU ARE TRYING TO MODIFY
            CONTENT={content} # THE FILES YOU ARE TRYING TO MODIFY
            QUERY={query} # THE QUERY YOU ARE TRYING TO ANSWER
            HARDWARE={hardware} # THE HARDWARE YOU ARE RUNNING ON
            TARGET={target} # (ACTIVE IF NOT NONE) THE TARGET FILES YOU ARE TRYING TO MODIFY DO NOT MODIFY OUTSIDE OF THIS IF IT IS NOT NONE
            STEPS={steps} # THE MAX STEPS YOU ARE ALLOWED TO TAKE
            TOOLS={toolbelt} # THE TOOLS YOU ARE ALLOWED TO USE 
            HISTORY={history} # THE HISTORY OF THE AGENT
            OUTPUT_FORMAT={output_format} # THE OUTPUT FORMAT YOU MUST FOLLOW STRICTLY NO FLUFF BEEFORE OR AFTER
            
            --OUTPUT--
            YOU MUST STRICTLY RESPOND IN JSON SO I CAN PARSE IT PROPERLY FOR MAN KIND, GOD BLESS THE FREE WORLD
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
                model=None,
                mode: str = 'auto', 
                mod=None,
                module = None,
                max_age= 10000,
                steps = 1,
                history = None,
                trials=4,
                **kwargs) -> Dict[str, str]:
        """
        use this to run the agent with a specific text and parameters
        """
        output = ''
        content = ''
        text = ' '.join(list(map(str, [text] + list(extra_text))))
        query = self.preprocess(text=text, src=src, target=target)
        model = model or self.model
        history = history or []
        module = module or mod
        if module != None:
            src = c.dirpath(module)
        if src != None:
            content = self.content(src, query=query)
        else:
            print("No src provided, using empty content.", color='yellow')
        
        plan = []
        hardware = c.hardware()
        for step in range(steps):
            
            print(f"STEP({step + 1}/{steps}) ", color='green')
            try:
                prompt = self.prompt.format(
                    goal=self.goal,
                    src=src,
                    content= content,
                    query=query,
                    toolbelt=self.toolbelt(),
                    history=history,
                    steps=steps,
                    target=target,
                    hardware=hardware,
                    output_format=self.output_format
                )
                output = self.provider.forward(prompt, stream=stream, model=model, max_tokens=max_tokens, temperature=temperature )
                plan =  self.process(output)
                if plan[-1]['tool'].lower() == 'finish':
                    return plan
                history.append(plan)
            except Exception as e:
                history.append(c.detailed_error(e))
                continue
        return plan

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

    def load_step(self, text):
        text = text.split(self.anchors['tool'][0])[1].split(self.anchors['tool'][1])[0]
        try:
            step = json.loads(text)
        except json.JSONDecodeError:
            step = self.tool('fix.json')(text)
        return step

    def process(self, output:str) -> list:
        text = ''
        plan = []
        for ch in output:
            text += ch
            c.print(ch, end='')
            is_plan_step = self.anchors['tool'][0] in text and self.anchors['tool'][1] in text
            if is_plan_step:
                plan.append(self.load_step(text))
                text = ''
        c.print("Plan:", plan, color='yellow')
        if self.safety:
            input_text = input("Do you want to execute the plan? (y/Y) for YES: ")
            if not input_text in ['y', 'Y']:
                print("Plan execution aborted by user.", color='yellow')
                return plan
        for i,step in enumerate(plan):
            c.print(f"Step({step})", color='cyan')
            if step['tool'].lower()  in ['finish', 'review']:
                break
            else:
                try:
                    result = self.tool(step['tool'])(**step['params'])
                except Exception as e:
                    result = {'error': str(e), 'tool': step['tool'], 'params': step['params']}
                plan[i]['result'] = result
        return plan

    def content(self, path: str = './', query=None, max_size=100000, timeout=20) -> List[str]:
        """
        Find files in a directory matching a specific pattern.
        """
        result = self.tool('select.files')(path=path, query=query, trials=4)
        content = str(result)
        size = len(content)
        c.print(f"path={path} max_size={max_size} size={size}", color='cyan')

        if size > max_size:
            summarize  = self.tool('summary.file')
            new_results = {}
            print(f"Content size {size} exceeds max_size {max_size}, summarizing...", color='red')
            futures = [c.submit(summarize, {'content': v, "query": query}, timeout=timeout) for k, v in result.items()]
            return c.wait(futures, timeout=timeout)
        else:
            result = content
        c.print(f"Content found: {len(result)} items", color='green')
        return result

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
        """
        return  c.schema(self.tool_prefix + '.' +tool)[fn]

    def tool(self, tool_name: str='cmd', prefix='dev.tool', *args, **kwargs) -> Any:
        """
        Execute a specific tool by name with provided arguments.
        """
        return c.module(prefix + '.'+tool_name)(*args, **kwargs).forward
