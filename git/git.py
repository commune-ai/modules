import commune as c
import subprocess
import requests
import base64
import re
import pandas as pd
import os

class git:

    def __init__(self, path:str = './'):
        self.path = os.path.abspath(os.path.expanduser(path))
    def is_repo(self, path:str ):
        # has the .git folder
        return c.cmd(f'ls -a {path}').count('.git') > 0

    def push(self, path=None, msg:str='update', safety=True):
        path = self.get_path(path)
        cmds = ['git add .', f'git commit -m "{msg}"', 'git push']
        if safety:
            # check if the commands are safe to run
            if input(f'Do you want to run these cmds {cmds}?') != 'y':
                return {'status': 'cancelled', 'cmds': cmds}
        for cmd in cmds:
            c.cmd(cmd, cwd=cwd)
        return {
            'status': 'success',
            'cmds': cmds,
        }

    def gitpath(self, path:str = './'):
        """
        find the closest git path to the current path
        
        """
        import os
        paths = []
        for root, dirs, files in os.walk(path):
            if '.git' in dirs:
                paths.append(root)
                continuec

        return paths

    
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
    
    def hash(self, path:str = None):
        path = self.get_path(path)
        return c.cmd('git rev-parse HEAD', cwd=path, verbose=False).split('\n')[0].strip()

    def history(self, path:str = None):
        """
        a history ofo the commits and the times
        """
        path = self.get_path(path)
        result = c.cmd('git log', cwd=path, verbose=False)
        return result

    def reset_hard(self, path:str = None):
        path = self.get_path(path)
        return c.cmd('git reset --hard', cwd=path, verbose=False)
    
    def get_path(self, path:str = None):
        if path == None:
            path = self.path
        return path

    def commit_hash(self, lib_path:str = None):
        if lib_path == None:
            lib_path = self.lib_path
        return c.cmd('git rev-parse HEAD', cwd=lib_path, verbose=False).split('\n')[0].strip()
    
    def get_info(self, path:str = None, name:str = None, n=10):
        path = path or c.modules_path
        git_path = path + '/.git'
        git_url = c.cmd('git config --get remote.origin.url', cwd=path).strip().split('\n')[0].strip().split(' ')[0].strip()
        git_branch = c.cmd('git rev-parse --abbrev-ref HEAD', cwd=path).strip().split('\n')[0].strip().split(' ')[0].strip()
        git_commit = c.cmd('git rev-parse HEAD', cwd=path)
        git_commit = git_commit.split('\n')[0].strip().split(' ')[0].strip()
        past_commits = c.cmd('git log --oneline', cwd=path).split('\n')
        # get all of the info of each commit
        past_commits = past_commits[:n]
        commit2comment = {}
        for co in past_commits:
            if len(co) == 0:
                continue
            commit, comment = co.split(' ', 1)
            commit2comment[commit] = comment
        print(past_commits)
        return {
            'url': git_url,
            'branch': git_branch,
            'commit': git_commit,
            'past_commits': commit2comment,
        }
        
    def commits(self, path: str = None, n: int = 10,features=['date', 'additions', 'deletions']) -> pd.DataFrame:
        """
        Get a DataFrame of commits with comment, time, and number of additions/deletions.
        
        Args:
            path: Path to the git repository. Defaults to self.path.
            n: Number of commits to retrieve. Defaults to 10.
            
        Returns:
            pandas DataFrame with commit information.
        """
        import pandas as pd
        
        path = self.get_path(path)
        
        # Get commit hashes, authors, dates, and messages
        log_format = "%H|%an|%ad|%s"
        log_cmd = f'git log --pretty=format:"{log_format}" -n {n}'
        log_result = c.cmd(log_cmd, cwd=path, verbose=False).split('\n')
        
        # Get stats for each commit
        stats_cmd = f'git log --numstat --pretty=format:"%H" -n {n}'
        stats_result = c.cmd(stats_cmd, cwd=path, verbose=False).split('\n')
        
        # Process the results
        commits = []
        current_commit = None
        additions = 0
        deletions = 0
        
        for line in stats_result:
            if line.strip():
                if len(line) == 40:  # This is a commit hash
                    current_commit = line
                    additions = 0
                    deletions = 0
                else:
                    # This is a stats line
                    parts = line.strip().split('\t')
                    if len(parts) == 3:
                        try:
                            additions += int(parts[0]) if parts[0] != '-' else 0
                            deletions += int(parts[1]) if parts[1] != '-' else 0
                        except ValueError:
                            pass
                        
                        # Store the stats for this commit
                        for log_line in log_result:
                            if log_line.startswith(current_commit):
                                hash_val, author, date, message = log_line.split('|', 3)
                                if hash_val == current_commit:
                                    commits.append({
                                        'hash': hash_val,
                                        'author': author,
                                        'date': date,
                                        'message': message,
                                        'additions': additions,
                                        'deletions': deletions
                                    })
                                    break
        
        # Create DataFrame
        if not commits:
            # Alternative approach if the above didn't work
            commits = []
            for line in log_result:
                if not line.strip():
                    continue
                hash_val, author, date, message = line.split('|', 3)
                # Get stats for this specific commit
                stat_cmd = f'git show --numstat --format="%h" {hash_val}'
                stat_output = c.cmd(stat_cmd, cwd=path, verbose=False).split('\n')
                
                add = 0
                delete = 0
                for stat_line in stat_output[1:]:  # Skip the first line which is the commit hash
                    parts = stat_line.strip().split('\t')
                    if len(parts) == 3:
                        try:
                            add += int(parts[0]) if parts[0] != '-' else 0
                            delete += int(parts[1]) if parts[1] != '-' else 0
                        except ValueError:
                            pass
                
                commits.append({
                    'hash': hash_val,
                    'author': author,
                    'date': date,
                    'message': message,
                    'additions': add,
                    'deletions': delete
                })

        
        df =  pd.DataFrame(commits)
        # remove duplicate hashes and add the additions and deletionsa and group by the hash

        df = df.groupby('hash').agg({
            'author': 'first',
            'date': 'first',
            'message': 'first',
            'additions': 'sum',
            'deletions': 'sum'
        }).reset_index()

        # order by date
        df = df.sort_values('date', ascending=False)
        df['date'] = pd.to_datetime(df['date'])
        df['date'] = df['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
        df['date'] = pd.to_datetime(df['date'])
        df['date'] = df['date'].dt.tz_localize('UTC').dt.tz_convert('Asia/Calcutta')
        print('Repo(url={url}, branch={branch}, commit={commit})'.format( 
            url=self.repo_url(path),
            branch=self.branch(path),
            commit=self.commit_hash(path)
        ))
        return df[features]
    
    def gitpath(self, path, **kwargs) -> str:
        """
        find the github url of a module
        """
        while len(path.split('/')) > 1:
            path = '/'.join(path.split('/')[:-1])
            git_path = path + '/.git'
            if os.path.exists(git_path):
                return git_path
        return None

    def giturl(self, url:str='commune-ai/commune'):
        gitprefix = 'https://github.com/'
        gitsuffix = '.git'
        if not url.startswith(gitprefix):
            url = gitprefix + url
        if not url.endswith(gitsuffix):
            url = url + gitsuffix
        return url

    def diff(self, path:str = None, relative=False):
        """
        Get the diff of files in a git repository.
        
        Args:
            path: Path to the git repository. Defaults to self.path.
            relative: If True, returns relative paths. If False, returns absolute paths.
            
            
        Returns:
            Dictionary mapping file paths to their diffs.
        """
        if path is None:
            path = self.path
        
        # Run git diff command
        response = c.cmd('git diff', cwd=path, verbose=False)

        # return the diff

        # process this to get the path2diff where the diff is the addiitons and deletions
        diff = {}
        for chunk in response.split('diff --git'):
            # get the path
            lines = chunk.split('\n')
            if len(lines) < 2:
                continue
            if len(lines[0].split(' ')) < 3:
                continue
            diff[lines[0].split(' ')[2][2:]] = '\n'.join(lines[1:])
        diff = {k: v for k,v in diff.items()}
        return diff
    def dff(self, path='./'):
        diff = self.diff(path)
        df  = []
        for k,v in diff.items():
            df.append({
                'path': k,
                'additions': len(re.findall(r'\+', v)),
                'deletions': len(re.findall(r'-', v)),
                # 'hash': c.hash(v),
            })

        df = pd.DataFrame(df)
        return df
            
    def branch(self, path=None):
        path = self.get_path(path)
        return c.cmd('git rev-parse --abbrev-ref HEAD', cwd=path).strip().split('\n')[0].strip().split(' ')[0].strip()

    def init_repo(
        repo_path: str, 
        user_name: str = None, 
        user_email: str = None,
        initial_branch: str = "main",
        verbose: bool = False
    ) -> str:
        """
        Initialize a Git repository with optional configuration.
        
        Args:
            repo_path (str): Path where the Git repository should be initialized
            user_name (str, optional): Git user name for this repository
            user_email (str, optional): Git user email for this repository
            initial_branch (str, optional): Name of the initial branch
            verbose (bool): Whether to print command output
            
        Returns:
            str: Command output
        """
        import os
        
        # Create directory if it doesn't exist
        os.makedirs(repo_path, exist_ok=True)
        
        # Initialize the repository with specified branch name
        result = cmd(f"git init -b {initial_branch}", cwd=repo_path, verbose=verbose)
        
        # Configure user if provided
        if user_name:
            cmd(f"git config user.name '{user_name}'", cwd=repo_path, verbose=verbose)
        
        if user_email:
            cmd(f"git config user.email '{user_email}'", cwd=repo_path, verbose=verbose)
        
        # Create initial README and commit
        with open(os.path.join(repo_path, "README.md"), "w") as f:
            f.write(f"# {os.path.basename(repo_path)}\n\nInitialized with Python.")
        
        cmd("git add README.md", cwd=repo_path, verbose=verbose)
        cmd("git commit -m 'Initial commit'", cwd=repo_path, verbose=verbose)
        
        return result