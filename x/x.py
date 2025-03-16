
import commune as c
class x: 

    def forward(self, module=None):
        code = c.code(module)
        prompt = {
            'code': code,
            'task': 'make a dank tweet about this for the vibes'
        }

        return c.chat(prompt, process_text=False)