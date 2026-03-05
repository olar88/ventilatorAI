"""
Vercel Serverless Function Entry Point for VentAI Backend
"""
import sys
import os
from http.server import BaseHTTPRequestHandler
from io import BytesIO
import json

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import FastAPI app and sync handler
from main import app

# Create ASGI to WSGI adapter for Vercel
class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        self._handle_request()
    
    def do_POST(self):
        """Handle POST requests"""
        self._handle_request()
    
    def _handle_request(self):
        """Process FastAPI request synchronously"""
        try:
            # Import necessary modules
            from starlette.testclient import TestClient
            
            # Create test client
            client = TestClient(app)
            
            # Get request path and method
            path = self.path
            method = self.command
            
            # Read request body if POST
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            
            # Make request to FastAPI
            if method == 'GET':
                response = client.get(path)
            elif method == 'POST':
                response = client.post(path, content=body, headers=dict(self.headers))
            else:
                response = client.request(method, path, content=body, headers=dict(self.headers))
            
            # Send response
            self.send_response(response.status_code)
            for key, value in response.headers.items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(response.content)
            
        except Exception as e:
            # Error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode())
