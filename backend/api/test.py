"""
Simple test endpoint for Vercel
"""
from mangum import Mangum
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Simple test works!"}

@app.get("/api/test")
def test():
    return {"test": "success"}

handler = Mangum(app, lifespan="off")
