
# Commune Server Module

A robust, secure, and extensible server framework for building API services with authentication, transaction tracking, and middleware support.

## Overview

The Commune Server module provides a complete server infrastructure with:

- JWT-based authentication
- Request verification
- Transaction tracking and analytics
- Rate limiting
- Middleware for request processing
- Persistent storage

## Components

### Server

The core server component that handles routing, function execution, and client communication.

### Auth

JWT-based authentication system for secure API access with token generation and verification.

### Middleware

Request processing middleware that handles:
- Request size validation
- Rate limiting
- Authentication verification
- Transaction logging

### TxCollector

Transaction collector for tracking and analyzing API requests with:
- Efficient storage of transaction data
- Query capabilities for analytics
- Automatic cleanup of old transaction data

### Store

Simple key-value storage for persisting data.

## Usage

### Starting a Server

```python
import commune as c

# Create and start a server for a module
server = c.module('server')
server.serve('my_module', port=8000)
```

### Client Usage

```python
import commune as c

# Create a client to interact with the server
client = c.module('server.client')
result = client.call('my_module/function_name', param1='value1', param2='value2')
```

### Authentication

```python
import commune as c

# Generate a key for authentication
key = c.get_key('my_key')

# Create a client with authentication
client = c.module('server.client')(url='my_module', key=key)
result = client.forward('function_name', params={'param1': 'value1'})
```

## Configuration

The server module is highly configurable:

- **Authentication**: Customize JWT token parameters
- **Rate Limiting**: Set request limits per client
- **Transaction Tracking**: Configure retention periods and storage paths
- **Middleware**: Add custom middleware for request processing

## Advanced Features

### Function Exposure

Control which functions are exposed via the API:

```python
class MyModule:
    # Only these functions will be accessible via the API
    functions = ['public_function1', 'public_function2']
    
    def public_function1(self):
        return "This is accessible"
        
    def _private_function(self):
        return "This is not accessible"
```

### Transaction Analytics

Get insights into API usage:

```python
import commune as c

tx_collector = c.module('server.txcollector')
stats = tx_collector.get_stats(days=7)
print(f"Total transactions: {stats['total_transactions']}")
```

## Security

The server module implements several security measures:

- JWT token verification
- Request validation
- Rate limiting
- Size limits on requests
- Client authentication

## Dependencies

- FastAPI
- Uvicorn
- Starlette
- Commune core modules
