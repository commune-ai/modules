# Surfy Module

A module that can surf the web and fetch context based on a query without using an API key.

## Features

- Search the web using multiple search engines (Google, DuckDuckGo)
- Extract snippets and URLs from search results
- Optionally fetch full content from result pages
- Rotate user agents to avoid detection
- No API key required

## Usage

```python
import commune as c

# Initialize the module
surfy = c.module('surfy')()

# Basic search
results = surfy.forward("What is quantum computing?")
print(results['context'])

# Search with full content fetching
detailed_results = surfy.forward(
    "Python web scraping best practices", 
    num_results=3, 
    fetch_content=True
)
print(detailed_results['context'])
```

## Methods

### forward(query, num_results=5, fetch_content=False, max_content_length=5000)

Main method to search the web and return context based on a query.

- `query` (str): The search query
- `num_results` (int): Number of search results to consider
- `fetch_content` (bool): Whether to fetch full content from result URLs
- `max_content_length` (int): Maximum length of content to return per result

### search(query, num_results=5)

Search the web for the given query and return results.

### fetch_page_content(url)

Fetch and parse content from a specific URL.

## Dependencies

- requests
- BeautifulSoup4

To install dependencies:
```
pip install requests beautifulsoup4
```