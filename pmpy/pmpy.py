
import commune as c
import os
import signal
import subprocess
import time
import psutil
import json
from typing import List, Dict, Union, Optional, Any
import hashlib
import asyncio
import pandas as pd
from pathlib import Path
from os.path import abspath

class Pmpy:
    """
    A process manager class that provides functionality similar to PM2 but without using PM2.
    """
    def __init__(self, 
                 proc_prefix: str = 'pmpy/',
                 log_dir: str = '~/commune/logs/pmpy',
                 config_dir: str = '~/commune/config/pmpy',
                 **kwargs):
        """
        Initialize the process manager.
        
        Args:
            proc_prefix: Prefix for process names
            log_dir: Directory to store logs
            config_dir: Directory to store process configurations
            **kwargs: Additional configuration parameters
        """
        self.proc_prefix = proc_prefix
        self.log_dir = os.path.expanduser(log_dir)
        self.config_dir = os.path.expanduser(config_dir)
        
        # Create directories if they don't exist
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Dictionary to track running processes
        self.processes = self._load_processes()
        
    def _load_processes(self) -> Dict:
        """
        Load existing process information from config files.
        """
        processes = {}
        for config_file in os.listdir(self.config_dir):
            if config_file.endswith('.json'):
                process_name = config_file[:-5]
                config_path = os.path.join(self.config_dir, config_file)
                try:
                    with open(config_path, 'r') as f:
                        process_info = json.load(f)
                        
                    # Check if process is still running
                    if self._is_process_running(process_info.get('pid')):
                        processes[process_name] = process_info
                    else:
                        # Clean up stale process info
                        os.remove(config_path)
                except Exception as e:
                    print(f"Error loading process config {config_file}: {str(e)}")
        
        return processes
    
    def _is_process_running(self, pid: Optional[int]) -> bool:
        """
        Check if a process with the given PID is running.
        """
        if pid is None:
            return False
        
        try:
            # Check if process exists
            process = psutil.Process(pid)
            return process.is_running()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return False
    
    def _save_process_info(self, name: str, process_info: Dict):
        """
        Save process information to a config file.
        """
        config_path = os.path.join(self.config_dir, f"{name}.json")
        with open(config_path, 'w') as f:
            json.dump(process_info, f, indent=2)
    
    def _delete_process_info(self, name: str):
        """
        Delete process information file.
        """
        config_path = os.path.join(self.config_dir, f"{name}.json")
        if os.path.exists(config_path):
            os.remove(config_path)
    
    def run(self, script: str, name: str = None, params: Dict = None, cwd: str = None, env: Dict = None):
        """
        Run a Python script as a background process.
        
        Args:
            script: The Python script or module to run
            name: Name for the process (if None, will use script name)
            params: Parameters to pass to the script
            cwd: Working directory for the process
            env: Environment variables for the process
            
        Returns:
            Dict with process information
        """
        if name is None:
            name = script.replace('/', '.')
        
        full_name = self.proc_prefix + name
        
        # Check if process already exists
        if full_name in self.processes:
            pid = self.processes[full_name].get('pid')
            if self._is_process_running(pid):
                return {"success": False, "message": f"Process {full_name} is already running with PID {pid}"}
        
        # Prepare command
        if script.startswith("commune.") or "." in script:
            cmd = ["python", "-m", script]
        else:
            cmd = ["python", "-c", f"import commune as c; c.module('{script}')"]
            
        # Add parameters if provided
        if params:
            param_str = json.dumps(params)
            cmd.append(f"--params={param_str}")
        
        # Prepare log files
        log_file = os.path.join(self.log_dir, f"{full_name}.log")
        
        # Prepare environment
        process_env = os.environ.copy()
        if env:
            process_env.update(env)
        
        # Start the process
        with open(log_file, 'a') as f:
            f.write(f"\n--- Starting process {full_name} at {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
            f.write(f"Command: {' '.join(cmd)}\n")
            
            process = subprocess.Popen(
                cmd,
                stdout=f,
                stderr=subprocess.STDOUT,
                cwd=cwd,
                env=process_env,
                start_new_session=True  # Detach process from parent
            )
        
        # Store process information
        process_info = {
            "pid": process.pid,
            "script": script,
            "params": params,
            "cwd": cwd,
            "log_file": log_file,
            "start_time": time.time(),
            "status": "running"
        }
        
        self.processes[full_name] = process_info
        self._save_process_info(full_name, process_info)
        
        return {
            "success": True,
            "message": f"Started process {full_name} with PID {process.pid}",
            "pid": process.pid,
            "name": full_name,
            "log_file": log_file
        }
    
    def kill(self, name: str) -> Dict:
        """
        Kill a running process by name.
        
        Args:
            name: Name of the process to kill
            
        Returns:
            Dict with operation result
        """
        full_name = name if name.startswith(self.proc_prefix) else self.proc_prefix + name
        
        if full_name not in self.processes:
            return {"success": False, "message": f"Process {full_name} not found"}
        
        pid = self.processes[full_name].get('pid')
        
        if not self._is_process_running(pid):
            # Process is not running, clean up
            self._delete_process_info(full_name)
            del self.processes[full_name]
            return {"success": True, "message": f"Process {full_name} was not running"}
        
        try:
            # Try to terminate gracefully first
            os.killpg(os.getpgid(pid), signal.SIGTERM)
            
            # Give it a moment to terminate
            for _ in range(5):
                if not self._is_process_running(pid):
                    break
                time.sleep(0.5)
            
            # If still running, force kill
            if self._is_process_running(pid):
                os.killpg(os.getpgid(pid), signal.SIGKILL)
            
            # Clean up
            self._delete_process_info(full_name)
            del self.processes[full_name]
            
            return {"success": True, "message": f"Killed process {full_name} with PID {pid}"}
        except Exception as e:
            return {"success": False, "message": f"Error killing process {full_name}: {str(e)}"}
    
    def kill_all(self) -> Dict:
        """
        Kill all running processes managed by this instance.
        
        Returns:
            Dict with operation results
        """
        results = {}
        process_names = list(self.processes.keys())
        
        for name in process_names:
            results[name] = self.kill(name)
        
        return {
            "success": True,
            "message": f"Attempted to kill {len(process_names)} processes",
            "results": results
        }
    
    def logs(self, name: str, tail: int = 100, stream: bool = False, follow: bool = False) -> Union[str, None]:
        """
        Get logs for a process.
        
        Args:
            name: Name of the process
            tail: Number of lines to return from the end of the log
            stream: Whether to stream the logs
            follow: Whether to follow the log file (only used if stream=True)
            
        Returns:
            Log content as string or None if process not found
        """
        full_name = name if name.startswith(self.proc_prefix) else self.proc_prefix + name
        
        if full_name not in self.processes:
            return f"Process {full_name} not found"
        
        log_file = self.processes[full_name].get('log_file')
        
        if not log_file or not os.path.exists(log_file):
            return f"Log file for {full_name} not found"
        
        if stream:
            if follow:
                # Stream logs with follow (similar to 'tail -f')
                process = subprocess.Popen(['tail', '-f', log_file], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                for line in process.stdout:
                    yield line.decode('utf-8')
            else:
                # Stream logs without follow
                with open(log_file, 'r') as f:
                    for line in f.readlines()[-tail:]:
                        yield line
        else:
            # Return logs as a string
            with open(log_file, 'r') as f:
                lines = f.readlines()
                return ''.join(lines[-tail:])
    
    def procs(self, search: str = None, status: str = None) -> List[str]:
        """
        List all processes, optionally filtered by search string or status.
        
        Args:
            search: Optional search string to filter process names
            status: Optional status to filter processes (running, stopped)
            
        Returns:
            List of process names
        """
        # First refresh process status
        self._refresh_process_status()
        
        processes = list(self.processes.keys())
        
        # Filter by search string if provided
        if search:
            processes = [p for p in processes if search in p]
        
        # Filter by status if provided
        if status:
            processes = [p for p in processes if self.processes[p].get('status') == status]
        
        return processes
    
    def _refresh_process_status(self):
        """
        Refresh the status of all processes.
        """
        for name, info in list(self.processes.items()):
            pid = info.get('pid')
            if not self._is_process_running(pid):
                info['status'] = 'stopped'
                self._save_process_info(name, info)
    
    def status(self, name: str = None) -> Union[Dict, List[Dict]]:
        """
        Get status of a specific process or all processes.
        
        Args:
            name: Optional process name. If None, returns status of all processes.
            
        Returns:
            Process status information
        """
        self._refresh_process_status()
        
        if name:
            full_name = name if name.startswith(self.proc_prefix) else self.proc_prefix + name
            
            if full_name not in self.processes:
                return {"error": f"Process {full_name} not found"}
            
            return self.processes[full_name]
        
        # Return status of all processes
        return [
            {
                "name": name,
                "pid": info.get('pid'),
                "status": info.get('status'),
                "uptime": time.time() - info.get('start_time') if info.get('start_time') else 0,
                "script": info.get('script')
            }
            for name, info in self.processes.items()
        ]
    
    def restart(self, name: str) -> Dict:
        """
        Restart a process.
        
        Args:
            name: Name of the process to restart
            
        Returns:
            Dict with operation result
        """
        full_name = name if name.startswith(self.proc_prefix) else self.proc_prefix + name
        
        if full_name not in self.processes:
            return {"success": False, "message": f"Process {full_name} not found"}
        
        # Get process info before killing it
        process_info = self.processes[full_name].copy()
        
        # Kill the process
        kill_result = self.kill(full_name)
        if not kill_result.get('success', False):
            return kill_result
        
        # Start it again with the same parameters
        return self.run(
            script=process_info.get('script'),
            name=name,
            params=process_info.get('params'),
            cwd=process_info.get('cwd')
        )
    
    def forward(self, module: str = 'explain', *args, stream=1, **kwargs):
        """
        Dynamically call a method of the class.
        
        Args:
            module: The module to explain
            *args: Positional arguments to pass to the method
            stream: Whether to stream the output
            **kwargs: Keyword arguments to pass to the method
            
        Returns:
            Result of the called method
        """
        model = c.module('openrouter')()
        return model.forward(f'what does this do? {c.code(module)}', stream=stream)
