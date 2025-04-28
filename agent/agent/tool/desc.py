import commune as c 
class Desc:

    def __init__(self, agent='agent'):
        self.agent = c.module(agent)()

    def resolve_path(self, path):
        return c.get_path('~/.commune/agent/desc/' + path)
        
    def forward(self, module, max_age=None):
        """
        DESCRIBE THE MODULE
        """
        code= c.code(module)
        code_hash = c.hash(code)
        path = self.resolve_path(f'summary/{module}/{code_hash}.json')
        output = c.get(path, max_age=max_age)
        anchors = ['<JSON_START>', '<JSON_END>']

        if output == None:
            prompt = {
                    "task": "summarize the following into tupples and make sure you compress as much as oyu can",
                    "code": code,
                    'output_fomrt': f'DICT[fn:str, desc:str]] BETWEEN {anchors[0]} AND {anchors[1]}',
                    "hash": code_hash,
                    }
            output = ''
            for ch in self.agent.forward(str(prompt), preprocess=False):
                output += ch
                print(ch, end='')
            c.put(path, output)
    
        output = output.split(anchors[0])[1].split(anchors[1])[0]
        print('Writing to path -->', path)
        return output
