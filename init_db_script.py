import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

# Parse DATABASE_URL to get credentials (assuming default format for now)
# postgresql+asyncpg://postgres:admin@localhost:5432/boutique_staffing
db_url = os.getenv("DATABASE_URL")
# extremely basic parsing for the immediate need
user = "postgres"
password = "admin"
host = "localhost"
port = "5432"
dbname = "boutique_staffing"

def create_database():
    try:
        # Connect to default 'postgres' database to create the new one
        con = psycopg2.connect(dbname="postgres", user=user, host=host, password=password, port=port)
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Database '{dbname}' does not exist. Creating...")
            cur.execute(f"CREATE DATABASE {dbname}")
            print(f"Database '{dbname}' created successfully.")
        else:
            print(f"Database '{dbname}' already exists.")
            
        cur.close()
        con.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database()
