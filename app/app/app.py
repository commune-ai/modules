import commune as c
import os


class App:
    def forward(self, ports = {'api': 8000, 'app': 3000}):
        c.cmd(f'c serve api port={ports["api"]}')
        cwd = c.dp('app')
        cmd_cwd = f'cd {cwd}'
        cmd_api = f'c serve api port={ports["api"]} free_mode=1'
        cmd_app = f'docker compose up -d'
        cmd = f'{cmd_cwd} && {cmd_api} && {cmd_app}'
        return os.system(cmd)
        