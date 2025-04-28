
# PMPY - Python Process Manager

PMPY is a lightweight process manager for Python applications, designed as an alternative to PM2 for managing server processes. It provides functionality to run, monitor, and control Python processes without external dependencies on Node.js or PM2.

## Features

- Run Python scripts as background processes
- Monitor process status
- View process logs
- Kill and restart processes
- Filter processes by name or status

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pmpy.git

# Install dependencies
pip install psutil
```

## Usage

### Basic Usage

```python
import commune as c

# Initialize the process manager
pm = c.module('pmpy')()

# Run a Python script
pm.run('your_script.py', name='my_process')

# List all processes
processes = pm.procs()

# View logs
logs = pm.logs('my_process', tail=100)

# Kill a process
pm.kill('my_process')

# Restart a process
pm.restart('my_process')

# Kill all processes
pm.kill_all()
```

### Running a Server

```python
# Run a server module
pm.run('server/serve', name='my_server', params={
    'module': 'my_module',
    'port': 8080,
    'functions': ['func1', 'func2']
})

# Get server status
status = pm.status('my_server')
```

## API Reference

### `__init__(proc_prefix='pmpy/', log_dir='~/commune/logs/pmpy', config_dir='~/commune/config/pmpy')`

Initialize the process manager.

- `proc_prefix`: Prefix for process names
- `log_dir`: Directory to store logs
- `config_dir`: Directory to store process configurations

### `run(script, name=None, params=None, cwd=None, env=None)`

Run a Python script as a background process.

- `script`: The Python script or module to run
- `name`: Name for the process (if None, will use script name)
- `params`: Parameters to pass to the script
- `cwd`: Working directory for the process
- `env`: Environment variables for the process

### `kill(name)`

Kill a running process by name.

- `name`: Name of the process to kill

### `kill_all()`

Kill all running processes managed by this instance.

### `logs(name, tail=100, stream=False, follow=False)`

Get logs for a process.

- `name`: Name of the process
- `tail`: Number of lines to return from the end of the log
- `stream`: Whether to stream the logs
- `follow`: Whether to follow the log file (only used if stream=True)

### `procs(search=None, status=None)`

List all processes, optionally filtered by search string or status.

- `search`: Optional search string to filter process names
- `status`: Optional status to filter processes (running, stopped)

### `status(name=None)`

Get status of a specific process or all processes.

- `name`: Optional process name. If None, returns status of all processes.

### `restart(name)`

Restart a process.

- `name`: Name of the process to restart

## License

MIT
