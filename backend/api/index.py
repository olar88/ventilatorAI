"""
Vercel Serverless Function Entry Point for VentAI Backend
"""
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app
from mangum import Mangum

# Wrap FastAPI app with Mangum for serverless deployment
handler = Mangum(app, lifespan="off")
