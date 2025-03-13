import commune as c

class Readme:
    def forward(self, module='store'):
        code = c.code(module)
        path = c.dirpath(module) + '/README.md'
        readme = c.get_text(path, default=None)
        if readme:
            c.print(f"README file already exists for module {module}", color='yellow')
            return readme

        prompt = f'''
        Generate a README file for a Python module.
        CODE: {code}
        OUTPUT_FORMAT: 
        <<START_OUTPUT>>
        text
        <<END_OUTPUT>>
        08
        '''
        response =  c.ask(prompt, process_text=False)
        output = ''
        for ch in response:
            print(ch, end='')
            output += str(ch)
        c.put_text(path, output)

        return response

    