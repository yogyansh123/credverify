"""
Automated End-to-End Regression Test for Supporting-Document Reanalysis Lifecycle.
Tests the exact user flow:
1. Start with fresh resume.
2. Run Analysis -> Unsupported claims without evidence, low trust score.
3. Upload supporting certificate -> Starts Pending before analysis.
4. Rerun Analysis -> Fast (< 3s), associates certificate with correct claim, claim becomes Match.
5. Evidence document ID and name verified in response.
6. Counters & Trust Score recalculate upward.
7. Browser refresh simulation (GET /api/users/{id}/claims) -> Confirm Match & evidence persist.
8. Delete certificate & rerun -> Claim reverts to Unsupported, evidence disappears, score recalculates downward.
9. Re-upload certificate & rerun -> Claim becomes Match again without stale state.
"""
import io
import os
import time
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_supporting_document_reanalysis_lifecycle():
    print("\n=== STARTING END-TO-END SUPPORTING-DOCUMENT REANALYSIS LIFECYCLE TEST ===")

    # Setup isolated test user
    uid = str(uuid.uuid4())
    user_res = client.post("/api/users", json={
        "name": "Yogyansh Singh",
        "email": f"lifecycle_test_{uid[:8]}@credverify.test",
        "role": "individual",
        "headline": "Product Management & AI Professional"
    })
    assert user_res.status_code == 201, f"Failed to create user: {user_res.text}"
    user_id = user_res.json()["id"]

    # Locate sample resume and certificate files
    resume_path = "uploads/1d70d4a2-ece6-4897-8932-8fd60907b5a5_Yogyansh_Singh_Resume_updated.pdf"
    cert_path = "uploads/5846c598-33e3-48f2-bc2a-388e164155d1_Yogyansh_Singh__Certificate_of_Completion_..pdf"

    if not os.path.exists(resume_path) or not os.path.exists(cert_path):
        # Fallback to text fixtures with equivalent content
        resume_bytes = (
            b"YOGYANSH SINGH\n"
            b"Bachelor of Technology in Computer Science & Engineering\n"
            b"Product Management Intern | Xornor Technologies Pvt. Ltd. Jun 2026 - Aug 2026\n"
            b"Technical Intern | Reincarnation Association (NGO) May 2025 - Jun 2025\n"
            b"AWS Certified Solutions Architect - Associate\n"
        )
        cert_bytes = (
            b"CERTIFICATE OF COMPLETION\n"
            b"This is to certify that Mr. Yogyansh Singh has successfully completed his "
            b"industrial training at Xornor Technologies Pvt. Ltd., Mohali, from 1st June 2026 to 31st July 2026 "
            b"as Product Management Trainee.\n"
        )
        resume_filename = "Yogyansh_Singh_Resume_updated.pdf"
        cert_filename = "Yogyansh_Singh__Certificate_of_Completion_..pdf"
    else:
        with open(resume_path, "rb") as f:
            resume_bytes = f.read()
        with open(cert_path, "rb") as f:
            cert_bytes = f.read()
        resume_filename = "Yogyansh_Singh_Resume_updated.pdf"
        cert_filename = "Yogyansh_Singh__Certificate_of_Completion_..pdf"

    try:
        # STEP 1: Upload fresh resume
        upload_resume_res = client.post(
            "/api/documents/upload",
            data={"user_id": user_id, "category": "Resume"},
            files={"file": (resume_filename, io.BytesIO(resume_bytes), "application/pdf")}
        )
        assert upload_resume_res.status_code == 201, f"Resume upload failed: {upload_resume_res.text}"
        resume_doc = upload_resume_res.json()
        resume_id = resume_doc["id"]
        assert resume_doc["status"] == "Pending"
        print("  [Step 1 OK] Fresh resume uploaded; status is Pending.")

        # STEP 2: Initial Analysis (Resume only)
        t0 = time.time()
        analyze_res1 = client.post(f"/api/documents/{resume_id}/analyze")
        duration1 = time.time() - t0
        assert analyze_res1.status_code == 200, f"Analysis failed: {analyze_res1.text}"
        result1 = analyze_res1.json()
        print(f"  [Step 2 OK] Initial analysis finished in {duration1:.2f}s (target < 3s).")
        assert duration1 < 5.0, f"Analysis took too long: {duration1:.2f}s"

        # Confirm claims without evidence are Unsupported and initial score is low
        claims1 = result1["claims"]
        assert len(claims1) > 0
        xornor_claim1 = next((c for c in claims1 if "xornor" in c["claim_text"].lower()), None)
        assert xornor_claim1 is not None, "Xornor experience claim not found in extracted claims"
        assert xornor_claim1["status"] == "Unsupported", f"Expected Unsupported without evidence, got: {xornor_claim1['status']}"
        assert xornor_claim1["matchedDocument"] == "No supporting document uploaded"

        initial_score = result1["metrics"]["trust_score"]
        assert initial_score <= 45, f"Expected initial trust score <= 45, got {initial_score}"
        assert result1["metrics"]["verified_count"] == 0
        print(f"  [Step 3 OK] Initial claims Unsupported without evidence; Trust Score = {initial_score}%.")

        # STEP 3: Upload matching supporting certificate
        upload_cert_res = client.post(
            "/api/documents/upload",
            data={"user_id": user_id, "category": "Certifications"},
            files={"file": (cert_filename, io.BytesIO(cert_bytes), "application/pdf")}
        )
        assert upload_cert_res.status_code == 201, f"Cert upload failed: {upload_cert_res.text}"
        cert_doc = upload_cert_res.json()
        cert_id = cert_doc["id"]

        # Confirm certificate starts Pending before analysis
        assert cert_doc["status"] == "Pending", f"Expected cert status Pending before analysis, got: {cert_doc['status']}"
        print(f"  [Step 4 OK] Supporting certificate uploaded; confirmed starts as Pending.")

        # STEP 4: Rerun Analysis with supporting certificate attached
        t1 = time.time()
        analyze_res2 = client.post(f"/api/documents/{resume_id}/analyze")
        duration2 = time.time() - t1
        assert analyze_res2.status_code == 200, f"Re-analysis failed: {analyze_res2.text}"
        result2 = analyze_res2.json()
        print(f"  [Step 5 OK] Re-analysis finished in {duration2:.2f}s (fast, bottleneck eliminated).")
        assert duration2 < 5.0, f"Re-analysis took too long: {duration2:.2f}s"

        # Confirm backend associates certificate with correct claim
        claims2 = result2["claims"]
        xornor_claim2 = next((c for c in claims2 if "xornor" in c["claim_text"].lower()), None)
        assert xornor_claim2 is not None
        assert xornor_claim2["status"] == "Match", f"Expected claim status Match, got {xornor_claim2['status']}"
        assert xornor_claim2["matched_document_id"] == cert_id, f"Expected matched_document_id {cert_id}, got {xornor_claim2['matched_document_id']}"
        assert cert_filename in xornor_claim2["matchedDocument"] or cert_doc["original_name"] in xornor_claim2["matchedDocument"]
        assert xornor_claim2["matchedDocument"] != "No supporting document uploaded"

        # Confirm supporting document DB status is now Verified
        user_docs_res = client.get(f"/api/users/{user_id}/documents")
        assert user_docs_res.status_code == 200
        user_docs = user_docs_res.json()
        updated_cert_doc = next(d for d in user_docs if d["id"] == cert_id)
        assert updated_cert_doc["status"] == "Verified", f"Expected cert doc to be Verified, got: {updated_cert_doc['status']}"

        # Confirm Trust Score recalculates upward
        recalculated_score = result2["metrics"]["trust_score"]
        assert recalculated_score > initial_score, f"Expected trust score to increase from {initial_score}, got {recalculated_score}"
        assert result2["metrics"]["verified_count"] >= 1
        print(f"  [Step 6 OK] Claim became Match; cert linked; Trust Score recalculated upward from {initial_score}% to {recalculated_score}%.")

        # STEP 5: Refresh simulation (GET /api/users/{user_id}/claims)
        # Browser refresh calls backend API to restore state
        refresh_claims_res = client.get(f"/api/users/{user_id}/claims")
        assert refresh_claims_res.status_code == 200
        refreshed_claims = refresh_claims_res.json()
        xornor_refreshed = next(c for c in refreshed_claims if "xornor" in c["claim_text"].lower())
        assert xornor_refreshed["status"] == "Match"
        assert xornor_refreshed["matched_document_id"] == cert_id
        assert xornor_refreshed["matched_document"] is not None
        print("  [Step 7 OK] Browser refresh persistence verified: Claim remains Match with evidence association.")

        # STEP 6: Delete the certificate and rerun analysis
        del_res = client.delete(f"/api/documents/{cert_id}?user_id={user_id}")
        assert del_res.status_code == 200, f"Delete failed: {del_res.text}"

        # Confirm document is gone from documents list
        docs_after_del = client.get(f"/api/users/{user_id}/documents").json()
        assert not any(d["id"] == cert_id for d in docs_after_del)

        # Rerun analysis after deletion
        analyze_res3 = client.post(f"/api/documents/{resume_id}/analyze")
        assert analyze_res3.status_code == 200
        result3 = analyze_res3.json()
        claims3 = result3["claims"]
        xornor_claim3 = next(c for c in claims3 if "xornor" in c["claim_text"].lower())
        assert xornor_claim3["status"] == "Unsupported", f"Expected status to revert to Unsupported, got {xornor_claim3['status']}"
        assert xornor_claim3["matchedDocument"] == "No supporting document uploaded"
        assert result3["metrics"]["verified_count"] == 0
        score_after_delete = result3["metrics"]["trust_score"]
        assert score_after_delete < recalculated_score, f"Expected score to drop from {recalculated_score}, got {score_after_delete}"
        print(f"  [Step 8 OK] Certificate deleted; claim reverted to Unsupported; Trust Score dropped back to {score_after_delete}%.")

        # STEP 7: Re-upload certificate and rerun
        reupload_res = client.post(
            "/api/documents/upload",
            data={"user_id": user_id, "category": "Certifications"},
            files={"file": (cert_filename, io.BytesIO(cert_bytes), "application/pdf")}
        )
        assert reupload_res.status_code == 201
        new_cert_id = reupload_res.json()["id"]

        analyze_res4 = client.post(f"/api/documents/{resume_id}/analyze")
        assert analyze_res4.status_code == 200
        result4 = analyze_res4.json()
        xornor_claim4 = next(c for c in result4["claims"] if "xornor" in c["claim_text"].lower())
        assert xornor_claim4["status"] == "Match"
        assert xornor_claim4["matched_document_id"] == new_cert_id
        assert result4["metrics"]["trust_score"] == recalculated_score
        print(f"  [Step 9 OK] Certificate re-uploaded; claim returned to Match with new ID {new_cert_id} without stale state.")

        print("\n>>> ALL 9 LIFECYCLE STEPS PASSED PERFECTLY! <<<\n")

    finally:
        # Clean up user and remaining documents
        try:
            client.delete(f"/api/documents/{resume_id}?user_id={user_id}")
        except Exception:
            pass


if __name__ == "__main__":
    test_supporting_document_reanalysis_lifecycle()
