 # start of file
# Commune Dev Module

A powerful code generation and editing module powered by Large Language Models.

## Features

- 🚀 Generate code from natural language descriptions
- 🔧 Edit and refactor existing codebases
- 📊 Analyze code quality, security, and performance
- ✅ Generate comprehensive tests
- 🏗️ Create project scaffolding from templates or descriptions
- 🔄 Implement new features in existing codebases

## Installation

```bash
pip install commune
```

## Quick Start

```python
import commune as c

# Initialize the Dev module
dev = c.module('dev')()

# Generate a simple Flask app
result = dev.forward(
    "Create a simple Flask app with a home page and about page",
    target="./my_flask_app",
    auto_save=True
)

# Analyze existing code
analysis = dev.analyze_code(
    target_dir="./my_project",
    focus="quality"
)
print(analysis)

# Create a project from a template
project = dev.create_project(
    project_type="fastapi",
    target_dir="./my_api",
    name="MyAPI",
    description="A RESTful API for user management"
)
```

## Usage Examples

### Generate Code

```python
dev.forward(
    "Create a Python script that fetches data from the SpaceX API and displays launch information",
    target="./spacex_app",
    auto_save=True
)
```

### Edit Existing Code

```python
dev.edit_file(
    file_path="./my_app/app.py",
    instructions="Add error handling and logging to all functions",
    auto_save=True
)
```

### Implement a New Feature

```python
dev.implement_feature(
    target_dir="./my_app",
    feature_description="Add user authentication with JWT tokens and role-based access control",
    auto_save=True
)
```

### Generate Tests

```python
dev.generate_tests(
    target_dir="./my_app",
    test_framework="pytest",
    auto_save=True
)
```

### Refactor Code

```python
dev.refactor_code(
    target_dir="./my_app",
    instructions="Improve performance and follow PEP 8 guidelines",
    auto_save=True
)
```

### Create a New Project

```python
dev.create_project(
    project_type="django",
    target_dir="./my_django_app",
    name="MyBlog",
    description="A blog platform with user authentication and comments",
    auto_save=True
)
```

## Command Line Usage

The module includes example scripts that can be run from the command line:

```bash
python -m commune.modules.dev.scripts.dev_examples --task create_project --project_type flask --project_name MyApp --target ./my_app
```

Available tasks:
- `simple_flask`: Create a simple Flask application
- `data_analysis`: Create a data analysis script
- `api_client`: Create an API client
- `refactor`: Refactor existing code
- `analyze`: Analyze code quality
- `implement_feature`: Implement a new feature
- `generate_tests`: Generate tests for existing code
- `create_project`: Create a new project

## Testing

The module includes comprehensive tests to ensure functionality:

```bash
# Run all tests
python -m commune.modules.dev.scripts.run_tests

# Run only unit tests
python -m commune.modules.dev.scripts.run_tests --unit

# Run only integration tests
python -m commune.modules.dev.scripts.run_tests --integration

# Run tests with verbose output
python -m commune.modules.dev.scripts.run_tests -v
```

## Advanced Configuration

The Dev module can be configured with various options:

```python
dev = c.module('dev')(
    provider='openrouter',  # LLM provider
    default_model='anthropic/claude-3.7-sonnet',  # Default model
    cache_dir='~/.commune/dev_cache'  # Cache directory
)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
