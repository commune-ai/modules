
import commune as c
import os
class x: 

    def forward(self, module=None):
        code = c.code(module)
        prompt = {
            'code': code,
            'task': 'make a dank tweet about this for the vibes include the path and score it out of 100 vibes',
            'gith path': self.git_path(module=module),
        }


        return c.chat(prompt, process_text=False)

    def git_path(self, module='module', branch='main'):
        """
        Get the git path of the module.
        """
        dirpath =  c.dirpath(module)
        if dirpath.split('/')[-1] == c.repo_name:
            dirpath = os.path.dirname(dirpath)
        git_path = ''

        while len(dirpath.split('/')) > 0:
            git_config_path = dirpath + '/.git/config'
            if os.path.exists(git_config_path):
                git_url = c.get_text(git_config_path).split('url = ')[-1].strip().split('\n')[0]
                if git_url.endswith('.git'):
                    git_url = git_url[:-4]
                break
            else:
                git_path += dirpath.split('/')[-1]
                dirpath = os.path.dirname(dirpath)
        # get branch
        branch = c.get_text(dirpath + '/.git/HEAD').split('/')[-1].strip()
        return git_url +f'/tree/{branch}/' +git_path