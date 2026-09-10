"""
Service – Supabase Storage integration for persistent credential documents.
Manages private bucket storage ('credverify-documents'), file uploads, downloads,
and deletions with automatic local fallback for offline/development environments.
"""
import os
import re
from pathlib import Path
from typing import Optional

from app.config import get_settings


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self.bucket_name = self.settings.supabase_storage_bucket or "credverify-documents"
        self.supabase_url = self.settings.get_supabase_url()
        self.supabase_key = self.settings.get_supabase_key()
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize the Supabase Storage client if credentials are configured."""
        if not self.supabase_url or not self.supabase_key:
            return

        try:
            from storage3 import SyncStorageClient

            headers = {
                "apiKey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
            }
            storage_url = f"{self.supabase_url.rstrip('/')}/storage/v1"
            self.client = SyncStorageClient(storage_url, headers)
            self._ensure_bucket_exists()
        except Exception as exc:
            # Mask any credentials in log output
            err_msg = re.sub(r':([^:@\s/]+)@', ':***@', str(exc))
            print(f"[StorageService] Notice: Cloud storage client initialization deferred: {err_msg}")
            self.client = None

    def _ensure_bucket_exists(self):
        """Ensure the private bucket exists in Supabase Storage."""
        if not self.client:
            return
        try:
            self.client.get_bucket(self.bucket_name)
        except Exception:
            try:
                self.client.create_bucket(
                    self.bucket_name,
                    options={"public": False}
                )
            except Exception:
                pass

    @property
    def is_cloud_enabled(self) -> bool:
        """True if authenticated Supabase Storage client is active."""
        return self.client is not None

    def upload_file(
        self,
        file_bytes: bytes,
        destination_path: str,
        mime_type: str = "application/pdf"
    ) -> str:
        """
        Upload file to Supabase Storage private bucket.
        Also caches to local upload_dir for high-performance OCR and analysis.
        Returns the persistent storage path.
        """
        # Always maintain local copy in upload_dir for OCR & offline access
        local_filename = os.path.basename(destination_path)
        os.makedirs(self.settings.upload_dir, exist_ok=True)
        local_path = os.path.join(self.settings.upload_dir, local_filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        if self.is_cloud_enabled:
            try:
                # destination_path format: e.g. "{user_id}/{filename}"
                clean_path = destination_path.replace("\\", "/").lstrip("/")
                self.client.from_(self.bucket_name).upload(
                    path=clean_path,
                    file=file_bytes,
                    file_options={"content-type": mime_type, "upsert": "true"}
                )
                return clean_path
            except Exception as exc:
                err_msg = re.sub(r':([^:@\s/]+)@', ':***@', str(exc))
                print(f"[StorageService] Warning: Upload to Supabase Storage failed, saved locally: {err_msg}")

        return destination_path

    def download_file(self, storage_path: str) -> Optional[bytes]:
        """
        Fetch file bytes from Supabase Storage, or from local upload_dir if cached.
        """
        # 1. Try cloud storage if enabled
        if self.is_cloud_enabled and storage_path:
            try:
                clean_path = storage_path.replace("\\", "/").lstrip("/")
                data = self.client.from_(self.bucket_name).download(clean_path)
                if data:
                    return data
            except Exception:
                pass

        # 2. Try local cache in upload_dir
        local_filename = os.path.basename(storage_path)
        local_path = os.path.join(self.settings.upload_dir, local_filename)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()

        return None

    def delete_file(self, storage_path: str) -> bool:
        """
        Delete file from Supabase Storage and local cache.
        """
        success = True

        # 1. Delete from Supabase Storage
        if self.is_cloud_enabled and storage_path:
            try:
                clean_path = storage_path.replace("\\", "/").lstrip("/")
                self.client.from_(self.bucket_name).remove([clean_path])
            except Exception as exc:
                success = False

        # 2. Delete local cache file
        local_filename = os.path.basename(storage_path)
        local_path = os.path.join(self.settings.upload_dir, local_filename)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except OSError:
                pass

        return success

    def create_signed_url(self, storage_path: str, expires_in: int = 300) -> Optional[str]:
        """Create a temporary signed URL for private bucket access."""
        if not self.is_cloud_enabled or not storage_path:
            return None
        try:
            clean_path = storage_path.replace("\\", "/").lstrip("/")
            res = self.client.from_(self.bucket_name).create_signed_url(clean_path, expires_in)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            return getattr(res, "signed_url", None)
        except Exception:
            return None


# Global singleton instance
storage_service = StorageService()
