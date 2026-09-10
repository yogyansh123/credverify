"""
Service – Claim CRUD operations
"""
import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.claim import Claim
from app.schemas.claim import ClaimCreate
from app.services.user_service import get_user


def create_claim(db: Session, payload: ClaimCreate) -> Claim:
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{payload.user_id}' not found.",
        )

    now = datetime.now(timezone.utc)
    claim_status = payload.status if payload.status else "Pending"
    claim = Claim(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        source_document_id=payload.source_document_id,
        category=payload.category,
        claim_text=payload.claim_text,
        status=claim_status,
        details=payload.details,
        confidence_pct=payload.confidence_pct,
        created_at=now,
        updated_at=now,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def get_claims_for_user(db: Session, user_id: str) -> List[Claim]:
    import re
    from app.models.document import Document
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )
    claims = (
        db.query(Claim)
        .filter(Claim.user_id == user_id)
        .order_by(Claim.created_at.desc())
        .all()
    )
    user_docs = db.query(Document).filter(Document.user_id == user_id).all()
    doc_by_name = {d.original_name.lower(): d for d in user_docs if d.original_name}

    for c in claims:
        c_status = str(c.status.value if hasattr(c.status, "value") else c.status)
        matched_name = None
        matched_id = None

        if c.details:
            # Extract document name quoted in details, e.g. 'document_name.pdf'
            m = re.search(r"'(.*?\.[a-zA-Z0-9]+)'", c.details)
            if m:
                target_name = m.group(1)
                matched_name = target_name
                matched_d = doc_by_name.get(target_name.lower())
                if matched_d:
                    matched_id = matched_d.id

        if not matched_name:
            if c_status == "Match":
                for d in user_docs:
                    cat = (d.category or "").lower()
                    name = (d.original_name or "").lower()
                    if cat != "resume" and "resume" not in name and "cv" not in name:
                        matched_name = d.original_name
                        matched_id = d.id
                        break
            elif c_status == "Unsupported":
                matched_name = "No supporting document uploaded"
            elif c_status == "Pending":
                matched_name = "Self-Reported in Resume"

        setattr(c, "matched_document", matched_name)
        setattr(c, "matched_document_id", matched_id)

    return claims
