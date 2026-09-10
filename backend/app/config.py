"""
CredVerify Backend – Environment Configuration (pydantic v1 BaseSettings)
Reads values from a .env file or real environment variables.
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App metadata
    app_name: str = "CredVerify API"
    app_version: str = "0.1.0"
    debug: bool = False

    # SQLite (local dev) – swap for a real URL in production
    database_url: str = "sqlite:///./credverify.db"

    # CORS – comma-separated list of allowed origins
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Local file uploads directory
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 15

    # Placeholder secret – replace before any real deployment
    secret_key: str = "changeme-use-a-real-secret-in-production"

    # Supabase Storage settings
    supabase_url: str | None = None
    supabase_secret_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_key: str | None = None
    supabase_storage_bucket: str = "credverify-documents"

    def get_supabase_url(self) -> str | None:
        """Return configured Supabase URL or auto-derive from DATABASE_URL."""
        if self.supabase_url:
            return self.supabase_url.rstrip("/")
        # Auto-derive from Supabase database host if present
        if "supabase.co" in self.database_url:
            import re
            m = re.search(r"@db\.([a-z0-9]+)\.supabase\.co", self.database_url)
            if m:
                return f"https://{m.group(1)}.supabase.co"
        return None

    def get_supabase_key(self) -> str | None:
        """Return the active Supabase secret/service key if available."""
        return (
            self.supabase_secret_key
            or self.supabase_service_role_key
            or self.supabase_key
        )

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()
