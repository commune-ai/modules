
import os
import pandas as pd
from typing import List, Dict, Union, Optional, Any
import commune as c
import subprocess
import json

import pandas as pd
import subprocess
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime


class Docker:
    """
    A module for interacting with Docker.
    """
    default_shm_size = '100g'
    default_network = 'host'

    def __init__(self):
        pass

    def build(self,
              path: Optional[str] = './',
              tag: Optional[str] = None,
              sudo: bool = False,
              verbose: bool = True,
              no_cache: bool = False,
              env: Dict[str, str] = {}) -> Dict[str, Any]:
        """
        Build a Docker image from a Dockerfile.

        Args:
            path (Optional[str]): Path to the Dockerfile. Defaults to None.
            tag (Optional[str]): Tag for the image. Defaults to None.
            sudo (bool): Use sudo. Defaults to False.
            verbose (bool): Enable verbose output. Defaults to True.
            no_cache (bool): Disable cache during build. Defaults to False.
            env (Dict[str, str]): Environment variables. Defaults to {}.

        Returns:
            Dict[str, Any]: A dictionary containing the status, tag, and result of the build.
        """
        path = os.path.abspath(path)
        tag = tag or path.split('/')[-2]
        cmd = f'docker build -t {tag} .'
        if no_cache:
            cmd += ' --no-cache'
        return c.cmd(cmd,  cwd=path)

    def run(self,
            image: str = './',
            cmd: Optional[str] = None,
            volumes: Optional[Union[List[str], Dict[str, str], str]] = None,
            name: Optional[str] = None,
            gpus: Union[List[int], str, bool] = False,
            shm_size: str = '100g',
            entrypoint = 'tail -f /dev/null',
            sudo: bool = False,
            build: bool = True,
            ports: Optional[Dict[str, int]] = None,
            net: str = 'host',
            daemon: bool = True,
            cwd: Optional[str] = None,
            env_vars: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Run a Docker container with advanced configuration options.

        Args:
            path (str): Path to Dockerfile or image name.
            cmd (Optional[str]): Command to run in container.
            volumes (Optional[Union[List[str], Dict[str, str], str]]): Volume mappings.
            name (Optional[str]): Container name.
            gpus (Union[List[int], str, bool]): GPU configuration.
            shm_size (str): Shared memory size.
            sudo (bool): Use sudo.
            build (bool): Build image before running.
            ports (Optional[Dict[str, int]]): Port mappings.
            net (str): Network mode.
            daemon (bool): Run in daemon mode.
            cwd (Optional[str]): Working directory.
            env_vars (Optional[Dict[str, str]]): Environment variables.

        Returns:
            Dict[str, Any]: A dictionary containing the command and working directory.
        """

        self.kill(name)
        dcmd = ['docker', 'run']
        dcmd.extend(['--net', net])
        # Handle GPU configuration
        if isinstance(gpus, list):
            dcmd.append(f'--gpus "device={",".join(map(str, gpus))}"')
        elif isinstance(gpus, str):
            dcmd.append(f'--gpus "{gpus}"')
        elif gpus is True:
            dcmd.append(f'--gpus all')
        # Configure shared memory
        if shm_size:
            dcmd.extend(['--shm-size', shm_size])
        # Handle port mappings
        if ports:
            if isinstance(ports, list):
                ports = {port: port for port in ports}
            for host_port, container_port in ports.items():
                dcmd.extend(['-p', f'{host_port}:{container_port}'])
            
        # Handle volume mappings
        if volumes:
            if isinstance(volumes, str):
                volumes = [volumes]
            elif isinstance(volumes, dict):
                volumes = [f'{k}:{v}' for k, v in volumes.items()]
            for volume in volumes:
                dcmd.extend(['-v', volume])

        # Handle environment variables
        if env_vars:
            for key, value in env_vars.items():
                dcmd.extend(['-e', f'{key}={value}'])

        # Set container name
        if name:
            dcmd.extend(['--name', name])

        # # Add command if specified
        # if entrypoint: 
        #     dcmd.extend(f' --entrypoint {entrypoint}')

        # Add command if specified
        if cmd:
            dcmd.append(cmd)

        if daemon:
            dcmd.append('-d')

        # Add image name
        dcmd.append(image)
        command_str = ' '.join(dcmd)
        return c.cmd(command_str, verbose=True)

    def exists(self, name: str) -> bool:
        return name in self.ps()
        
    def kill(self, name: str, sudo: bool = False, verbose: bool = True, prune: bool = False) -> Dict[str, str]:
        """
        Kill and remove a container.

        Args:
            name (str): The name of the container.
            sudo (bool): Use sudo.
            verbose (bool): Enable verbose output.
            prune (bool): Prune unused Docker resources.

        Returns:
            Dict[str, str]: A dictionary containing the status and name of the container.
        """
        try:
            c.cmd(f'docker kill {name}', sudo=sudo, verbose=verbose)
            c.cmd(f'docker rm {name}', sudo=sudo, verbose=verbose)
            if prune:
                self.prune()
            return {'status': 'killed', 'name': name}
        except Exception as e:
            return {'status': 'error', 'name': name, 'error': str(e)}

    def kill_all(self, sudo: bool = False, verbose: bool = True) -> Dict[str, str]:
        """
        Kill all running containers.

        Args:
            sudo (bool): Use sudo.
            verbose (bool): Enable verbose output.

        Returns:
            Dict[str, str]: A dictionary indicating the status of the operation.
        """
        try:
            for container in self.ps():
                self.kill(container, sudo=sudo, verbose=verbose)
            return {'status': 'all_containers_killed'}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    def images(self, to_records: bool = True) -> Union[pd.DataFrame, Any]:
        """
        List all Docker images.

        Args:
            to_records (bool): Convert to records.

        Returns:
            Union[pd.DataFrame, Any]: A DataFrame or records of Docker images.
        """
        try:
            text = c.cmd('docker images', verbose=False)
            rows = []
            cols = []

            for i, line in enumerate(text.split('\n')):
                if not line.strip():
                    continue
                if i == 0:
                    cols = [col.strip().lower().replace(' ', '_') for col in line.split() if col]
                else:
                    rows.append([col.strip() for col in line.split() if col])

            df = pd.DataFrame(rows, columns=cols)
            return df.to_records() if to_records else df
        except Exception as e:
            c.print(f"Error listing images: {e}", color='red')
            return {'status': 'error', 'error': str(e)}

    def logs(self,
             name: str,
             sudo: bool = False,
             follow: bool = False,
             verbose: bool = False,
             tail: int = 100,
             since: Optional[str] = None) -> str:
        """
        Get container logs with advanced options.

        Args:
            name (str): The name of the container.
            sudo (bool): Use sudo.
            follow (bool): Follow the logs.
            verbose (bool): Enable verbose output.
            tail (int): Number of lines to tail.
            since (Optional[str]): Show logs since timestamp.

        Returns:
            str: The container logs.
        """
        cmd = ['docker', 'logs']

        if follow:
            cmd.append('-f')
        if tail:
            cmd.extend(['--tail', str(tail)])
        if since:
            cmd.extend(['--since', since])

        cmd.append(name)
        try:
            return c.cmd(' '.join(cmd), verbose=verbose)
        except Exception as e:
            return f"Error fetching logs: {e}"

    def prune(self, all: bool = False) -> str:
        """
        Prune Docker resources.

        Args:
            all (bool): Prune all unused resources.

        Returns:
            str: The result of the prune command.
        """
        cmd = 'docker system prune -f' if all else 'docker container prune -f'
        try:
            return c.cmd(cmd)
        except Exception as e:
            return f"Error pruning: {e}"

    def get_path(self, path: str) -> str:
        return os.path.expanduser(f'~/.commune/docker/{path}')

    def stats(self, max_age=60, update=False) -> pd.DataFrame:
        """
        Get container resource usage statistics.

        Args:
            container (Optional[str]): The name of the container.

        Returns:
            pd.DataFrame: A DataFrame containing the container statistics.
        """
        path = self.get_path(f'container_stats.json')
        stats = c.get(path, [], max_age=max_age, update=update)
        if len(stats) == 0:
            cmd = f'docker stats --no-stream'
            output = c.cmd(cmd, verbose=False)
            lines = output.split('\n')
            headers = lines[0].split('  ')
            lines = [line.split('   ') for line in lines[1:] if line.strip()]
            lines = [[col.strip().replace(' ', '') for col in line if col.strip()] for line in lines]
            headers = [header.strip().replace(' %', '') for header in headers if header.strip()]
            data = pd.DataFrame(lines, columns=headers)
            stats = []
            for k, v in data.iterrows():
                row = {header: v[header] for header in headers}
                if 'MEM USAGE / LIMIT' in row:
                    mem_usage, mem_limit = row.pop('MEM USAGE / LIMIT').split('/')
                    row['MEM_USAGE'] = mem_usage
                    row['MEM_LIMIT'] = mem_limit
                c.print(row)
                row['ID'] = row.pop('CONTAINER ID')

                for prefix in ['NET', 'BLOCK']:
                    if f'{prefix} I/O' in row:
                        net_in, net_out = row.pop(f'{prefix} I/O').split('/')
                        row[f'{prefix}_IN'] = net_in
                        row[f'{prefix}_OUT'] = net_out
                
                row = {_k.lower(): _v for _k, _v in row.items()}
                stats.append(row)
                c.put(path, stats)
            
        return c.df(stats)

    def ps(self) -> List[str]:
        """
        List all running Docker containers.

        Returns:
            List[str]: A list of container names.
        """
        try:
            text = c.cmd('docker ps')
            ps = []
            for i, line in enumerate(text.split('\n')):
                if not line.strip():
                    continue
                if i > 0:
                    parts = line.split()
                    if len(parts) > 0:  # Check if there are any parts in the line
                        ps.append(parts[-1])
            return ps
        except Exception as e:
            c.print(f"Error listing containers: {e}", color='red')
            return []

    def exec(self, name: str, cmd: str ,  *extra_cmd) -> str:
        """
        Execute a command in a running Docker container.

        Args:
            name (str): The name of the container.
            cmd (str): The command to execute.

        Returns:
            str: The output of the command.
        """
        if len(extra_cmd) > 0:
            cmd = ' '.join([cmd] + list(extra_cmd))
        
        return c.cmd(f'docker exec {name} bash -c "{cmd}"')
    # def stats(self, max_age=1000, update=False) -> Dict[str, Any]:
    #     path = c.abspath('~/.docker/docker_stats.json')
    #     name2stats = c.get(path, {}, max_age=max_age, update=update)
    #     if len(name2stats) == 0:
    #         future2name = {}
    #         for name in self.ps():
    #             f = c.submit(self.container_stats, [name])
    #             future2name[f] = name
    #         for future in future2name:
    #             name = future2name[future]  
    #             name2stats[name] = future.result()
    #             print(name, name2stats[name])
    #         c.put(path, name2stats)
    #     return list(name2stats.values())


    def cstats(self, max_age=10, update=False, cache_dir="./docker_stats") -> pd.DataFrame:
        """
        Get resource usage statistics for all containers.

        Args:
            max_age (int): Maximum age of cached data in seconds
            update (bool): Force update of data
            cache_dir (str): Directory to store cached data

        Returns:
            pd.DataFrame: A DataFrame containing statistics for all containers
        """
        # Create cache directory if it doesn't exist
        os.makedirs(cache_dir, exist_ok=True)
        cache_file = os.path.join(cache_dir, "all_containers.json")
        
        # Check if cache exists and is recent enough
        should_update = update
        if not should_update and os.path.exists(cache_file):
            file_age = datetime.now().timestamp() - os.path.getmtime(cache_file)
            should_update = file_age > max_age
        
        if should_update or not os.path.exists(cache_file):
            # Run docker stats command
            cmd = 'docker stats --no-stream'
            try:
                output = subprocess.check_output(cmd, shell=True, text=True)
            except subprocess.CalledProcessError:
                print("Error running docker stats command")
                return pd.DataFrame()
            
            # Parse the output
            lines = output.strip().split('\n')
            if len(lines) <= 1:
                print("No containers running")
                return pd.DataFrame()
            
            # Process headers
            headers = [h.strip() for h in lines[0].split('  ') if h.strip()]
            cleaned_headers = []
            header_indices = []
            
            # Find the position of each header in the line
            current_pos = 0
            for header in headers:
                pos = lines[0].find(header, current_pos)
                if pos != -1:
                    header_indices.append(pos)
                    cleaned_headers.append(header)
                    current_pos = pos + len(header)
            
            # Process data rows
            stats = []
            for line in lines[1:]:
                if not line.strip():
                    continue
                    
                # Extract values based on header positions
                values = []
                for i in range(len(header_indices)):
                    start = header_indices
                    end = header_indices if i+1 < len(header_indices) else len(line)
                    values.append(line.strip())
                
                # Create a dictionary for this row
                row = dict(zip(cleaned_headers, values))
                
                # Process special columns
                if 'MEM USAGE / LIMIT' in row:
                    print(row)

                    mem_usage, mem_limit = row.pop('MEM USAGE / LIMIT').split('/')
                    row['MEM_USAGE'] = mem_usage.strip()
                    row['MEM_LIMIT'] = mem_limit.strip()
                
                for prefix in ['NET', 'BLOCK']:
                    if f'{prefix} I/O' in row:
                        io_in, io_out = row.pop(f'{prefix} I/O').split('/')
                        row[f'{prefix}_IN'] = io_in.strip()
                        row[f'{prefix}_OUT'] = io_out.strip()
                
                # Rename ID column
                if 'CONTAINER ID' in row:
                    row['ID'] = row.pop('CONTAINER ID')
                
                # Convert keys to lowercase
                row = {k.lower(): v for k, v in row.items()}
                stats.append(row)
            
            # Save to cache
            with open(cache_file, 'w') as f:
                json.dump(stats, f)
        else:
            # Load from cache
            with open(cache_file, 'r') as f:
                stats = json.load(f)
        
        # Convert to DataFrame
        return pd.DataFrame(stats)



    def sync(self):
        self.stats(update=1)
        