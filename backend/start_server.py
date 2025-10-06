#!/usr/bin/env python3
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

# Set environment variables
os.environ['SQLALCHEMY_DATABASE_URL'] = 'postgresql://postgres:Stayzyai123@3.82.36.110:5432/stayzy_db'
os.environ['JWT_SECRET_KEY'] = 'dev-secret'
os.environ['READ_ONLY_MODE'] = 'true'
os.environ['CHAT_GPT_API_KEY'] = 'dummy'
os.environ['HOSTAWAY_URL'] = 'api.hostaway.com'
os.environ['HOSTAWAY_API_URL'] = 'https://api.hostaway.com/v1'
os.environ['PROVIDER_ID'] = 'stayzy_0035527885'

# Debug: Print the database URL being used
print(f"🔍 Database URL: {os.environ['SQLALCHEMY_DATABASE_URL']}")

# Import and run the app
if __name__ == "__main__":
    try:
        import uvicorn
        from app.main import app
        print("Starting server on http://localhost:8000")
        uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()
