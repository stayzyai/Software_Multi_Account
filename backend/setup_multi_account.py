#!/usr/bin/env python3
"""
Setup script for Multi-Hostaway Account functionality
This script helps you set up the environment and run the migration.
"""

import os
import subprocess
import sys

def check_requirements():
    """Check if required packages are installed"""
    print("🔍 Checking requirements...")
    
    try:
        import psycopg2
        print("✅ psycopg2 installed")
    except ImportError:
        print("❌ psycopg2 not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        print("✅ psycopg2 installed")
    
    try:
        import dotenv
        print("✅ python-dotenv installed")
    except ImportError:
        print("❌ python-dotenv not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
        print("✅ python-dotenv installed")

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_path = ".env"
    if os.path.exists(env_path):
        print("✅ .env file already exists")
        return
    
    print("📝 Creating .env file...")
    print("Please enter your AWS database connection details:")
    
    host = input("Database host (e.g., my-rds-instance.region.rds.amazonaws.com): ").strip()
    port = input("Database port (default: 5432): ").strip() or "5432"
    database = input("Database name: ").strip()
    username = input("Database username: ").strip()
    password = input("Database password: ").strip()
    
    database_url = f"postgresql://{username}:{password}@{host}:{port}/{database}"
    
    with open(env_path, 'w') as f:
        f.write(f"# AWS Database Configuration\n")
        f.write(f"SQLALCHEMY_DATABASE_URL={database_url}\n")
    
    print("✅ .env file created")

def main():
    print("🚀 Multi-Hostaway Account Setup")
    print("=" * 40)
    
    # Check requirements
    check_requirements()
    
    # Create .env file
    create_env_file()
    
    print("\n📋 Next steps:")
    print("1. Verify your .env file has the correct database connection")
    print("2. Run: python migrate_aws_database.py")
    print("3. Start your backend: python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
    print("4. Start your frontend: cd ../front-end && npm run dev")
    
    print("\n🎉 Setup complete! You can now use multiple Hostaway accounts.")

if __name__ == "__main__":
    main()

