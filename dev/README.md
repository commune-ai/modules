# Web Scraper Tool

A web scraping tool that retrieves search results without relying on search engine APIs.

## Features

- Scrapes search results from Google, Bing, and DuckDuckGo
- Supports both Selenium (for JavaScript-heavy sites) and requests+BeautifulSoup
- Caches results to minimize redundant requests
- Extracts titles, links, and snippets from search results
- Provides summarization capability using LLMs

## Requirements

```
beautifulsoup4>=4.9.3
selenium>=4.0.0
webdriver-manager>=3.5.2
requests>=2.25.1
```

## Usage

```python
from web_scraper import WebScraper

# Initialize with default settings (Google search, using Selenium)
scraper = WebScraper()

# Search for information
results = scraper.forward("latest AI developments", num_results=5)

# Print the formatted context
print(results["context"])

# Search and summarize results
summary_result = scraper.search_and_summarize(
    query="benefits of meditation",
    num_results=5,
    max_tokens=300
)
print(summary_result["summary"])
```

## Configuration Options

- `search_engine`: Choose between 'google', 'bing', or 'duckduckgo'
- `use_selenium`: Whether to use Selenium for JavaScript-heavy sites
- `headless`: Whether to run browser in headless mode (Selenium only)
- `cache_dir`: Directory to store cached results
- `cache_expiry`: Time in seconds before cache entries expire
