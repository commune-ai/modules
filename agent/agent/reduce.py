 
    


import os
import json
import commune as c


class Reduce:
    def __init__(self, agent='agent'):
        self.agent = c.module(agent)()
    def forward(self, text, max_chars=10000 , timeout=40, max_age=30, model='openai/o1-mini'):
        if os.path.exists(text): 
            path = text
            if os.path.isdir(path):
                print('REDUCING A DIRECTORY -->', path)
                future2path = {}
                path2result = {}
                paths = c.files(path)
                progress = c.tqdm(len(paths), desc='Reducing', leave=False)
                while len(paths) > 0:
                    for p in paths:
                        future = c.submit(self.reduce, [p], timeout=timeout)
                        future2path[future] = p
                    try:
                        for future in c.as_completed(future2path, timeout=timeout):
                            p = future2path[future]
                            r = future.result()
                            paths.remove(p)
                            path2result[p] = r
                            print('REDUCING A FILE -->', r)
                            progress.update(1)
                    except Exception as e:
                        print(e)
                return path2result
            else:
                assert os.path.exists(path), f'Path {path} does not exist'
                print('REDUCING A FILE -->', path)
                text = str(c.get_text(path))
        elif c.module_exists(text):
            text = c.code(text)

        original_length = len(text)
        code_hash = c.hash(text)
        path = f'summary/{code_hash}' 

        text = f'''
        GOAL
        summarize the following into tupples and make sure you compress as much as oyu can
        CONTEXT
        {text}
        OUTPUT FORMAT ONLY BETWEEN THE TAGS SO WE CAN PARSE
        <OUTPUT>DICT(data=List[Dict[str, str]])</OUTPUT>
        '''
        if len(text) >= max_chars * 2 :
            batch_text = [text[i:i+max_chars] for i in range(0, len(text), max_chars)]
            futures =  [c.submit(self.reduce, [batch], timeout=timeout) for batch in batch_text]
            output = ''
            try:
                for future in c.as_completed(futures, timeout=timeout):
                    output += str(future.result())
            except Exception as e:
                print(e)
            final_length = len(text)
            result = { 'compress_ratio': final_length/original_length, 
                      'final_length': final_length, 
                      'original_length': original_length, 
                      "data": text}
            return result
        if "'''" in text:
            text = text.replace("'''", '"""')
        
        data =  c.ask(text, model=model, stream=0)
        def process_data(data):
            try:
                data = data.split('<OUTPUT>')[1].split('</OUTPUT>')[0]
                return data
            except:
                return data
        return {"data": process_data(data)}
