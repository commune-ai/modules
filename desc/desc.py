import commune as c
import os
import json

class Desc:
    public_functions = ["generate", "info"]
    def __init__(self, 
                 model='anthropic/claude-3.5-sonnet',
                 path = '~/.commune/desc',
                **kwargs):
        
        self.path = c.abspath(path)
        self.model = c.module('model.openrouter')(model=model, **kwargs)


    def resolve_path(self, path):
        return os.path.join(self.path, path)

    def forward(self, module, fn , params,key):
        return c.call(module + '/' + fn, params, key=key)

    def forward(self,   
                module='store', 
                task= 'summarize the following in the core pieces of info and ignore the rest',
                max_age=200,
                cache=True,
                update=False,
                 **kwargs):
                 
        code  = c.code(module)
        code_hash =  c.hash(code)
        path = self.resolve_path(module)
        result = c.get(path, max_age=max_age, update=update)
        if cache and result != None:
            print(f'Found {module} in cache')
            return result
    
        anchors = ['<JSONSTART>', '<JSONEND>']
        text = f"""
        --CONTEXT--
        {code}
        --TASK--
        {task}
        --FORMAT--
        in json format please DICT(key->aboutkey) WHERE KEY IS THE OBJECT OF INTEREST AND VALUE IS THE VALUE
        DO IT BETWEEN THESE TAGS FOR PARSING
        {anchors[0]}
        DICT(key:value)
        {anchors[1]}
        """
        output = ''
        for ch in self.model.generate(text, stream=1, **kwargs):
            output += ch
            print(ch, end='')
        
        output =  json.loads(output.split(anchors[0])[-1].split(anchors[1])[0])
        c.put(path, output)
        return output




