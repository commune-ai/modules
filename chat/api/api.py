
#!/usr/bin/env python3
import os
import json
import sys
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import cgi

# Try to import commune if available
import commune as c

# Mock data for demonstration purposes
AVAILABLE_MODELS = [
    "google/gemini-2.5-pro-exp-03-25:free",
    "anthropic/claude-3-opus-20240229",
    "anthropic/claude-3-sonnet-20240229",
    "meta-llama/llama-3-70b-instruct"
]

class CommuneBackendHandler(BaseHTTPRequestHandler):
    def _set_headers(self, content_type="application/json"):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())

    def do_OPTIONS(self):
        self._set_headers()
        
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == "/api/agent/models":
            try:

                # Try to get models from commune
                try:
                    model = c.module('openrouter')()
                    models = model.models()
                    self._set_headers()
                    self.wfile.write(json.dumps(models).encode())
                except Exception as e:
                    print(f"Error getting models from commune: {str(e)}")
                    self._set_headers()
                    self.wfile.write(json.dumps(AVAILABLE_MODELS).encode())
            except Exception as e:
                traceback.print_exc()
                self._send_error(500, f"Server error: {str(e)}")
        else:
            self._send_error(404, "Not found")

    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == "/api/agent/ask":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                message = data.get('text', '')
                model_name = data.get('model', 'gpt-3.5-turbo')
                
                try:
                    # Use commune to get a response
                    model = c.module('openrouter')()
                    response = model.forward(message, model=model_name)
                    
                    self._set_headers()
                    self.wfile.write(json.dumps(response).encode())
                except Exception as e:
                    traceback.print_exc()
                    # Fallback to mock response
                    mock_response = f"Error using model {model_name}: {str(e)}\n\n"
                    mock_response += "This is a fallback response. The actual model could not be accessed."
                    self._set_headers()
                    self.wfile.write(json.dumps(mock_response).encode())

            except json.JSONDecodeError:
                self._send_error(400, "Invalid JSON")
            except Exception as e:
                traceback.print_exc()
                self._send_error(500, f"Server error: {str(e)}")
        else:
            self._send_error(404, "Not found")

def run(server_class=HTTPServer, handler_class=CommuneBackendHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting Commune backend server on port {port}...")
    httpd.serve_forever()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    run(port=port)
