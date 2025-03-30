import commune as c
import subprocess
import requests
import base64
import re
import os


class git:

    def __init__(self, path:str = '~/commune/commune/modules'):
        self.path = os.path.abspath(os.path.expanduser(path))
    def is_repo(self, path:str ):
        # has the .git folder
        return c.cmd(f'ls -a {path}').count('.git') > 0

    def diff(self, path:str = None):
        if path is None:
            path = self.path
        result =  c.cmd('git diff', verbose=False, cwd=path)
        # return path2diff
        path2diff = {}
        for line in result.split('\n'):
            if line.startswith('diff --git'):
                # get the file name
                path1 = line.split(' ')[2].split('/')[-1]
                path2 = line.split(' ')[3].split('/')[-1]
                path2diff[path1] = path2
        return None

    def push(cls, cwd=None, msg:str='update'):
        if cwd is None:
            cwd = c.path
        c.cmd(f'git add .', cwd=cwd)
        c.cmd(f'git commit -m "{msg}"', bash=True, cwd=cwd)
        c.cmd(f'git push', cwd=cwd)
        
    def git_repos(self, path='./'):
            import os
            repos = []
            for root, dirs, files in os.walk(path):
                for d in dirs:
                    if d.endswith('.git'):
                        repos +=  [f"{root}"]

            repos = [r for r in repos if not r == path]

            return repos

    def repo_url(self, path:str = None) -> str:
        lpath = self.get_path(path)
        return c.cmd('git remote -v',cwd=path, verbose=False).split('\n')[0].split('\t')[1].split(' ')[0]
    
    def commit_hash(self, path:str = None):
        path = self.get_path(path)
        return c.cmd('git rev-parse HEAD', cwd=path, verbose=False).split('\n')[0].strip()

    def reset_hard(self, path:str = None):
        path = self.get_path(path)
        return c.cmd('git reset --hard', cwd=path, verbose=False)
    
    def get_path(self, path:str = None):
        if path == None:
            path = self.path
        return path