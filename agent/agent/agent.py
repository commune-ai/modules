import commune as c
import os
import json

class Agent:
    def __init__(self, 
                 model='google/gemini-2.5-pro-exp-03-25:free',
                 tools = ['put_text',   
                            'files', 
                            'file2text', 
                            'get_text', 
                            'get_json', 
                            'put_json', 
                            'ls', 
                            'glob'],
                 max_tokens=420000, 
                 prompt = 'The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.',
                **kwargs):
        
        self.max_tokens = max_tokens
        self.prompt = prompt
        self.model = c.module('model.openrouter')(model=model, **kwargs)

    def forward(self, text = 'whats 2+2?' ,  
                    temperature= 0.5,
                    max_tokens= 1000000, 
                    preprocess=True,
                    stream=True,
                    **kwargs):
        if preprocess:
            text = self.preprocess(text)
        params = {'message': text, 'temperature': temperature, 'max_tokens': max_tokens,  'stream': stream, **kwargs}
        return self.model.forward(**params)

    def ask(self, *text, **kwargs): 
        return self.forward(' '.join(list(map(str, text))), **kwargs)

    def models(self, *args, **kwargs):
        return self.model.models(*args,**kwargs)

    def resolve_path(self, path):
        return os.path.expanduser('~/.commune/agent/' + path)



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
        