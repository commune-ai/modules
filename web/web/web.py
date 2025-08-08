
import requests
from urllib.parse import urljoin, urlparse
import os
import hashlib
from typing import Dict, List, Set, Optional, Union, Any
import logging
import commune as c
from bs4 import BeautifulSoup
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import re

class Web:
    endpoints = ["search", "crawl"]
    
    def __init__(self, 
                 url: str = None,
                 max_pages: int = 10,
                 search_engine: str = "google",
                 use_selenium: bool = False,
                 max_workers: int = 5,
                 headers: Dict[str, str] = None):
        self.url = url
        self.max_pages = max_pages
        self.search_engine = search_engine
        self.use_selenium = use_selenium
        self.max_workers = max_workers
        self.visited_urls = set()
        self.logger = logging.getLogger(__name__)
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.driver = None
        self.cache = {}
    
    def text(self, url: str = '') -> str:
        # 1. Fetch the page
        response = requests.get(url)
        html = response.text  # or response.content
        # 2. Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")

        # 3. Extract just the text (without HTML tags)
        page_text = soup.get_text(separator="\n", strip=True)
        return page_text

    def is_valid_url(self, url: str) -> bool:
        """Check if URL is valid and belongs to the same domain"""
        try:
            if not self.url:
                return True
            parsed_base = urlparse(self.url)
            parsed_url = urlparse(url)
            return parsed_base.netloc == parsed_url.netloc
        except Exception:
            return False

    engine2url = { 
            'brave': 'https://search.brave.com/search?q={query}',
            'google': 'https://www.google.com/search?q={query}',
            'bing': 'https://www.bing.com/search?q={query}',
            'yahoo': 'https://search.yahoo.com/search?p={query}',
            'duckduckgo': 'https://duckduckgo.com/?q={query}',
            "sybil": "https://sybil.com/search?q={query}"
        }
    
    engines = list(engine2url.keys())

    def ask(self, *args, **kwargs):
        text = ' '.join(list(map(str, args)))
        context =  self.search(query=text, **kwargs)
        prompt = f"""
        QUERY
        {text}
        CONTEXT
        {context}
        """
        return c.generate(prompt, stream=1)
        

    def search(self, 
               query:str='twitter',  
               engine="all",
               expand: bool = False) -> str:
        '''
        Searches the query on the source
        '''

        if engine in self.engine2url:
            url = self.engine2url[engine].format(query=query)
            return self.content(url, expand=expand)
        elif engine == 'all':
            results = {}
            future2engine = {}
            for engine in self.engine2url:
                url = self.engine2url[engine].format(query=query)
                future = c.submit(self.content, [url, expand], timeout=10)
                future2engine[future] = engine

            for f in c.as_completed(future2engine):
                engine = future2engine[f]
                try:
                    result = f.result()
                    print(f'{engine} --> {url}')
                    results[engine] = result
                except Exception as e:
                    print(f'{engine} failed: {e}')
                    results[engine] = None
            return results
        else:
            raise ValueError(f'Engine {engine} not supported')

    def content(self, url: str="https://search.brave.com/search?q=twitter", expand: bool = False) -> Dict:
        """
        Fetch and extract content from a webpage
        Returns a dictionary containing text content and image URLs
        If expand is True, fetches full content from all linked pages
        """
        url = url or self.url
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract text content
            result_text = []
            for text in soup.stripped_strings:
                if len(text.strip()) > 0:
                    result_text.append(text.strip())

            # Extract images
            images = []
            for img in soup.find_all('img'):
                src = img.get('src')
                if src:
                    absolute_url = urljoin(url, src)
                    alt_text = img.get('alt', '')
                    images.append({
                        'url': absolute_url,
                        'alt_text': alt_text
                    })
    
            # Extract links for further crawling
            links = []
            for link in soup.find_all('a'):
                href = link.get('href')
                if href:
                    absolute_url = urljoin(url, href)
                    if self.is_valid_url(absolute_url):
                        links.append(absolute_url)

            result = {
                'url': url,
                'text': result_text,
                'images': images,
                'links': links
            }
            
            # If expand is True, fetch full content from all linked pages
            if expand and links:
                result['expanded_content'] = {}
                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    future_to_url = {executor.submit(self._fetch_full_page_content, link): link for link in links[:10]}  # Limit to 10 links
                    
                    for future in as_completed(future_to_url):
                        link = future_to_url[future]
                        try:
                            page_content = future.result()
                            if page_content:
                                result['expanded_content'][link] = page_content
                        except Exception as e:
                            print(f"Error fetching expanded content from {link}: {e}")
            
            return result

        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            return None
    
    def _fetch_full_page_content(self, url: str) -> Dict:
        """Fetch full content from a single page"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get full text content
            full_text = soup.get_text(separator="\n", strip=True)
            
            # Extract metadata
            title = soup.find('title')
            title_text = title.string if title else ''
            
            meta_description = soup.find('meta', attrs={'name': 'description'})
            description = meta_description.get('content', '') if meta_description else ''
            
            # Extract main content areas
            main_content = []
            for tag in ['main', 'article', 'section', 'div']:
                elements = soup.find_all(tag)
                for element in elements:
                    if element.get('class'):
                        classes = ' '.join(element.get('class', []))
                        if any(keyword in classes.lower() for keyword in ['content', 'main', 'article', 'body']):
                            main_content.append(element.get_text(separator="\n", strip=True))
            
            return {
                'url': url,
                'title': title_text,
                'description': description,
                'full_text': full_text,
                'main_content': main_content[:3],  # Limit to top 3 content areas
                'word_count': len(full_text.split())
            }
            
        except Exception as e:
            print(f"Error fetching full content from {url}: {e}")
            return None

    def save_content(self, content: Dict, output_dir: str = 'crawled_data'):
        """Save the crawled content to files"""
        if not content:
            return

        # Create hash of URL for unique filename
        url_hash = hashlib.md5(content['url'].encode()).hexdigest()[:10]
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Save text content
        text_file = os.path.join(output_dir, f'{url_hash}_content.txt')
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(f"URL: {content['url']}\n\n")
            f.write("TEXT CONTENT:\n")
            for text in content['text']:
                f.write(f"{text}\n")
            
            f.write("\nIMAGES:\n")
            for img in content['images']:
                f.write(f"URL: {img['url']}\nAlt Text: {img['alt_text']}\n\n")
                
            # Save expanded content if available
            if 'expanded_content' in content:
                f.write("\n\nEXPANDED CONTENT:\n")
                for link, page_data in content['expanded_content'].items():
                    f.write(f"\n--- {link} ---\n")
                    f.write(f"Title: {page_data.get('title', 'N/A')}\n")
                    f.write(f"Description: {page_data.get('description', 'N/A')}\n")
                    f.write(f"Word Count: {page_data.get('word_count', 0)}\n")
                    if page_data.get('main_content'):
                        f.write("Main Content Areas:\n")
                        for i, content_area in enumerate(page_data['main_content']):
                            f.write(f"\n[Content Area {i+1}]\n{content_area[:500]}...\n")

    def crawl(self, save_output: bool = True, output_dir: str = 'crawled_data', expand: bool = False):
        """
        Main crawling method that processes pages up to max_pages
        If expand is True, fetches full content from linked pages
        """
        if not self.url:
            raise ValueError("URL must be set for crawling")
            
        pages_to_visit = [self.url]
        crawled_content = []

        while pages_to_visit and len(self.visited_urls) < self.max_pages:
            current_url = pages_to_visit.pop(0)
            
            if current_url in self.visited_urls:
                continue

            self.logger.info(f"Crawling: {current_url}")
            content = self.content(current_url, expand=expand)
            
            if content:
                self.visited_urls.add(current_url)
                crawled_content.append(content)
                
                if save_output:
                    self.save_content(content, output_dir)
                
                # Add new links to visit
                pages_to_visit.extend([
                    url for url in content['links']
                    if url not in self.visited_urls and url not in pages_to_visit
                ])

        return crawled_content

    def scan_html_screenshot(self, 
                            image_path: str, 
                            prompt: str = '',
                            target: str = './',
                            temperature: float = 0.5,
                            model: Optional[str] = None,
                            verbose: bool = True) -> Dict:
        """
        Scan an HTML screenshot, extract its content, and send it to the model.
        
        Args:
            image_path: Path to the HTML screenshot image
            prompt: Additional prompt text to guide the model
            target: Target directory for code generation
            temperature: Temperature for generation
            model: Model to use (defaults to self.default_model)
            verbose: Whether to print detailed information
            
        Returns:
            Dictionary mapping file paths to generated content
        """
        try:
            # Check if image path exists
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")
            
            # Import necessary libraries for image processing
            try:
                import pytesseract
                from PIL import Image
            except ImportError:
                raise ImportError("Required packages not installed. Please install with: pip install pytesseract pillow")
            
            if verbose:
                c.print(f"📷 Scanning HTML screenshot: {image_path}", color="cyan")
            
            # Open the image
            image = Image.open(image_path)
            
            # Extract text from the image using OCR
            extracted_text = pytesseract.image_to_string(image)
            
            if verbose:
                c.print(f"📝 Extracted {len(extracted_text)} characters from image", color="cyan")
                
            # Construct the full prompt
            full_prompt = f"""
            I'm providing you with the text extracted from an HTML screenshot. 
            Please analyze this HTML structure and help me with the following:
            
            {prompt}
            
            Here's the extracted HTML content:
            ```html
            {extracted_text}
            ```
            """
            
            # Send to the model
            return self.forward(
                full_prompt,
                target=target,
                temperature=temperature,
                model=model or 'default',
                verbose=verbose
            )
            
        except Exception as e:
            if verbose:
                c.print(f"❌ Error scanning HTML screenshot: {str(e)}", color="red")
            raise

    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get cached results if available"""
        return self.cache.get(cache_key)
    
    def _save_to_cache(self, cache_key: str, data: Dict):
        """Save results to cache"""
        self.cache[cache_key] = data
    
    def _initialize_selenium(self):
        """Initialize Selenium WebDriver"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            self.driver = webdriver.Chrome(options=options)
        except ImportError:
            raise ImportError("Selenium not installed. Install with: pip install selenium")
    
    def _close_selenium(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
    
    def _search_with_selenium(self, query: str, num_results: int, safe_search: bool, filter_domains: List[str], expand: bool = False) -> List[Dict]:
        """Search using Selenium WebDriver"""
        # This is a placeholder - implement actual Selenium search logic
        raise NotImplementedError("Selenium search not yet implemented")
    
    def _search_with_requests(self, query: str, num_results: int, safe_search: bool, filter_domains: List[str], expand: bool = False) -> List[Dict]:
        """Search using requests library"""
        url = self.engine2url.get(self.search_engine, self.engine2url['brave']).format(query=query)
        content = self.content(url, expand=expand)
        
        if not content:
            return []
        
        # Extract search results from the page
        results = []
        soup = BeautifulSoup(' '.join(content.get('text', [])), 'html.parser')
        
        # This is a simplified extraction - real implementation would need to handle different search engines
        for i, text in enumerate(content.get('text', [])):
            if i >= num_results:
                break
            results.append({
                'title': text[:100],
                'snippet': text,
                'link': content.get('links', [])[i] if i < len(content.get('links', [])) else None
            })
        
        # Include expanded content if available
        if expand and 'expanded_content' in content:
            for i, result in enumerate(results):
                if result['link'] and result['link'] in content['expanded_content']:
                    result['full_content'] = content['expanded_content'][result['link']]
        
        return results
    
    def _crawl_page(self, url: str, depth: int, extract_patterns: List[str], expand: bool = False) -> Dict:
        """Crawl a single page to specified depth"""
        content = self.content(url, expand=expand)
        if not content:
            return {}
        
        result = {
            'url': url,
            'title': content.get('text', [''])[0] if content.get('text') else '',
            'content': ' '.join(content.get('text', [])),
            'depth_crawled': depth
        }
        
        # Include expanded content if available
        if expand and 'expanded_content' in content:
            result['expanded_content'] = content['expanded_content']
            # Aggregate all text from expanded content
            full_text_parts = [result['content']]
            for link, page_data in content['expanded_content'].items():
                if page_data and 'full_text' in page_data:
                    full_text_parts.append(page_data['full_text'])
            result['full_aggregated_content'] = '\n\n'.join(full_text_parts)
        
        if extract_patterns:
            result['extracted_patterns'] = self._extract_patterns(result.get('full_aggregated_content', result['content']), extract_patterns)
        
        return result
    
    def _extract_patterns(self, text: str, patterns: List[str]) -> Dict:
        """Extract patterns from text"""
        extracted = {'emails': set(), 'phones': set(), 'social_media': {}}
        
        if 'email' in patterns:
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            extracted['emails'] = set(re.findall(email_pattern, text))
        
        if 'phone' in patterns:
            phone_pattern = r'\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b'
            extracted['phones'] = set(re.findall(phone_pattern, text))
        
        if 'social_media' in patterns:
            social_patterns = {
                'twitter': r'(?:https?://)?(?:www\.)?twitter\.com/[A-Za-z0-9_]+',
                'facebook': r'(?:https?://)?(?:www\.)?facebook\.com/[A-Za-z0-9.]+',
                'instagram': r'(?:https?://)?(?:www\.)?instagram\.com/[A-Za-z0-9_.]+',
                'linkedin': r'(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9-]+'
            }
            for platform, pattern in social_patterns.items():
                matches = re.findall(pattern, text)
                if matches:
                    extracted['social_media'][platform] = set(matches)
        
        return extracted
    
    def _extract_context(self, results: List[Dict]) -> str:
        """Extract context from search results"""
        context_parts = []
        for result in results:
            if 'title' in result:
                context_parts.append(f"Title: {result['title']}")
            if 'snippet' in result:
                context_parts.append(f"Snippet: {result['snippet']}")
            if 'content' in result:
                context_parts.append(f"Content: {result['content'][:500]}...")
            if 'full_aggregated_content' in result:
                context_parts.append(f"Full Content Preview: {result['full_aggregated_content'][:1000]}...")
        
        return '\n\n'.join(context_parts)

    def forward(self,
                query: str = 'what is the weather today',
                num_results: int = 5,
                page_depth: int = 0,
                include_snippets: bool = True,
                include_links: bool = True,
                extract_patterns: Optional[List[str]] = None,
                filter_domains: Optional[List[str]] = None,
                safe_search: bool = True,
                use_cache: bool = False,
                cache_key: Optional[str] = None,
                expand: bool = True,
                verbose: bool = True) -> Dict[str, Any]:
        """
        Search the web for information with depth crawling capability.
        
        Args:
            query: Search query string
            num_results: Number of results to return
            page_depth: How many levels deep to crawl from search results (0 = search only)
            include_snippets: Whether to include text snippets in results
            include_links: Whether to include links in results
            extract_patterns: List of patterns to extract ('email', 'phone', 'social_media')
            filter_domains: List of domains to include/exclude (e.g., ['wikipedia.org'])
            safe_search: Whether to enable safe search filtering
            use_cache: Whether to use cached results if available
            cache_key: Custom key for caching (defaults to query hash)
            expand: Whether to fetch full content from linked pages
            verbose: Whether to print detailed information
            
        Returns:
            Dictionary containing:
            - success: Whether the search was successful
            - results: List of search results with extracted content
            - context: Extracted context from results
            - query: Original search query
            - source: Search engine used
            - extracted_data: Any patterns extracted from pages
        """
        if verbose:
            c.print(f"Searching for: {query} (depth: {page_depth}, expand: {expand})", color="cyan")
        
        # Reset visited URLs for new search
        self.visited_urls = set()
        
        # Generate cache key if not provided
        if use_cache and not cache_key:
            cache_key = hashlib.md5(f"{self.search_engine}_{query}_{num_results}_{page_depth}_{expand}".encode()).hexdigest()
        
        # Check cache first if enabled
        if use_cache:
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                if verbose:
                    c.print(f"Retrieved results from cache", color="green")
                return cached_result
        
        try:
            # Perform search based on engine
            if self.use_selenium:
                self._initialize_selenium()
                results = self._search_with_selenium(query, num_results, safe_search, filter_domains, expand)
            else:
                results = self._search_with_requests(query, num_results, safe_search, filter_domains, expand)
            
            # Process results with depth crawling if requested
            processed_results = []
            extracted_data = {'emails': set(), 'phones': set(), 'social_media': {}}
            
            if page_depth > 0:
                # Crawl pages to specified depth
                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    futures = []
                    for result in results:
                        if 'link' in result and result['link']:
                            future = executor.submit(self._crawl_page, result['link'], page_depth, extract_patterns, expand)
                            futures.append((future, result))
                    
                    for future, original_result in futures:
                        try:
                            crawl_data = future.result(timeout=30)
                            # Merge crawled data with original result
                            enhanced_result = {**original_result, **crawl_data}
                            processed_results.append(enhanced_result)
                            
                            # Aggregate extracted patterns
                            if 'extracted_patterns' in crawl_data:
                                for pattern_type, values in crawl_data['extracted_patterns'].items():
                                    if pattern_type == 'social_media':
                                        for platform, links in values.items():
                                            if platform not in extracted_data['social_media']:
                                                extracted_data['social_media'][platform] = set()
                                            extracted_data['social_media'][platform].update(links)
                                    else:
                                        extracted_data[pattern_type].update(values)
                        except Exception as e:
                            if verbose:
                                c.print(f"Error crawling page: {e}", color="yellow")
                            processed_results.append(original_result)
            else:
                # No depth crawling, just process search results
                for result in results:
                    processed_result = {}
                    if include_links and 'link' in result:
                        processed_result['url'] = result['link']
                    if 'title' in result:
                        processed_result['title'] = result['title']
                    if include_snippets and 'snippet' in result:
                        processed_result['snippet'] = result['snippet']
                    if 'full_content' in result:
                        processed_result['full_content'] = result['full_content']
                    processed_results.append(processed_result)
            
            # Extract context from results
            context = self._extract_context(processed_results)
            
            # Convert sets to lists for JSON serialization
            serializable_extracted = {
                'emails': list(extracted_data['emails']),
                'phones': list(extracted_data['phones']),
                'social_media': {k: list(v) for k, v in extracted_data['social_media'].items()}
            }
            
            # Prepare response
            response = {
                "success": True,
                "results": processed_results,
                "context": context,
                "query": query,
                "source": self.search_engine,
                "page_depth": page_depth,
                "expanded": expand,
                "extracted_data": serializable_extracted if extract_patterns else None
            }
            
            # Cache the results if enabled
            if use_cache:
                self._save_to_cache(cache_key, response)
            
            if verbose:
                c.print(f"Found {len(processed_results)} results", color="green")
                if page_depth > 0:
                    c.print(f"Crawled to depth {page_depth}", color="blue")
                if expand:
                    c.print(f"Expanded content fetched", color="cyan")
                if extract_patterns and any(serializable_extracted.values()):
                    c.print(f"Extracted data: {serializable_extracted}", color="cyan")
            
            return response
            
        except Exception as e:
            error_msg = f"Search failed: {str(e)}"
            if verbose:
                c.print(error_msg, color="red")
            
            return {
                "success": False,
                "error": error_msg,
                "query": query,
                "source": self.search_engine
            }
        finally:
            # Close Selenium if we're not caching the driver
            if self.use_selenium and not getattr(self, 'keep_driver_alive', False):
                self._close_selenium()
