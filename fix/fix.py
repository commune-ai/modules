import commune as c

class fix: 

    agent = c.module('dev')()

    def needs_fixing_gate(self, output):
        prompt = f"""
        You are a docker-compose fix.
        {output}
        Fix the docker-compose file if it is broken.
        If it is not broken, say "NEEDSFIXING".
        respond in the following format:
        json(state = 'NEEDSFIXING' or 'ITSFINE')
        """
        response = ''
        print('Seeing if you need fixing...')
        for ch in self.agent.model.forward(prompt, stream=1):
            print(ch, end='', flush=True)
            response += ch
        pass_gate = 'NEEDSFIXING' in response
        return pass_gate


    def forward(self, cmd = 'docker-compose up -d', *extra_cmds,  path='./'):
        cmd = ' '.join([cmd] + list(extra_cmds))

        output = c.cmd(cmd, verbose=1)
        print(output)
        needs_fixing = self.needs_fixing_gate(output)
        if not needs_fixing:
            return {'output': output, 'cmd': cmd}
        return  self.agent.forward(f'fix it given {output} and {cmd}', to=path)
