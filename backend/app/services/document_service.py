"""
Service – Document CRUD operations
"""
import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.document import Document
from app.schemas.document import DocumentCreate
from app.services.user_service import get_user


def auto_detect_category(
    filename: str,
    fallback_category: str = None,
    file_path: str = None,
    mime_type: str = None,
) -> str:
    """
    Ensure uploaded files are categorized correctly from filename and/or content.
    E.g. A Certificate of Completion or AWS cert or Xornor internship or Marksheet
    should automatically be classified into its proper credential category.
    """
    fn = (filename or "").lower()

    # 1. Filename keyword checks — ordered from most-specific/unambiguous to least.
    # Priority: Resume > Experience Letter > Degree/Marksheet > Certifications > Govt ID > Other
    # This prevents substring matches like 'cert' inside 'Experience Certificate' or
    # 'BTech Degree Certificate' from mis-classifying to Certifications.
    if any(k in fn for k in ["resume", "cv", "curriculum", "biodata", "bio_data"]):
        return "Resume"
    if any(k in fn for k in ["xornor", "experience", "internship", "intern", "trainee", "relieving", "offer", "service_letter", "service_cert", "employment", "recommendation", "training"]):
        return "Experience Letter"
    if any(k in fn for k in ["degree", "transcript", "marksheet", "diploma", "graduation", "btech", "b.tech", "mtech", "m.tech", "bachelor", "masters", "master of", "semester", "gradecard", "grade_sheet", "convocation", "university"]):
        return "Degree / Marksheet"
    if any(k in fn for k in ["aws", "azure", "gcp", "cert", "badge", "license", "coursera", "udemy", "credly", "pmp", "cissp", "comptia", "scrum"]):
        return "Certifications"
    if any(k in fn for k in ["passport", "national_id", "aadhaar", "aadhar", "pan", "driving", "license", "voter", "gov_id", "identity"]):
        return "Government ID"
    if any(k in fn for k in ["paper", "publication", "patent", "journal", "ieee"]):
        return "Other Document"

    # 2. If ambiguous or generic filename, inspect content if file_path exists
    if file_path:
        try:
            import os
            if os.path.exists(file_path):
                from app.services.analysis_service import extract_text_from_file
                text = (extract_text_from_file(file_path, mime_type or "") or "").lower()[:4000]
                if text:
                    if any(k in text for k in ["resume", "curriculum vitae", "summary of experience", "work history", "technical skills", "professional summary"]):
                        return "Resume"
                    if any(k in text for k in ["to whomsoever it may concern", "relieving letter", "experience certificate", "internship certificate", "industrial training", "product management trainee", "worked with us", "period of employment", "training completion"]):
                        return "Experience Letter"
                    if any(k in text for k in ["certificate of completion", "certifies that", "amazon web services", "aws certified", "solutions architect", "cloud practitioner", "credential id"]):
                        return "Certifications"
                    if any(k in text for k in ["statement of marks", "grade card", "marksheet", "degree of bachelor", "bachelor of technology", "master of", "board of technical education", "semester examination", "cumulative grade", "cgpa", "sgpa", "provisional certificate"]):
                        return "Degree / Marksheet"
                    if any(k in text for k in ["government of india", "income tax department", "unique identification authority", "republic of india", "election commission", "driving licence", "passport"]):
                        return "Government ID"
                    if any(k in text for k in ["abstract", "proceedings", "published by", "patent", "ieee"]):
                        return "Other Document"
        except Exception:
            pass

    return fallback_category or "Other Document"


def create_document(db: Session, payload: DocumentCreate) -> Document:
    # Validate the owner exists
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{payload.user_id}' not found.",
        )

    category = auto_detect_category(payload.original_name, payload.category)
    stored_name = f"{uuid.uuid4()}_{payload.original_name}"
    now = datetime.now(timezone.utc)

    doc = Document(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        original_name=payload.original_name,
        stored_name=stored_name,
        category=category,
        file_size_bytes=payload.file_size_bytes,
        mime_type=payload.mime_type,
        status="Pending",
        extracted_claims_count=0,
        uploaded_at=now,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document_by_id(db: Session, document_id: str) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )
    return doc


def get_documents_for_user(db: Session, user_id: str) -> List[Document]:
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


async def save_uploaded_file(
    db: Session,
    user_id: str,
    category: str,
    file,
) -> Document:
    import os
    import re
    from app.config import get_settings

    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )

    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Sanitize original filename
    original_filename = file.filename or "uploaded_document.pdf"
    safe_name = os.path.basename(original_filename)
    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', safe_name)

    # Read bytes
    contents = await file.read()

    # Prevent duplicate document upload for the same user with identical filename & file size
    existing_doc = (
        db.query(Document)
        .filter(
            Document.user_id == user_id,
            Document.original_name == (file.filename or safe_name),
            Document.file_size_bytes == len(contents)
        )
        .first()
    )
    if existing_doc:
        return existing_doc

    doc_uuid = str(uuid.uuid4())
    stored_name = f"{doc_uuid}_{safe_name}"
    storage_path = f"{user_id}/{stored_name}"

    from app.services.storage_service import storage_service
    saved_storage_path = storage_service.upload_file(
        file_bytes=contents,
        destination_path=storage_path,
        mime_type=file.content_type or "application/pdf"
    )

    detected_category = auto_detect_category(
        filename=file.filename or safe_name,
        fallback_category=category,
        file_path=os.path.join(settings.upload_dir, stored_name),
        mime_type=file.content_type or "application/pdf"
    )
    now = datetime.now(timezone.utc)
    doc = Document(
        id=doc_uuid,
        user_id=user_id,
        original_name=file.filename or safe_name,
        stored_name=stored_name,
        storage_path=saved_storage_path or storage_path,
        category=detected_category,
        file_size_bytes=len(contents),
        mime_type=file.content_type or "application/pdf",
        status="Pending",
        extracted_claims_count=0,
        uploaded_at=now,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, document_id: str, user_id: str = None) -> dict:
    """
    Delete document by ID.
    1. Validates document existence (404 if not found).
    2. Validates ownership if user_id is provided (403 if document belongs to another user).
    3. Deletes associated stored file from Supabase Storage and local cache if present.
    4. Deletes any claims derived from this document.
    5. Unlinks any credentials referencing this document.
    6. Deletes document record from database.
    """
    import os
    from app.config import get_settings
    from app.models.claim import Claim
    from app.models.credential import Credential
    from app.services.storage_service import storage_service

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )

    if user_id and doc.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Document '{document_id}' does not belong to user '{user_id}'.",
        )

    # Delete from Supabase Storage and local disk cache
    target_storage_path = getattr(doc, "storage_path", None) or (f"{doc.user_id}/{doc.stored_name}" if doc.stored_name else None)
    if target_storage_path:
        storage_service.delete_file(target_storage_path)
    if doc.stored_name:
        storage_service.delete_file(doc.stored_name)

    # Clean up any claims directly associated with this document if it was the source doc
    db.query(Claim).filter(Claim.source_document_id == doc.id).delete(synchronize_session=False)

    # Unlink any credentials referencing this document
    db.query(Credential).filter(Credential.document_id == doc.id).update({"document_id": None}, synchronize_session=False)

    db.delete(doc)
    db.commit()

    return {
        "success": True,
        "message": f"Document '{document_id}' deleted successfully.",
        "id": document_id
    }

