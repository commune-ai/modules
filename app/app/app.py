import commune as c
import os

class App:

    def forward(self):
        self.api()
        self.app()
        
    def app(self, port=3000):
        self.api()
        cwd = c.dp('app')
        return os.system( f'cd {cwd} && docker compose up -d')

    def api(self, port=8000, free_mode=True):   
        return c.serve('api', port=port, free_mode=free_mode)
        