#!/usr/bin/env python3
"""
AWS Database Migration Script
Adds support for multiple Hostaway accounts by adding new columns to the hostawayaccounts table.

Run this script to update your AWS database schema:
python migrate_aws_database.py
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv('SQLALCHEMY_DATABASE_URL')
    if not database_url:
        print("❌ Error: SQLALCHEMY_DATABASE_URL not found in environment variables")
        print("Please set your AWS database connection string in the .env file")
        sys.exit(1)
    
    try:
        # Parse the database URL
        if database_url.startswith('postgresql://'):
            conn = psycopg2.connect(database_url)
        else:
            print("❌ Error: Invalid database URL format. Expected postgresql://")
            sys.exit(1)
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)

def check_table_exists(cursor, table_name):
    """Check if table exists in the database"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
    """, (table_name,))
    return cursor.fetchone()[0]

def check_column_exists(cursor, table_name, column_name):
    """Check if column exists in the table"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s 
            AND column_name = %s
        );
    """, (table_name, column_name))
    return cursor.fetchone()[0]

def migrate_database():
    """Run the database migration"""
    print("🚀 Starting AWS Database Migration for Multi-Hostaway Account Support")
    print("=" * 70)
    
    # Connect to database
    print("📡 Connecting to AWS database...")
    conn = get_database_connection()
    cursor = conn.cursor()
    
    try:
        # Check if hostawayaccounts table exists
        if not check_table_exists(cursor, 'hostawayaccounts'):
            print("❌ Error: hostawayaccounts table does not exist")
            print("Please ensure your database schema is properly set up")
            sys.exit(1)
        
        print("✅ hostawayaccounts table found")
        
        # Check current table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'hostawayaccounts'
            ORDER BY ordinal_position;
        """)
        
        current_columns = cursor.fetchall()
        print(f"📋 Current table has {len(current_columns)} columns:")
        for col in current_columns:
            print(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
        
        # Add account_name column if it doesn't exist
        if not check_column_exists(cursor, 'hostawayaccounts', 'account_name'):
            print("➕ Adding account_name column...")
            cursor.execute("""
                ALTER TABLE hostawayaccounts 
                ADD COLUMN account_name VARCHAR(255);
            """)
            print("✅ account_name column added")
        else:
            print("✅ account_name column already exists")
        
        # Add is_active column if it doesn't exist
        if not check_column_exists(cursor, 'hostawayaccounts', 'is_active'):
            print("➕ Adding is_active column...")
            cursor.execute("""
                ALTER TABLE hostawayaccounts 
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
            """)
            print("✅ is_active column added")
        else:
            print("✅ is_active column already exists")
        
        # Update existing records to have is_active = true
        print("🔄 Updating existing records...")
        cursor.execute("""
            UPDATE hostawayaccounts 
            SET is_active = TRUE 
            WHERE is_active IS NULL;
        """)
        updated_rows = cursor.rowcount
        print(f"✅ Updated {updated_rows} existing records")
        
        # Set default account names for existing records
        cursor.execute("""
            UPDATE hostawayaccounts 
            SET account_name = 'Account ' || id::text
            WHERE account_name IS NULL;
        """)
        named_rows = cursor.rowcount
        print(f"✅ Set default names for {named_rows} existing records")
        
        # Verify the migration
        print("\n🔍 Verifying migration...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'hostawayaccounts'
            ORDER BY ordinal_position;
        """)
        
        final_columns = cursor.fetchall()
        print(f"📋 Final table has {len(final_columns)} columns:")
        for col in final_columns:
            print(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
        
        # Check data
        cursor.execute("SELECT COUNT(*) FROM hostawayaccounts WHERE is_active = TRUE;")
        active_count = cursor.fetchone()[0]
        print(f"📊 Active Hostaway accounts: {active_count}")
        
        print("\n🎉 Migration completed successfully!")
        print("✅ Your AWS database now supports multiple Hostaway accounts")
        print("✅ You can now connect up to 3 Hostaway accounts per user")
        print("✅ Each account can have a custom name")
        print("✅ Accounts can be activated/deactivated")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔄 Rolling back changes...")
        conn.rollback()
        sys.exit(1)
    
    finally:
        cursor.close()
        conn.close()
        print("\n📡 Database connection closed")

if __name__ == "__main__":
    print("Multi-Hostaway Account Database Migration")
    print("This script will add support for multiple Hostaway accounts to your AWS database")
    print()
    
    # Confirm before proceeding
    response = input("Do you want to proceed with the migration? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("❌ Migration cancelled")
        sys.exit(0)
    
    migrate_database()

