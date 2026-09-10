"""
Routes – Documents
POST /api/documents                       – register document upload metadata
GET  /api/users/{user_id}/documents       – list all documents for a user
"""
import os
from typing import List, Any, Dict, Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Query, Header, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.document_service import (
    create_document,
    get_documents_for_user,
    get_document_by_id,
    save_uploaded_file,
    delete_document,
)
from app.services.analysis_service import analyze_document

router = APIRouter(tags=["Documents"])


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def register_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    """
    Register document upload metadata.
    The actual file binary is not stored here – only the metadata (name, category,
    size, MIME type). Status starts as 'Pending' until analysis runs.
    """
    return create_document(db, payload)


@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    category: str = Form("Resume"),
    db: Session = Depends(get_db),
):
    """
    Upload real document file to backend storage and register document metadata in database.
    """
    return await save_uploaded_file(db, user_id, category, file)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_single_document(document_id: str, db: Session = Depends(get_db)):
    """Return single document by ID."""
    return get_document_by_id(db, document_id)


@router.get("/documents/{document_id}/file")
def view_document_file(
    document_id: str,
    user_id: Optional[str] = Query(None),
    header_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db),
):
    """
    Open/stream stored document file inline in browser tab (e.g. native PDF viewer).
    Preserves user ownership isolation: if user_id is provided, verifies that
    the document belongs to the active user.
    """
    doc = get_document_by_id(db, document_id)
    effective_user_id = user_id or header_user_id
    if effective_user_id and doc.user_id != effective_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Document does not belong to active user.",
        )
    from app.services.storage_service import storage_service
    from fastapi import Response

    target_storage_path = (
        getattr(doc, "storage_path", None)
        or (f"{doc.user_id}/{doc.stored_name}" if doc.stored_name else None)
        or doc.stored_name
    )
    file_bytes = storage_service.download_file(target_storage_path)
    if not file_bytes and doc.stored_name:
        file_bytes = storage_service.download_file(doc.stored_name)

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stored file '{doc.original_name}' not found in storage.",
        )

    safe_filename = doc.original_name.replace('"', '')
    return Response(
        content=file_bytes,
        media_type=doc.mime_type or "application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"',
            "Content-Length": str(len(file_bytes)),
        },
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
def remove_document(
    document_id: str,
    user_id: Optional[str] = Query(None),
    header_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    db: Session = Depends(get_db),
):
    """
    Delete a document by ID.
    Validates ownership if user_id is provided, deletes stored file from disk,
    and removes record from database.
    """
    effective_user_id = user_id or header_user_id
    return delete_document(db, document_id, effective_user_id)


@router.post("/documents/{document_id}/analyze")
def run_document_analysis(document_id: str, db: Session = Depends(get_db)):
    """
    Run local text extraction, claims identification, supporting doc cross-referencing,
    and trust scoring on an uploaded document.
    """
    doc = get_document_by_id(db, document_id)
    return analyze_document(db, doc)


@router.get("/users/{user_id}/documents", response_model=List[DocumentResponse])
def list_user_documents(user_id: str, db: Session = Depends(get_db)):
    """Return all documents uploaded by a specific user, newest first."""
    return get_documents_for_user(db, user_id)

