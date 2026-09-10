"""
CredVerify Supabase PostgreSQL Connection Verification Script.
- Connects using DATABASE_URL (from backend/.env or environment).
- Never logs or exposes database credentials/passwords.
- Non-destructively ensures model tables exist (create_all).
- Verifies connection and table accessibility.
- Verifies that SQLite backup (credverify.db) is untouched.
"""
import sys
import os
import re
from pathlib import Path
from sqlalchemy import text, inspect

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import get_settings
from app.database import engine, Base
import app.models  # Ensure all models are registered with Base.metadata


def mask_url(text: str) -> str:
    """Mask password in connection string or error message for safe printing."""
    s = re.sub(r':([^:@\s/]+)@', ':***@', text)
    s = re.sub(r'password=([^\s]+)', 'password=***', s)
    # Also extract and mask any password from settings if available
    try:
        from urllib.parse import urlparse
        settings = get_settings()
        parsed = urlparse(settings.database_url)
        if parsed.password:
            s = s.replace(parsed.password, "***")
            from urllib.parse import unquote
            s = s.replace(unquote(parsed.password), "***")
    except Exception:
        pass
    return s


def verify_connection():
    settings = get_settings()
    raw_url = settings.database_url
    safe_url = mask_url(raw_url)

    print("=" * 60)
    print("CredVerify Database Connection Verification")
    print("=" * 60)
    print(f"Target Database URL: {safe_url}")
    print(f"Engine Dialect:      {engine.dialect.name}")

    if raw_url.startswith("sqlite"):
        print("\n[WARNING] Active DATABASE_URL is SQLite, not Supabase PostgreSQL.")
        print("Please configure DATABASE_URL in backend/.env with your Supabase connection string.")
        return False

    print("\n1. Testing network and authentication connection to Supabase...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1;")).scalar()
            version = conn.execute(text("SELECT version();")).scalar()
            print(f"   [SUCCESS] Connected to Supabase PostgreSQL!")
            print(f"   PostgreSQL Version: {version.split(',')[0]}")
    except Exception as e:
        safe_error = mask_url(str(e))
        print(f"   [FAILED] Could not connect to Supabase: {safe_error}")
        return False

    print("\n2. Verifying / creating CredVerify model tables (non-destructive)...")
    try:
        Base.metadata.create_all(bind=engine)
        print("   [SUCCESS] Base.metadata.create_all executed successfully.")
    except Exception as e:
        safe_error = mask_url(str(e))
        print(f"   [FAILED] Failed to create/verify tables: {safe_error}")
        return False

    print("\n3. Inspecting table existence in Supabase database...")
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        expected_tables = ["users", "documents", "claims", "credentials"]
        
        all_found = True
        for table in expected_tables:
            if table in existing_tables:
                print(f"   [OK] Table '{table}' exists.")
            else:
                print(f"   [MISSING] Table '{table}' was not found.")
                all_found = False

        if not all_found:
            return False
    except Exception as e:
        safe_error = mask_url(str(e))
        print(f"   [FAILED] Table inspection failed: {safe_error}")
        return False

    print("\n4. Checking SQLite backup preservation...")
    sqlite_path = backend_dir / "credverify.db"
    if sqlite_path.exists():
        size_kb = sqlite_path.stat().st_size / 1024
        print(f"   [OK] SQLite backup intact: {sqlite_path.name} ({size_kb:.1f} KB)")
    else:
        print("   [NOTE] SQLite database not found at standard path.")

    print("\n" + "=" * 60)
    print(">>> SUPABASE POSTGRESQL CONNECTION & SCHEMA VERIFIED SUCCESSFULLY! <<<")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = verify_connection()
    sys.exit(0 if success else 1)
