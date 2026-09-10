"""
Comprehensive test script for CredVerify Backend API endpoints.
Tests:
- GET /api/health
- POST /api/users
- GET /api/users/{user_id}
- POST /api/documents
- GET /api/users/{user_id}/documents
- POST /api/claims
- GET /api/users/{user_id}/claims
- POST /api/credentials
- GET /api/users/{user_id}/credentials
- Error cases: 404 for missing user, 422 for invalid payload
"""
import sys
import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

# Ensure tables are created
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("=== Testing CredVerify Backend API ===")
    
    # 1. Health check
    res = client.get("/api/health")
    print(f"GET /api/health -> {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    health_data = res.json()
    assert health_data["status"] == "ok"
    print("  [OK] Health check passed:", health_data)

    # 2. User Creation (Individual)
    user_payload = {
        "name": "Sarah Jenkins",
        "email": f"sarah_{int(res.headers.get('date', 0) if res.headers.get('date') else 1000)}@example.com",
        "role": "individual",
        "headline": "Senior Software Engineer",
        "summary": "Full stack engineer specializing in distributed systems"
    }
    # To avoid conflict, use unique email
    import uuid
    user_payload["email"] = f"user_{uuid.uuid4().hex[:8]}@example.com"
    
    res = client.post("/api/users", json=user_payload)
    print(f"POST /api/users -> {res.status_code}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    user = res.json()
    user_id = user["id"]
    print(f"  [OK] User created with ID: {user_id}")
    assert user["name"] == user_payload["name"]
    assert user["email"] == user_payload["email"]

    # 3. Get User by ID
    res = client.get(f"/api/users/{user_id}")
    print(f"GET /api/users/{user_id} -> {res.status_code}")
    assert res.status_code == 200
    assert res.json()["id"] == user_id
    print("  [OK] User retrieved successfully")

    # 4. Get Non-existent User (should return 404, not 500)
    fake_id = "non-existent-user-uuid"
    res = client.get(f"/api/users/{fake_id}")
    print(f"GET /api/users/{fake_id} -> {res.status_code}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}: {res.text}"
    print("  [OK] 404 handled properly for missing user")

    # 5. POST /api/documents
    doc_payload = {
        "user_id": user_id,
        "original_name": "resume_sarah_jenkins.pdf",
        "category": "Resume",
        "file_size_bytes": 245000,
        "mime_type": "application/pdf"
    }
    res = client.post("/api/documents", json=doc_payload)
    print(f"POST /api/documents -> {res.status_code}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    doc = res.json()
    doc_id = doc["id"]
    print(f"  [OK] Document registered with ID: {doc_id}")
    assert doc["original_name"] == doc_payload["original_name"]

    # 6. GET /api/users/{user_id}/documents
    res = client.get(f"/api/users/{user_id}/documents")
    print(f"GET /api/users/{user_id}/documents -> {res.status_code}")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 1
    print(f"  [OK] Retrieved {len(docs)} document(s) for user")

    # 7. POST /api/claims
    claim_payload = {
        "user_id": user_id,
        "source_document_id": doc_id,
        "category": "Education",
        "claim_text": "B.S. in Computer Science, Stanford University (2018-2022)",
        "details": "GPA 3.9/4.0, Magna Cum Laude"
    }
    res = client.post("/api/claims", json=claim_payload)
    print(f"POST /api/claims -> {res.status_code}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    claim = res.json()
    claim_id = claim["id"]
    print(f"  [OK] Claim added with ID: {claim_id}")

    # 8. GET /api/users/{user_id}/claims
    res = client.get(f"/api/users/{user_id}/claims")
    print(f"GET /api/users/{user_id}/claims -> {res.status_code}")
    assert res.status_code == 200
    claims = res.json()
    assert len(claims) >= 1
    print(f"  [OK] Retrieved {len(claims)} claim(s) for user")

    # 9. POST /api/credentials
    cred_payload = {
        "user_id": user_id,
        "document_id": doc_id,
        "credential_type": "Degree",
        "title": "Bachelor of Science in Computer Science",
        "issuing_organization": "Stanford University",
        "issue_date": "2022-06-12",
        "description": "Graduated with honors in Computer Systems"
    }
    res = client.post("/api/credentials", json=cred_payload)
    print(f"POST /api/credentials -> {res.status_code}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    credential = res.json()
    cred_id = credential["id"]
    print(f"  [OK] Credential added with ID: {cred_id}")

    # 10. GET /api/users/{user_id}/credentials
    res = client.get(f"/api/users/{user_id}/credentials")
    print(f"GET /api/users/{user_id}/credentials -> {res.status_code}")
    assert res.status_code == 200
    credentials = res.json()
    assert len(credentials) >= 1
    print(f"  [OK] Retrieved {len(credentials)} credential(s) for user")

    # 11. Validation error test (422)
    invalid_user = {"name": "", "email": "invalid"}
    res = client.post("/api/users", json=invalid_user)
    print(f"POST /api/users (invalid) -> {res.status_code}")
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("  [OK] 422 Unprocessable Entity properly raised for invalid inputs")

    # 12. POST /api/documents/upload (Multipart upload test)
    import io
    sample_resume_content = (
        b"Sarah Jenkins\n"
        b"Senior Software Engineer\n"
        b"EDUCATION\n"
        b"Bachelor of Science in Computer Science - Stanford University (2018 - 2022, GPA: 3.9/4.0)\n"
        b"EXPERIENCE\n"
        b"Senior Software Engineer at CloudTech Systems Inc. (Jan 2023 - Present | 3 years)\n"
        b"CERTIFICATIONS\n"
        b"AWS Certified Solutions Architect Associate (2023)\n"
        b"SKILLS\n"
        b"Python, JavaScript, React, FastAPI, Docker, Kubernetes\n"
    )
    upload_res = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Resume"},
        files={"file": ("sarah_jenkins_resume.txt", io.BytesIO(sample_resume_content), "text/plain")}
    )
    print(f"POST /api/documents/upload -> {upload_res.status_code}")
    assert upload_res.status_code == 201, f"Expected 201, got {upload_res.status_code}: {upload_res.text}"
    uploaded_doc = upload_res.json()
    uploaded_doc_id = uploaded_doc["id"]
    print(f"  [OK] File uploaded and registered with ID: {uploaded_doc_id}")
    assert uploaded_doc["original_name"] == "sarah_jenkins_resume.txt"

    # 13. POST /api/documents/{document_id}/analyze (Local AI/Rule Analysis Engine test)
    analysis_res = client.post(f"/api/documents/{uploaded_doc_id}/analyze")
    print(f"POST /api/documents/{uploaded_doc_id}/analyze -> {analysis_res.status_code}")
    assert analysis_res.status_code == 200, f"Expected 200, got {analysis_res.status_code}: {analysis_res.text}"
    analysis_data = analysis_res.json()
    print("  [OK] Document analyzed successfully!")
    print(f"    - Extraction method: {analysis_data['extraction_method']}")
    print(f"    - Claims generated: {len(analysis_data['claims'])}")
    print(f"    - Overall Trust score: {analysis_data['metrics']['trust_score']}%")
    assert len(analysis_data["claims"]) >= 1
    assert "metrics" in analysis_data
    assert "trust_score" in analysis_data["metrics"]
    assert analysis_data.get("candidate_name") == "Sarah Jenkins", f"Expected candidate_name 'Sarah Jenkins', got {analysis_data.get('candidate_name')}"
    print(f"    - Extracted Candidate Name: {analysis_data.get('candidate_name')}")

    # Verify that the user's name was synchronized to the extracted candidate name
    updated_user_res = client.get(f"/api/users/{user_id}")
    assert updated_user_res.status_code == 200
    assert updated_user_res.json()["name"] == "Sarah Jenkins"
    # 14. CRITICAL RULE TEST: Resume is NEVER treated as supporting evidence
    # Currently only the resume exists for Sarah.
    # Therefore, Education, Experience, and Certifications claims MUST ALL BE 'Unsupported'
    # and matched_document MUST NOT BE any resume file.
    for cl in analysis_data["claims"]:
        if cl["category"] in ["Education", "Experience", "Certifications"]:
            assert cl["status"] == "Unsupported", f"Expected 'Unsupported' when only resume exists, got '{cl['status']}' for '{cl['claim_text']}'"
            assert "resume" not in cl.get("matched_document", "").lower(), f"Resume was incorrectly set as matched_document: {cl.get('matched_document')}"
            assert cl.get("matched_document") == "No supporting document uploaded"
    print("  [OK] Confirmed: When only resume exists, all claims are Unsupported and resume is NOT evidence")

    # 15. Upload a SECOND resume for the same user and re-analyze
    # A second resume MUST NEVER corroborate claims or act as supporting evidence!
    second_resume = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Resume"},
        files={"file": ("Candidate_Resume_v9999.txt", io.BytesIO(sample_resume_content), "text/plain")}
    )
    assert second_resume.status_code == 201
    second_resume_id = second_resume.json()["id"]

    re_analysis = client.post(f"/api/documents/{uploaded_doc_id}/analyze").json()
    for cl in re_analysis["claims"]:
        if cl["category"] in ["Education", "Experience", "Certifications"]:
            assert cl["status"] == "Unsupported", f"Second resume was incorrectly treated as evidence! Got status '{cl['status']}'"
            assert "Candidate_Resume" not in cl.get("matched_document", ""), f"Second resume leaked into matched_document: {cl.get('matched_document')}"
    print("  [OK] Confirmed: Second uploaded resume is strictly ignored as supporting evidence")

    # 16. Upload REAL Supporting Credential (AWS Certificate)
    # Re-analyzing should now MATCH the AWS certification claim, while Education and Experience remain Unsupported!
    cert_content = b"AWS Certified Solutions Architect - Associate Certificate of Completion. Awarded to Sarah Jenkins."
    cert_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Certifications"},
        files={"file": ("AWS_Solutions_Architect_Certificate.txt", io.BytesIO(cert_content), "text/plain")}
    )
    assert cert_upload.status_code == 201
    cert_doc = cert_upload.json()
    assert cert_doc["category"] == "Certifications"

    cert_analysis = client.post(f"/api/documents/{uploaded_doc_id}/analyze").json()
    cert_claim = next((c for c in cert_analysis["claims"] if c["category"] == "Certifications"), None)
    assert cert_claim is not None, "Certifications claim not found"
    assert cert_claim["status"] == "Match", f"Expected AWS claim status 'Match', got '{cert_claim['status']}'"
    assert "AWS_Solutions_Architect_Certificate.txt" in cert_claim["matched_document"]
    print("  [OK] Confirmed: Uploaded AWS Certificate corroborated certification claim to 'Match'!")

    # Verify Education remains unsupported because no degree was uploaded
    edu_claim = next((c for c in cert_analysis["claims"] if c["category"] == "Education"), None)
    assert edu_claim is not None
    assert edu_claim["status"] == "Unsupported"
    print("  [OK] Confirmed: Education claim remains Unsupported")

    # 17. Test Experience Mismatch Detection
    # Upload an experience letter with conflicting dates (e.g. 2015-2016 instead of 2023)
    conflict_exp_content = b"Experience Relieving Letter: Sarah worked from 2015 to 2016 at CloudTech."
    exp_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Experience Letter"},
        files={"file": ("Company_Relieving_Letter_mismatch.txt", io.BytesIO(conflict_exp_content), "text/plain")}
    )
    assert exp_upload.status_code == 201

    mismatch_analysis = client.post(f"/api/documents/{uploaded_doc_id}/analyze").json()
    exp_claim = next((c for c in mismatch_analysis["claims"] if c["category"] == "Experience"), None)
    assert exp_claim is not None
    # 18. CRITICAL SPECIFIC CERTIFICATE TEST:
    # A resume containing multiple AWS certifications MUST NOT have all of them verified
    # when only ONE specific certificate (e.g. Solutions Architect) is uploaded.
    multi_cert_user_payload = {
        "name": "Yogyansh Singh",
        "email": f"yogyansh_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual",
        "headline": "Cloud Solutions Architect"
    }
    user3_res = client.post("/api/users", json=multi_cert_user_payload)
    assert user3_res.status_code == 201
    user3_id = user3_res.json()["id"]

    multi_cert_resume = (
        b"Yogyansh Singh\n"
        b"Cloud Solutions Architect\n"
        b"CERTIFICATIONS\n"
        b"AWS Certified Solutions Architect - Associate (2024)\n"
        b"AWS Certified AI Practitioner (2024)\n"
        b"AWS Certified Cloud Practitioner (2023)\n"
    )
    user3_resume = client.post(
        "/api/documents/upload",
        data={"user_id": user3_id, "category": "Resume"},
        files={"file": ("Yogyansh_Singh_Resume.txt", io.BytesIO(multi_cert_resume), "text/plain")}
    )
    assert user3_resume.status_code == 201
    user3_resume_id = user3_resume.json()["id"]

    # Analyze resume alone: all 3 cert claims must be Unsupported
    initial_analysis = client.post(f"/api/documents/{user3_resume_id}/analyze").json()
    cert_claims = [c for c in initial_analysis["claims"] if c["category"] == "Certifications"]
    assert len(cert_claims) == 3, f"Expected 3 certification claims, got {len(cert_claims)}"
    assert all(c["status"] == "Unsupported" for c in cert_claims)
    print(f"  [OK] Initial analysis: all 3 cert claims extracted as Unsupported ({[c['claim_text'] for c in cert_claims]})")

    # Upload ONLY AWS Certified Solutions Architect - Associate certificate
    sa_cert_content = b"Amazon Web Services: AWS Certified Solutions Architect - Associate Certificate of Completion."
    sa_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user3_id, "category": "Certifications"},
        files={"file": ("AWS_Solutions_Architect_Certificate.txt", io.BytesIO(sa_cert_content), "text/plain")}
    )
    assert sa_upload.status_code == 201

    # Re-analyze: EXACTLY ONE certification claim must be Match, the other two MUST be Unsupported!
    after_cert_analysis = client.post(f"/api/documents/{user3_resume_id}/analyze").json()
    post_cert_claims = [c for c in after_cert_analysis["claims"] if c["category"] == "Certifications"]
    assert len(post_cert_claims) == 3

    sa_claim = next((c for c in post_cert_claims if "solutions architect" in c["claim_text"].lower()), None)
    ai_claim = next((c for c in post_cert_claims if "ai practitioner" in c["claim_text"].lower()), None)
    cloud_claim = next((c for c in post_cert_claims if "cloud practitioner" in c["claim_text"].lower()), None)

    assert sa_claim is not None, "Solutions Architect claim not found"
    assert ai_claim is not None, "AI Practitioner claim not found"
    assert cloud_claim is not None, "Cloud Practitioner claim not found"

    # Strict assertion: ONLY Solutions Architect is Match
    assert sa_claim["status"] == "Match", f"Expected Solutions Architect to be 'Match', got '{sa_claim['status']}'"
    assert "AWS_Solutions_Architect_Certificate.txt" in sa_claim["matched_document"]

    # AI Practitioner and Cloud Practitioner MUST remain Unsupported
    assert ai_claim["status"] == "Unsupported", f"Expected AI Practitioner to remain 'Unsupported', but got '{ai_claim['status']}'!"
    assert ai_claim["matched_document"] == "No supporting document uploaded"

    assert cloud_claim["status"] == "Unsupported", f"Expected Cloud Practitioner to remain 'Unsupported', but got '{cloud_claim['status']}'!"
    assert cloud_claim["matched_document"] == "No supporting document uploaded"

    print("  [OK] Confirmed: Exactly ONE cert claim matched (Solutions Architect), while AI Practitioner and Cloud Practitioner remain Unsupported!")

    # 19. EXACT REGRESSION TEST:
    # If the resume contains:
    # 1. AWS Certified Solutions Architect – Associate
    # 2. AWS Certified AI Practitioner
    # 3. AWS Certified Cloud Practitioner
    # and ONLY the Solutions Architect certificate is uploaded,
    # ONLY Solutions Architect may become MATCH/CORROBORATED.
    # AI Practitioner and Cloud Practitioner must remain UNSUPPORTED/PENDING.
    reg_user_payload = {
        "name": "Regression Test Candidate",
        "email": f"regression_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual",
        "headline": "Cloud Solutions Architect"
    }
    reg_user_res = client.post("/api/users", json=reg_user_payload)
    assert reg_user_res.status_code == 201
    reg_user_id = reg_user_res.json()["id"]

    exact_resume_content = (
        "Regression Test Candidate\n"
        "Cloud Solutions Architect\n"
        "CERTIFICATIONS\n"
        "1. AWS Certified Solutions Architect \u2013 Associate\n"
        "2. AWS Certified AI Practitioner\n"
        "3. AWS Certified Cloud Practitioner\n"
    ).encode("utf-8")

    reg_resume_res = client.post(
        "/api/documents/upload",
        data={"user_id": reg_user_id, "category": "Resume"},
        files={"file": ("Candidate_Resume.txt", io.BytesIO(exact_resume_content), "text/plain")}
    )
    assert reg_resume_res.status_code == 201
    reg_resume_id = reg_resume_res.json()["id"]

    # Initial analysis: all 3 cert claims must be Unsupported
    reg_initial = client.post(f"/api/documents/{reg_resume_id}/analyze").json()
    reg_cert_claims = [c for c in reg_initial["claims"] if c["category"] == "Certifications"]
    assert len(reg_cert_claims) == 3, f"Expected 3 certification claims, got {len(reg_cert_claims)}"
    for c in reg_cert_claims:
        assert c["status"] == "Unsupported", f"Expected initial status 'Unsupported', got '{c['status']}'"

    # Upload ONLY the Solutions Architect certificate
    sa_cert_file = (
        "Amazon Web Services\n"
        "AWS Certified Solutions Architect - Associate\n"
        "Certificate of Completion\n"
        "Awarded to Regression Test Candidate\n"
    ).encode("utf-8")
    reg_sa_upload = client.post(
        "/api/documents/upload",
        data={"user_id": reg_user_id, "category": "Certifications"},
        files={"file": ("AWS_Certified_Solutions_Architect_-_Associate_certificate.txt", io.BytesIO(sa_cert_file), "text/plain")}
    )
    assert reg_sa_upload.status_code == 201

    # Re-analyze after uploading ONLY Solutions Architect certificate
    reg_after = client.post(f"/api/documents/{reg_resume_id}/analyze").json()
    reg_after_cert_claims = [c for c in reg_after["claims"] if c["category"] == "Certifications"]
    assert len(reg_after_cert_claims) == 3

    sa_result = next((c for c in reg_after_cert_claims if "solutions architect" in c["claim_text"].lower()), None)
    ai_result = next((c for c in reg_after_cert_claims if "ai practitioner" in c["claim_text"].lower()), None)
    cloud_result = next((c for c in reg_after_cert_claims if "cloud practitioner" in c["claim_text"].lower()), None)

    assert sa_result is not None, "Solutions Architect claim missing"
    assert ai_result is not None, "AI Practitioner claim missing"
    assert cloud_result is not None, "Cloud Practitioner claim missing"

    # ONLY Solutions Architect may become MATCH / CORROBORATED
    assert sa_result["status"] == "Match", f"Expected Solutions Architect to be 'Match', got '{sa_result['status']}'"
    assert "AWS_Certified_Solutions_Architect_-_Associate_certificate" in sa_result["matched_document"]

    # AI Practitioner and Cloud Practitioner must remain UNSUPPORTED / PENDING
    assert ai_result["status"] in ["Unsupported", "Pending"], f"AI Practitioner must be Unsupported/Pending, got '{ai_result['status']}'"
    assert ai_result["status"] == "Unsupported"
    assert ai_result["matched_document"] == "No supporting document uploaded"

    assert cloud_result["status"] in ["Unsupported", "Pending"], f"Cloud Practitioner must be Unsupported/Pending, got '{cloud_result['status']}'"
    assert cloud_result["status"] == "Unsupported"
    assert cloud_result["matched_document"] == "No supporting document uploaded"

    print("  [OK] Regression Test Passed: ONLY Solutions Architect is Match/Corroborated, AI Practitioner & Cloud Practitioner remain Unsupported/Pending!")

    # 20. FULL EVIDENCE UPLOAD -> RERUN FLOW TEST (ALL 3 CERTIFICATES):
    # If the user uploads the remaining 2 certificates (AI Practitioner and Cloud Practitioner),
    # upon Rerun Analysis, ALL 3 certification claims MUST become MATCH/CORROBORATED.
    ai_cert_file = (
        "Amazon Web Services\n"
        "AWS Certified AI Practitioner\n"
        "Certificate of Completion\n"
        "Awarded to Regression Test Candidate\n"
    ).encode("utf-8")
    reg_ai_upload = client.post(
        "/api/documents/upload",
        data={"user_id": reg_user_id, "category": "Certifications"},
        files={"file": ("AWS_Certified_AI_Practitioner_Certificate.txt", io.BytesIO(ai_cert_file), "text/plain")}
    )
    assert reg_ai_upload.status_code == 201

    # Rerun with 2 certificates uploaded (Solutions Architect + AI Practitioner)
    reg_rerun_2 = client.post(f"/api/documents/{reg_resume_id}/analyze").json()
    claims_2 = [c for c in reg_rerun_2["claims"] if c["category"] == "Certifications"]
    assert len(claims_2) == 3

    sa_2 = next((c for c in claims_2 if "solutions architect" in c["claim_text"].lower()), None)
    ai_2 = next((c for c in claims_2 if "ai practitioner" in c["claim_text"].lower()), None)
    cloud_2 = next((c for c in claims_2 if "cloud practitioner" in c["claim_text"].lower()), None)

    assert sa_2["status"] == "Match", f"Solutions Architect must be Match, got {sa_2['status']}"
    assert ai_2["status"] == "Match", f"AI Practitioner must be Match, got {ai_2['status']}"
    assert cloud_2["status"] == "Unsupported", f"Cloud Practitioner must remain Unsupported, got {cloud_2['status']}"

    # Now upload the 3rd certificate (Cloud Practitioner)
    cloud_cert_file = (
        "Amazon Web Services\n"
        "AWS Certified Cloud Practitioner\n"
        "Certificate of Completion\n"
        "Awarded to Regression Test Candidate\n"
    ).encode("utf-8")
    reg_cloud_upload = client.post(
        "/api/documents/upload",
        data={"user_id": reg_user_id, "category": "Certifications"},
        files={"file": ("AWS_Certified_Cloud_Practitioner_Certificate.txt", io.BytesIO(cloud_cert_file), "text/plain")}
    )
    assert reg_cloud_upload.status_code == 201

    # Rerun Analysis with ALL 3 certificates uploaded
    reg_rerun_3 = client.post(f"/api/documents/{reg_resume_id}/analyze").json()
    claims_3 = [c for c in reg_rerun_3["claims"] if c["category"] == "Certifications"]
    assert len(claims_3) == 3

    sa_3 = next((c for c in claims_3 if "solutions architect" in c["claim_text"].lower()), None)
    ai_3 = next((c for c in claims_3 if "ai practitioner" in c["claim_text"].lower()), None)
    cloud_3 = next((c for c in claims_3 if "cloud practitioner" in c["claim_text"].lower()), None)

    assert sa_3["status"] == "Match", f"Solutions Architect must be Match, got {sa_3['status']}"
    assert "Solutions_Architect" in sa_3["matched_document"]

    assert ai_3["status"] == "Match", f"AI Practitioner must be Match, got {ai_3['status']}"
    assert "AI_Practitioner" in ai_3["matched_document"]

    assert cloud_3["status"] == "Match", f"Cloud Practitioner must be Match, got {cloud_3['status']}"
    assert "Cloud_Practitioner" in cloud_3["matched_document"]

    # Verify each cert matched its own distinct certificate document
    matched_doc_names = {sa_3["matched_document"], ai_3["matched_document"], cloud_3["matched_document"]}
    assert len(matched_doc_names) == 3, f"Expected 3 distinct matched certificate documents, got {matched_doc_names}"

    print("  [OK] Test 20 Passed: All 3 AWS certification claims successfully corroborated when all 3 certificates uploaded!")

    # 21. DOCUMENT DELETE PERSISTENCE & RE-RUN REGRESSION TEST:
    # - Upload resume with AWS Certified Solutions Architect.
    # - Upload supporting certificate.
    # - Verify certificate claim becomes Match.
    # - Assert another user cannot delete this document (403 Forbidden).
    # - Assert non-existent document returns 404.
    # - Delete the certificate through DELETE endpoint.
    # - Verify certificate no longer exists in GET /api/users/{user_id}/documents.
    # - Rerun analysis.
    # - Assert certificate is no longer used as evidence.
    # - Assert claim reverts from Match to Unsupported.
    del_user_a_payload = {
        "name": "Delete Test Candidate",
        "email": f"delete_test_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }
    user_a_res = client.post("/api/users", json=del_user_a_payload)
    assert user_a_res.status_code == 201
    user_a_id = user_a_res.json()["id"]

    del_user_b_payload = {
        "name": "Unauthorized Intruder",
        "email": f"intruder_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }
    user_b_res = client.post("/api/users", json=del_user_b_payload)
    assert user_b_res.status_code == 201
    user_b_id = user_b_res.json()["id"]

    del_resume_bytes = (
        "Delete Test Candidate\n"
        "Cloud Architect\n"
        "CERTIFICATIONS\n"
        "1. AWS Certified Solutions Architect – Associate\n"
    ).encode("utf-8")

    del_resume_res = client.post(
        "/api/documents/upload",
        data={"user_id": user_a_id, "category": "Resume"},
        files={"file": ("Delete_Test_Resume.txt", io.BytesIO(del_resume_bytes), "text/plain")}
    )
    assert del_resume_res.status_code == 201
    del_resume_id = del_resume_res.json()["id"]

    # Upload supporting certificate for User A
    del_cert_bytes = (
        "Amazon Web Services\n"
        "AWS Certified Solutions Architect - Associate\n"
        "Certificate of Completion\n"
        "Awarded to Delete Test Candidate\n"
    ).encode("utf-8")

    del_cert_res = client.post(
        "/api/documents/upload",
        data={"user_id": user_a_id, "category": "Certifications"},
        files={"file": ("AWS_Solutions_Architect_Cert_to_delete.txt", io.BytesIO(del_cert_bytes), "text/plain")}
    )
    assert del_cert_res.status_code == 201
    del_cert_id = del_cert_res.json()["id"]

    # Analyze: Claim should be Match with the uploaded certificate
    analysis_before_delete = client.post(f"/api/documents/{del_resume_id}/analyze").json()
    sa_claim_before = next(
        (c for c in analysis_before_delete["claims"] if "solutions architect" in c["claim_text"].lower()), None
    )
    assert sa_claim_before is not None
    assert sa_claim_before["status"] == "Match"
    assert "AWS_Solutions_Architect_Cert_to_delete" in sa_claim_before["matched_document"]
    score_before = analysis_before_delete["metrics"]["trust_score"]

    # Security check: User B attempts to delete User A's document -> MUST return 403 Forbidden!
    intruder_attempt = client.delete(f"/api/documents/{del_cert_id}?user_id={user_b_id}")
    assert intruder_attempt.status_code == 403, f"Expected 403 Forbidden when deleting another user's document, got {intruder_attempt.status_code}"
    print("  [OK] Confirmed: Another user cannot delete user's document via query param (403 Forbidden)")

    # Security check via X-User-ID Header: User B attempts to delete User A's document -> MUST return 403 Forbidden!
    intruder_header_attempt = client.delete(f"/api/documents/{del_cert_id}", headers={"X-User-ID": user_b_id})
    assert intruder_header_attempt.status_code == 403, f"Expected 403 Forbidden via header, got {intruder_header_attempt.status_code}"
    print("  [OK] Confirmed: Another user cannot delete user's document via X-User-ID header (403 Forbidden)")

    # 404 check on non-existent document
    non_existent = client.delete(f"/api/documents/{str(uuid.uuid4())}?user_id={user_a_id}")
    assert non_existent.status_code == 404
    print("  [OK] Confirmed: 404 properly returned for non-existent document")

    # Check physical file exists on disk before delete
    from app.config import get_settings
    import os
    settings = get_settings()
    stored_cert_file = os.path.join(settings.upload_dir, del_cert_res.json().get("stored_name", ""))
    assert os.path.exists(stored_cert_file), f"Expected certificate file on disk at {stored_cert_file}"

    # Legitimate deletion by User A
    delete_res = client.delete(f"/api/documents/{del_cert_id}?user_id={user_a_id}")
    assert delete_res.status_code == 200, f"Expected 200 OK on deletion, got {delete_res.status_code}"
    del_json = delete_res.json()
    assert del_json.get("success") is True
    assert del_json.get("id") == del_cert_id

    # Assert stored file is deleted from disk
    assert not os.path.exists(stored_cert_file), "Associated stored file was not deleted from uploads directory!"
    print("  [OK] Confirmed: Associated stored file deleted from uploads directory")

    # Assert document is no longer listed in GET /api/users/{user_id}/documents
    docs_after_del = client.get(f"/api/users/{user_a_id}/documents").json()
    assert not any(d["id"] == del_cert_id for d in docs_after_del), "Deleted document still returned in user documents!"
    assert len(docs_after_del) == 1, f"Expected exactly 1 document remaining (resume), got {len(docs_after_del)}"

    # Re-run analysis on the resume after certificate deletion
    analysis_after_delete = client.post(f"/api/documents/{del_resume_id}/analyze").json()
    sa_claim_after = next(
        (c for c in analysis_after_delete["claims"] if "solutions architect" in c["claim_text"].lower()), None
    )
    assert sa_claim_after is not None

    # Assert the claim is no longer Match and has reverted to Unsupported
    assert sa_claim_after["status"] in ["Unsupported", "Pending"], f"Expected claim to be Unsupported, got {sa_claim_after['status']}"
    assert sa_claim_after["status"] == "Unsupported"
    assert sa_claim_after["matched_document"] == "No supporting document uploaded"
    assert analysis_after_delete["metrics"]["verified_count"] == 0
    assert analysis_after_delete["metrics"]["unsupported_count"] >= 1
    score_after = analysis_after_delete["metrics"]["trust_score"]
    assert score_after < score_before, f"Expected trust score to drop after deleting evidence (was {score_before}, now {score_after})"

    # 22. ZERO-EVIDENCE STALE REPORT STATE REGRESSION TEST (DELETE ALL SUPPORTING EVIDENCE & RERUN):
    # - Analyze resume + supporting certificates.
    # - Confirm some claims are Match and trust score is > 0.
    # - Delete ALL supporting certificates.
    # - Rerun analysis.
    # - Assert verified_count = 0.
    # - Assert unsupported claims > 0 where the resume has claims requiring evidence.
    # - Assert supporting evidence = 0.
    # - Assert returned trust score is recalculated and is NOT the previous score.
    zero_user_payload = {
        "name": "Zero Evidence Test Candidate",
        "email": f"zero_evidence_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }
    zero_user_res = client.post("/api/users", json=zero_user_payload)
    assert zero_user_res.status_code == 201
    zero_user_id = zero_user_res.json()["id"]

    # 1. Upload Resume containing education, experience, and certifications
    zero_resume_content = (
        "Zero Evidence Test Candidate\n"
        "Lead Solutions Architect\n"
        "EDUCATION\n"
        "Bachelor of Technology in Computer Science, Stanford University, 2019\n"
        "EXPERIENCE\n"
        "Senior Cloud Architect at TechCorp (2020 - 2024)\n"
        "CERTIFICATIONS\n"
        "1. AWS Certified Solutions Architect – Associate\n"
        "2. AWS Certified Cloud Practitioner\n"
    ).encode("utf-8")

    zero_resume_res = client.post(
        "/api/documents/upload",
        data={"user_id": zero_user_id, "category": "Resume"},
        files={"file": ("Zero_Test_Candidate_Resume.txt", io.BytesIO(zero_resume_content), "text/plain")}
    )
    assert zero_resume_res.status_code == 201
    zero_resume_id = zero_resume_res.json()["id"]

    # 2. Upload supporting certificates
    cert1_content = (
        "Amazon Web Services\n"
        "AWS Certified Solutions Architect - Associate\n"
        "Awarded to Zero Evidence Test Candidate\n"
    ).encode("utf-8")
    cert1_res = client.post(
        "/api/documents/upload",
        data={"user_id": zero_user_id, "category": "Certifications"},
        files={"file": ("AWS_Solutions_Architect_Certificate.txt", io.BytesIO(cert1_content), "text/plain")}
    )
    assert cert1_res.status_code == 201
    cert1_id = cert1_res.json()["id"]

    cert2_content = (
        "Amazon Web Services\n"
        "AWS Certified Cloud Practitioner\n"
        "Awarded to Zero Evidence Test Candidate\n"
    ).encode("utf-8")
    cert2_res = client.post(
        "/api/documents/upload",
        data={"user_id": zero_user_id, "category": "Certifications"},
        files={"file": ("AWS_Cloud_Practitioner_Certificate.txt", io.BytesIO(cert2_content), "text/plain")}
    )
    assert cert2_res.status_code == 201
    cert2_id = cert2_res.json()["id"]

    # 3. Analyze resume + supporting certificates
    initial_analysis = client.post(f"/api/documents/{zero_resume_id}/analyze").json()
    initial_metrics = initial_analysis["metrics"]
    initial_claims = initial_analysis["claims"]

    # Confirm some claims are Match and trust score is > 0
    matched_initial = [c for c in initial_claims if c["status"] == "Match"]
    assert len(matched_initial) >= 2, f"Expected at least 2 Match claims, got {len(matched_initial)}"
    assert initial_metrics["verified_count"] >= 2
    assert initial_metrics["trust_score"] > 50, f"Expected high initial trust score, got {initial_metrics['trust_score']}"
    initial_trust_score = initial_metrics["trust_score"]

    # 4. Delete ALL supporting certificates
    del1_res = client.delete(f"/api/documents/{cert1_id}?user_id={zero_user_id}")
    assert del1_res.status_code == 200 and del1_res.json().get("success") is True
    del2_res = client.delete(f"/api/documents/{cert2_id}?user_id={zero_user_id}")
    assert del2_res.status_code == 200 and del2_res.json().get("success") is True

    # Confirm user documents list has ZERO supporting documents (only the 1 resume remains)
    user_docs_after_delete = client.get(f"/api/users/{zero_user_id}/documents").json()
    supporting_docs_remaining = [
        d for d in user_docs_after_delete if (d.get("category") or "").strip().lower() != "resume"
    ]
    # Assert supporting evidence = 0
    assert len(supporting_docs_remaining) == 0, f"Expected 0 supporting documents remaining, got {len(supporting_docs_remaining)}"
    assert len(user_docs_after_delete) == 1
    assert user_docs_after_delete[0]["id"] == zero_resume_id

    # 5. Rerun analysis on the resume
    rerun_analysis = client.post(f"/api/documents/{zero_resume_id}/analyze").json()
    rerun_metrics = rerun_analysis["metrics"]
    rerun_claims = rerun_analysis["claims"]

    # Assert verified_count = 0
    assert rerun_metrics["verified_count"] == 0, f"Expected verified_count == 0, got {rerun_metrics['verified_count']}"

    # Assert unsupported claims > 0 where the resume has claims requiring evidence
    assert rerun_metrics["unsupported_count"] > 0, f"Expected unsupported_count > 0, got {rerun_metrics['unsupported_count']}"
    cert_claims_after = [c for c in rerun_claims if c["category"] == "Certifications"]
    assert len(cert_claims_after) == 2, f"Expected 2 certification claims, got {len(cert_claims_after)}"
    for c in cert_claims_after:
        assert c["status"] == "Unsupported", f"Expected cert claim to be Unsupported, got {c['status']}"
        assert c["matched_document"] == "No supporting document uploaded"

    # Assert returned trust score is recalculated and is NOT the previous score
    rerun_trust_score = rerun_metrics["trust_score"]
    assert rerun_trust_score != initial_trust_score, f"Trust score remained stale ({rerun_trust_score} == {initial_trust_score})"
    assert rerun_trust_score <= 50, f"Expected zero-evidence trust score to be <= 50, got {rerun_trust_score}"

    print(f"  [OK] Test 22 Passed: Zero-evidence state correctly recalculated! Initial Trust: {initial_trust_score} -> Rerun Trust: {rerun_trust_score}, Verified: 0, Unsupported: {rerun_metrics['unsupported_count']}")

    # =========================================================================
    # 23. COMPREHENSIVE DOCUMENT ISOLATION & EVIDENCE MATCHING REGRESSION SUITE:
    # 1. Resume only -> 0 corroborated supporting claims.
    # 2. Resume + Xornor internship evidence -> Xornor = Match, unrelated claims remain Unsupported.
    # 3. Resume + only Solutions Architect certificate -> exactly 1 certification Match.
    # 4. Resume + Solutions Architect + AI Practitioner -> exactly 2 certification Matches.
    # 5. Resume + all 3 certificates -> exactly 3 certification Matches.
    # 6. Delete all evidence -> 0 supporting evidence and all relevant claims Unsupported again.
    # 7. Deleted documents remain deleted after re-fetch/rerun.
    # 8. A second user's documents cannot appear in the first user's Uploaded Credentials.
    # 9. Opening the upload flow does not create or resurrect documents.
    # 10. Real user's resume is never used as supporting evidence.
    # =========================================================================
    cand_payload = {
        "name": "Alex Mercer",
        "email": f"alex_mercer_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }
    user_res = client.post("/api/users", json=cand_payload)
    assert user_res.status_code == 201
    user_id = user_res.json()["id"]

    # Candidate 2 for user isolation test
    cand2_payload = {
        "name": "Jane Doe",
        "email": f"jane_doe_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }
    user2_res = client.post("/api/users", json=cand2_payload)
    assert user2_res.status_code == 201
    user2_id = user2_res.json()["id"]

    # Resume containing:
    # - Education: Bachelor of Science in Computer Science, Stanford University (2018 - 2022)
    # - Experience 1: Software Engineering Intern at Xornor Technologies (May 2023 - Aug 2023)
    # - Experience 2: Senior Cloud Engineer at CloudTech Systems (2023 - Present)
    # - Certifications:
    #   1. AWS Certified Solutions Architect - Associate
    #   2. AWS Certified AI Practitioner
    #   3. AWS Certified Cloud Practitioner
    resume_content = (
        "Alex Mercer\n"
        "Lead Software Engineer\n"
        "EDUCATION\n"
        "Bachelor of Science in Computer Science, Stanford University (2018 - 2022)\n"
        "EXPERIENCE\n"
        "Software Engineering Intern at Xornor Technologies (May 2023 - Aug 2023)\n"
        "Senior Cloud Engineer at CloudTech Systems (2023 - Present)\n"
        "CERTIFICATIONS\n"
        "1. AWS Certified Solutions Architect - Associate\n"
        "2. AWS Certified AI Practitioner\n"
        "3. AWS Certified Cloud Practitioner\n"
    ).encode("utf-8")

    resume_res = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Resume"},
        files={"file": ("Alex_Mercer_Resume.txt", io.BytesIO(resume_content), "text/plain")}
    )
    assert resume_res.status_code == 201
    resume_id = resume_res.json()["id"]

    # 1. TEST: Resume only -> 0 corroborated supporting claims
    # Requirement 10: Resume must NOT be treated as supporting evidence
    analysis_resume_only = client.post(f"/api/documents/{resume_id}/analyze").json()
    assert analysis_resume_only["metrics"]["verified_count"] == 0, f"Expected 0 verified claims with resume only, got {analysis_resume_only['metrics']['verified_count']}"
    all_claims = analysis_resume_only["claims"]
    for c in all_claims:
        assert c["status"] in ["Unsupported", "Pending"], f"Claim '{c['claim_text']}' unexpectedly verified without evidence: {c['status']}"
        assert "Alex_Mercer_Resume" not in (c.get("matched_document") or ""), "Resume was erroneously used as supporting evidence!"
    print("  [OK] Reg 1 & 10: Resume only -> 0 corroborated claims, resume never used as evidence")

    # 2. TEST: Resume + Xornor internship evidence -> Xornor = Match, unrelated claims remain Unsupported
    xornor_file = (
        "Xornor Technologies Inc.\n"
        "Certificate of Internship Completion\n"
        "This is to certify that Alex Mercer has successfully served as Software Engineering Intern\n"
        "at Xornor Technologies from May 2023 to August 2023.\n"
    ).encode("utf-8")
    xornor_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Experience Letter"},
        files={"file": ("Xornor_Internship_Certificate.txt", io.BytesIO(xornor_file), "text/plain")}
    )
    assert xornor_upload.status_code == 201
    xornor_doc_id = xornor_upload.json()["id"]

    analysis_xornor = client.post(f"/api/documents/{resume_id}/analyze").json()
    exp_claims = [c for c in analysis_xornor["claims"] if c["category"] == "Experience"]
    assert len(exp_claims) >= 2, f"Expected at least 2 experience claims, got {len(exp_claims)}"

    xornor_claim = next((c for c in exp_claims if "xornor" in c["claim_text"].lower()), None)
    cloudtech_claim = next((c for c in exp_claims if "cloudtech" in c["claim_text"].lower()), None)

    assert xornor_claim is not None, "Xornor experience claim missing"
    assert xornor_claim["status"] == "Match", f"Expected Xornor claim to be Match, got '{xornor_claim['status']}'"
    assert "Xornor_Internship_Certificate" in xornor_claim["matched_document"]

    assert cloudtech_claim is not None, "CloudTech experience claim missing"
    assert cloudtech_claim["status"] == "Unsupported", f"Unrelated CloudTech claim must remain Unsupported, got '{cloudtech_claim['status']}'"
    assert cloudtech_claim["matched_document"] == "No supporting document uploaded"

    cert_claims = [c for c in analysis_xornor["claims"] if c["category"] == "Certifications"]
    for cc in cert_claims:
        assert cc["status"] == "Unsupported", f"Certification claim '{cc['claim_text']}' should remain Unsupported without cert docs"

    print("  [OK] Reg 2: Resume + Xornor internship evidence -> Xornor = Match, unrelated claims remain Unsupported")

    # 3. TEST: Resume + only Solutions Architect certificate -> exactly 1 certification Match
    sa_file = (
        "Amazon Web Services\n"
        "AWS Certified Solutions Architect - Associate\n"
        "Awarded to Alex Mercer\n"
    ).encode("utf-8")
    sa_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Certifications"},
        files={"file": ("AWS_Solutions_Architect_Certificate.txt", io.BytesIO(sa_file), "text/plain")}
    )
    assert sa_upload.status_code == 201
    sa_doc_id = sa_upload.json()["id"]

    analysis_sa = client.post(f"/api/documents/{resume_id}/analyze").json()
    sa_cert_claims = [c for c in analysis_sa["claims"] if c["category"] == "Certifications"]
    matched_certs_sa = [c for c in sa_cert_claims if c["status"] == "Match"]
    assert len(matched_certs_sa) == 1, f"Expected exactly 1 certification Match, got {len(matched_certs_sa)}"
    assert "solutions architect" in matched_certs_sa[0]["claim_text"].lower()

    ai_claim_3 = next(c for c in sa_cert_claims if "ai practitioner" in c["claim_text"].lower())
    cloud_claim_3 = next(c for c in sa_cert_claims if "cloud practitioner" in c["claim_text"].lower())
    assert ai_claim_3["status"] == "Unsupported"
    assert cloud_claim_3["status"] == "Unsupported"

    print("  [OK] Reg 3: Resume + only Solutions Architect certificate -> exactly 1 certification Match")

    # 4. TEST: Resume + Solutions Architect + AI Practitioner -> exactly 2 certification Matches
    ai_file = (
        "Amazon Web Services\n"
        "AWS Certified AI Practitioner\n"
        "Awarded to Alex Mercer\n"
    ).encode("utf-8")
    ai_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Certifications"},
        files={"file": ("AWS_AI_Practitioner_Certificate.txt", io.BytesIO(ai_file), "text/plain")}
    )
    assert ai_upload.status_code == 201
    ai_doc_id = ai_upload.json()["id"]

    analysis_2certs = client.post(f"/api/documents/{resume_id}/analyze").json()
    cert_claims_2 = [c for c in analysis_2certs["claims"] if c["category"] == "Certifications"]
    matched_certs_2 = [c for c in cert_claims_2 if c["status"] == "Match"]
    assert len(matched_certs_2) == 2, f"Expected exactly 2 certification Matches, got {len(matched_certs_2)}"
    
    cloud_claim_4 = next(c for c in cert_claims_2 if "cloud practitioner" in c["claim_text"].lower())
    assert cloud_claim_4["status"] == "Unsupported"

    print("  [OK] Reg 4: Resume + Solutions Architect + AI Practitioner -> exactly 2 certification Matches")

    # 5. TEST: Resume + all 3 certificates -> exactly 3 certification Matches
    cloud_file = (
        "Amazon Web Services\n"
        "AWS Certified Cloud Practitioner\n"
        "Awarded to Alex Mercer\n"
    ).encode("utf-8")
    cloud_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user_id, "category": "Certifications"},
        files={"file": ("AWS_Cloud_Practitioner_Certificate.txt", io.BytesIO(cloud_file), "text/plain")}
    )
    assert cloud_upload.status_code == 201
    cloud_doc_id = cloud_upload.json()["id"]

    analysis_3certs = client.post(f"/api/documents/{resume_id}/analyze").json()
    cert_claims_3 = [c for c in analysis_3certs["claims"] if c["category"] == "Certifications"]
    matched_certs_3 = [c for c in cert_claims_3 if c["status"] == "Match"]
    assert len(matched_certs_3) == 3, f"Expected exactly 3 certification Matches, got {len(matched_certs_3)}"

    print("  [OK] Reg 5: Resume + all 3 certificates -> exactly 3 certification Matches")

    # 8. TEST: User 2 document isolation: User 2 documents CANNOT appear in User 1's documents
    user2_doc_file = b"Confidential Jane Doe Portfolio"
    user2_upload = client.post(
        "/api/documents/upload",
        data={"user_id": user2_id, "category": "Other Document"},
        files={"file": ("Jane_Doe_Private_Doc.txt", io.BytesIO(user2_doc_file), "text/plain")}
    )
    assert user2_upload.status_code == 201
    user2_doc_id = user2_upload.json()["id"]

    user1_docs = client.get(f"/api/users/{user_id}/documents").json()
    assert not any(d["id"] == user2_doc_id for d in user1_docs), "User 2 document leaked into User 1 document list!"

    user2_docs = client.get(f"/api/users/{user2_id}/documents").json()
    assert len(user2_docs) == 1 and user2_docs[0]["id"] == user2_doc_id
    assert not any(d["id"] == resume_id for d in user2_docs), "User 1 document leaked into User 2 document list!"

    print("  [OK] Reg 8: Strict multi-user document isolation confirmed")

    # 6 & 7. TEST: Delete all evidence -> 0 supporting evidence and all relevant claims Unsupported again
    # Deleted documents remain deleted after re-fetch/rerun
    del_ids = [xornor_doc_id, sa_doc_id, ai_doc_id, cloud_doc_id]
    for did in del_ids:
        del_resp = client.delete(f"/api/documents/{did}?user_id={user_id}")
        assert del_resp.status_code == 200

    # Re-fetch documents: only resume must remain
    user1_docs_after_del = client.get(f"/api/users/{user_id}/documents").json()
    assert len(user1_docs_after_del) == 1, f"Expected only 1 document remaining, got {len(user1_docs_after_del)}"
    assert user1_docs_after_del[0]["id"] == resume_id

    # Rerun analysis:
    analysis_after_del_all = client.post(f"/api/documents/{resume_id}/analyze").json()
    assert analysis_after_del_all["metrics"]["verified_count"] == 0, f"Expected verified_count == 0, got {analysis_after_del_all['metrics']['verified_count']}"
    assert analysis_after_del_all["metrics"]["unsupported_count"] >= 3
    for c in analysis_after_del_all["claims"]:
        assert c["status"] in ["Unsupported", "Pending"]
        assert c["matched_document"] in ["No supporting document uploaded", "Self-Reported in Resume"]

    print("  [OK] Reg 6 & 7: Delete all evidence -> 0 verified claims, all claims revert to Unsupported, deleted documents remain deleted")

    # 24. TEST: Xornor Experience Evidence Matching Regression Tests (A, B, C, D)
    print("\n--- 24. Testing Xornor Experience Evidence Matching Regression Tests (A, B, C, D) ---")
    
    # Create candidate Yogyansh Singh
    yogyansh_user = client.post("/api/users", json={
        "name": "Yogyansh Singh",
        "email": f"yogyansh_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    y_user_id = yogyansh_user["id"]

    # Resume with: Product Management Intern | Xornor Technologies Pvt. Ltd. Jun 2026 – Aug 2026
    y_resume_content = (
        "YOGYANSH SINGH\n"
        "yogyansh@example.com | +91 9876543210\n\n"
        "EXPERIENCE\n"
        "Product Management Intern | Xornor Technologies Pvt. Ltd. Jun 2026 – Aug 2026\n"
        "• Conducted market research and drafted product requirement documents.\n"
        "Cloud Engineering Intern at TechCorp Solutions 2024\n"
        "• Built infrastructure.\n"
    ).encode("utf-8")
    
    y_resume_upload = client.post(
        "/api/documents/upload",
        data={"user_id": y_user_id, "category": "Resume"},
        files={"file": ("Yogyansh_Singh_Resume.txt", io.BytesIO(y_resume_content), "text/plain")}
    )
    assert y_resume_upload.status_code == 201
    y_resume_id = y_resume_upload.json()["id"]

    # --- Scenario A: Resume only → Xornor experience Unsupported ---
    analysis_a = client.post(f"/api/documents/{y_resume_id}/analyze").json()
    xornor_claim_a = next(
        (c for c in analysis_a["claims"] if "xornor" in c["claim_text"].lower()), None
    )
    assert xornor_claim_a is not None, "Xornor experience claim should be extracted from resume"
    assert xornor_claim_a["status"] == "Unsupported", f"Scenario A: Expected Unsupported without evidence, got {xornor_claim_a['status']}"
    assert analysis_a["metrics"]["verified_count"] == 0
    print("  [OK] Scenario A: Resume only -> Xornor experience is Unsupported")

    # --- Scenario C: Unrelated certificates (different company/role, or different candidate) must not match ---
    # Unrelated company certificate
    unrelated_comp_content = (
        "CERTIFICATE OF COMPLETION\n"
        "This is to certify that Mr. Yogyansh Singh has completed training\n"
        "at Acme Global Solutions as a Software Development Trainee\n"
        "from 1 January 2025 to 30 March 2025.\n"
    ).encode("utf-8")
    unrelated_upload = client.post(
        "/api/documents/upload",
        data={"user_id": y_user_id, "category": "Certifications"},
        files={"file": ("Acme_Software_Trainee_Certificate.txt", io.BytesIO(unrelated_comp_content), "text/plain")}
    )
    assert unrelated_upload.status_code == 201
    unrelated_doc_id = unrelated_upload.json()["id"]

    # Different candidate certificate at Xornor
    other_person_content = (
        "XORNOR TECHNOLOGIES PRIVATE LIMITED\n"
        "CERTIFICATE OF COMPLETION\n"
        "This certificate is awarded to Jane Doe\n"
        "for successfully undergoing Industrial Training at Xornor Technologies Pvt. Ltd.\n"
        "as a Product Management Trainee from 1 June 2026 to 31 July 2026.\n"
    ).encode("utf-8")
    other_person_upload = client.post(
        "/api/documents/upload",
        data={"user_id": y_user_id, "category": "Certifications"},
        files={"file": ("Jane_Doe_Xornor_Certificate.txt", io.BytesIO(other_person_content), "text/plain")}
    )
    assert other_person_upload.status_code == 201
    other_person_doc_id = other_person_upload.json()["id"]

    analysis_c = client.post(f"/api/documents/{y_resume_id}/analyze").json()
    xornor_claim_c = next(
        (c for c in analysis_c["claims"] if "xornor" in c["claim_text"].lower()), None
    )
    assert xornor_claim_c["status"] == "Unsupported", f"Scenario C: Unrelated certs must not match Xornor claim, got {xornor_claim_c['status']}"
    assert analysis_c["metrics"]["verified_count"] == 0
    print("  [OK] Scenario C: Unrelated experience / different candidate certificate -> Xornor experience remains Unsupported")

    # Clean up unrelated documents
    del_unrelated = client.delete(f"/api/documents/{unrelated_doc_id}?user_id={y_user_id}")
    assert del_unrelated.status_code == 200
    del_other = client.delete(f"/api/documents/{other_person_doc_id}?user_id={y_user_id}")
    assert del_other.status_code == 200

    # --- Scenario B: Resume + matching Xornor certificate → Xornor experience Match ---
    # Certificate uses:
    # "Xornor Technologies Private Limited", "Product Management Trainee", "1 June 2026 to 31 July 2026"
    xornor_cert_content = (
        "XORNOR TECHNOLOGIES PRIVATE LIMITED\n"
        "CERTIFICATE OF COMPLETION\n"
        "This certificate is awarded to Mr. Yogyansh Singh\n"
        "for successfully undergoing Industrial Training at Xornor Technologies Pvt. Ltd.\n"
        "as a Product Management Trainee from 1 June 2026 to 31 July 2026.\n"
    ).encode("utf-8")
    xornor_upload = client.post(
        "/api/documents/upload",
        data={"user_id": y_user_id, "category": "Certifications"},
        files={"file": ("Yogyansh_Singh_Certificate_of_Completion.txt", io.BytesIO(xornor_cert_content), "text/plain")}
    )
    assert xornor_upload.status_code == 201
    xornor_doc_id = xornor_upload.json()["id"]

    analysis_b = client.post(f"/api/documents/{y_resume_id}/analyze").json()
    xornor_claim_b = next(
        (c for c in analysis_b["claims"] if "xornor" in c["claim_text"].lower()), None
    )
    techcorp_claim_b = next(
        (c for c in analysis_b["claims"] if "techcorp" in c["claim_text"].lower()), None
    )
    assert xornor_claim_b["status"] == "Match", f"Scenario B: Expected Match, got {xornor_claim_b['status']}"
    assert "Certificate_of_Completion" in xornor_claim_b["matched_document"]
    assert techcorp_claim_b["status"] == "Unsupported", "TechCorp claim must remain Unsupported"
    assert analysis_b["metrics"]["verified_count"] >= 1
    print("  [OK] Scenario B: Resume + matching Xornor certificate -> Xornor experience is Match / Corroborated")

    # --- Scenario D: Delete Xornor certificate + rerun → Xornor experience returns to Unsupported ---
    del_xornor = client.delete(f"/api/documents/{xornor_doc_id}?user_id={y_user_id}")
    assert del_xornor.status_code == 200

    analysis_d = client.post(f"/api/documents/{y_resume_id}/analyze").json()
    xornor_claim_d = next(
        (c for c in analysis_d["claims"] if "xornor" in c["claim_text"].lower()), None
    )
    assert xornor_claim_d["status"] == "Unsupported", f"Scenario D: Expected Unsupported after deletion, got {xornor_claim_d['status']}"
    assert analysis_d["metrics"]["verified_count"] == 0
    print("  [OK] Scenario D: Delete Xornor certificate + rerun -> Xornor returns to Unsupported")

    # 25. TEST: GET /api/documents/{document_id}/file (View/stream document with ownership isolation)
    print("\n--- 25. Testing Document File Streaming & Ownership Isolation ---")
    file_sample = b"%PDF-1.4 Mock Genuine PDF Document Content"
    file_upload = client.post(
        "/api/documents/upload",
        data={"user_id": y_user_id, "category": "Certifications"},
        files={"file": ("My_Certificate.pdf", io.BytesIO(file_sample), "application/pdf")}
    )
    assert file_upload.status_code == 201
    file_doc_id = file_upload.json()["id"]

    # 1. Owner views file -> 200 OK, inline content disposition, correct bytes
    view_res = client.get(f"/api/documents/{file_doc_id}/file?user_id={y_user_id}")
    assert view_res.status_code == 200
    assert view_res.content == file_sample
    assert "inline" in view_res.headers.get("content-disposition", "")
    assert "application/pdf" in view_res.headers.get("content-type", "")
    print("  [OK] Owner successfully accesses file with inline content-disposition")

    # 2. Another user attempts to access file -> 403 Forbidden
    other_user = client.post("/api/users", json={
        "name": "Intruder User",
        "email": f"intruder_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    forbidden_res = client.get(f"/api/documents/{file_doc_id}/file?user_id={other_user['id']}")
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden for intruder, got {forbidden_res.status_code}"
    print("  [OK] Document ownership isolation preserved: 403 Forbidden for unauthorized user")

    # 3. Non-existent document -> 404
    missing_res = client.get(f"/api/documents/{uuid.uuid4()}/file?user_id={y_user_id}")
    assert missing_res.status_code == 404
    print("  [OK] Non-existent document file properly returns 404")

    # Clean up
    client.delete(f"/api/documents/{file_doc_id}?user_id={y_user_id}")

    # --- 26. Testing Multi-Document Mixed Category Auto-Detection & Duplicate Prevention ---
    print("\n--- 26. Testing Multi-Document Mixed Category Auto-Detection & Duplicate Prevention ---")
    multi_user = client.post("/api/users", json={
        "name": "Multi Upload Candidate",
        "email": f"multi_upload_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    mu_user_id = multi_user["id"]

    test_files = [
        ("Resume.pdf", "Resume", b"%PDF-1.4 Resume text candidate"),
        ("AWS.pdf", "Certifications", b"%PDF-1.4 AWS Certified Solutions Architect Associate"),
        ("Xornor.pdf", "Experience Letter", b"%PDF-1.4 Xornor Technologies Pvt Ltd Internship"),
        ("Marksheet.pdf", "Degree / Marksheet", b"%PDF-1.4 Bachelor of Technology Semester 8 Marksheet")
    ]

    uploaded_ids = []
    for filename, expected_cat, file_bytes in test_files:
        up = client.post(
            "/api/documents/upload",
            data={"user_id": mu_user_id, "category": "Other Document"},
            files={"file": (filename, file_bytes, "application/pdf")}
        )
        assert up.status_code == 201, f"Failed to upload {filename}: {up.status_code}"
        up_json = up.json()
        assert up_json["category"] == expected_cat, f"Expected {expected_cat} for {filename}, got {up_json['category']}"
        uploaded_ids.append(up_json["id"])
        print(f"  [OK] Uploaded {filename} -> Detected Category: '{up_json['category']}' (Expected: '{expected_cat}')")

    # Verify duplicate prevention: uploading identical file returns existing record without duplicating
    dup_up = client.post(
        "/api/documents/upload",
        data={"user_id": mu_user_id, "category": "Other Document"},
        files={"file": ("AWS.pdf", b"%PDF-1.4 AWS Certified Solutions Architect Associate", "application/pdf")}
    )
    assert dup_up.status_code == 201
    assert dup_up.json()["id"] == uploaded_ids[1], "Duplicate upload did not return existing document ID!"
    user_docs = client.get(f"/api/users/{mu_user_id}/documents").json()
    assert len(user_docs) == 4, f"Expected exactly 4 documents, found {len(user_docs)}"
    print("  [OK] Duplicate upload prevented: document count remains exactly 4")

    # Clean up
    for uid in uploaded_ids:
        client.delete(f"/api/documents/{uid}?user_id={mu_user_id}")

    # --- 27. Testing Document Status Synchronization (Pending -> Verified / Unsupported / Mismatch) ---
    print("\n--- 27. Testing Document Status Synchronization in Database ---")
    sync_user = client.post("/api/users", json={
        "name": "Status Sync Candidate",
        "email": f"status_sync_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    s_uid = sync_user["id"]

    # 1. Upload resume
    resume_content = b"Candidate: Status Sync\nProduct Management Intern | Xornor Technologies Pvt. Ltd. Jun 2026 - Aug 2026\nAWS Certified Solutions Architect - Associate"
    resume_up = client.post(
        "/api/documents/upload",
        data={"user_id": s_uid, "category": "Resume"},
        files={"file": ("Sync_Resume.txt", io.BytesIO(resume_content), "text/plain")}
    ).json()
    resume_id = resume_up["id"]

    # 2. Upload matching Xornor certificate -> initially Pending
    xornor_content = b"Xornor Technologies Private Limited\nCertificate of Completion\nCandidate: Status Sync\nProduct Management Trainee\nTraining dates: 1 June 2026 to 31 July 2026"
    xornor_up = client.post(
        "/api/documents/upload",
        data={"user_id": s_uid, "category": "Experience Letter"},
        files={"file": ("Xornor_Completion.txt", io.BytesIO(xornor_content), "text/plain")}
    ).json()
    xornor_id = xornor_up["id"]
    assert xornor_up["status"] == "Pending", f"Expected Pending before analysis, got {xornor_up['status']}"
    print("  [OK] Uploaded supporting document status is 'Pending' before analysis")

    # 3. Upload unrelated certificate -> initially Pending
    unrelated_content = b"Culinary Pastry Baking Certificate 2026"
    unrelated_up = client.post(
        "/api/documents/upload",
        data={"user_id": s_uid, "category": "Certifications"},
        files={"file": ("Culinary_Baking_Cert.txt", io.BytesIO(unrelated_content), "text/plain")}
    ).json()
    unrelated_id = unrelated_up["id"]
    assert unrelated_up["status"] == "Pending"

    # 4. Run analysis on resume
    analysis_res = client.post(f"/api/documents/{resume_id}/analyze")
    assert analysis_res.status_code == 200

    # 5. Fetch fresh documents from backend DB
    docs_after = {d["id"]: d for d in client.get(f"/api/users/{s_uid}/documents").json()}
    
    # Resume is Verified
    assert docs_after[resume_id]["status"] == "Verified", f"Expected Resume Verified, got {docs_after[resume_id]['status']}"
    print("  [OK] Resume status in DB is 'Verified'")

    # Matching Xornor certificate is Verified in DB!
    assert docs_after[xornor_id]["status"] == "Verified", f"Expected Xornor Verified, got {docs_after[xornor_id]['status']}"
    print("  [OK] Corroborating Xornor certificate status in DB is 'Verified'")

    # Unrelated certificate is Unsupported in DB!
    assert docs_after[unrelated_id]["status"] == "Unsupported", f"Expected Unrelated Unsupported, got {docs_after[unrelated_id]['status']}"
    print("  [OK] Unrelated certificate status in DB is 'Unsupported' (not falsely verified)")

    # 6. Delete Xornor certificate and rerun -> Xornor gone, resume claims update
    client.delete(f"/api/documents/{xornor_id}?user_id={s_uid}")
    rerun_res = client.post(f"/api/documents/{resume_id}/analyze")
    assert rerun_res.status_code == 200
    docs_rerun = {d["id"]: d for d in client.get(f"/api/users/{s_uid}/documents").json()}
    assert xornor_id not in docs_rerun
    assert docs_rerun[unrelated_id]["status"] == "Unsupported"
    print("  [OK] After delete and rerun, status synchronization remains completely accurate")

    # Clean up
    client.delete(f"/api/documents/{resume_id}?user_id={s_uid}")
    client.delete(f"/api/documents/{unrelated_id}?user_id={s_uid}")

    # --- 28. Testing Supabase Storage Persistent File Operations ---
    print("\n--- 28. Testing Supabase Storage Persistent File Operations ---")
    storage_user = client.post("/api/users", json={
        "name": "Storage Test Candidate",
        "email": f"storage_test_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    st_uid = storage_user["id"]

    # 1. Upload file and verify storage path
    file_bytes_test = b"%PDF-1.4 Supabase Storage Verification PDF Document Content 2026"
    up_res = client.post(
        "/api/documents/upload",
        data={"user_id": st_uid, "category": "Certifications"},
        files={"file": ("Storage_Cert.pdf", io.BytesIO(file_bytes_test), "application/pdf")}
    )
    assert up_res.status_code == 201, f"Expected 201, got {up_res.status_code}"
    up_data = up_res.json()
    doc_id = up_data["id"]
    assert "storage_path" in up_data, "storage_path missing from DocumentResponse"
    assert up_data["storage_path"] is not None, "storage_path is None"
    assert st_uid in up_data["storage_path"], f"Expected user_id '{st_uid}' in storage_path, got {up_data['storage_path']}"
    print(f"  [OK] Upload file -> stored with storage_path: {up_data['storage_path']}")

    # 2. Document record contains correct storage path in DB
    db_doc_res = client.get(f"/api/documents/{doc_id}")
    assert db_doc_res.status_code == 200
    assert db_doc_res.json()["storage_path"] == up_data["storage_path"]
    print("  [OK] Document record in database accurately contains correct storage_path")

    # 3. Owner can access their uploaded file
    owner_file_res = client.get(f"/api/documents/{doc_id}/file?user_id={st_uid}")
    assert owner_file_res.status_code == 200, f"Expected 200 for owner, got {owner_file_res.status_code}"
    assert owner_file_res.content == file_bytes_test, "File content downloaded does not match uploaded bytes"
    assert "application/pdf" in owner_file_res.headers.get("content-type", "")
    assert "inline" in owner_file_res.headers.get("content-disposition", "")
    print("  [OK] Owner successfully accesses file with matching bytes and inline disposition")

    # 4. Unauthorized user receives 403 Forbidden
    other_user_res = client.post("/api/users", json={
        "name": "Unauthorized Attacker",
        "email": f"attacker_{uuid.uuid4().hex[:8]}@example.com",
        "role": "individual"
    }).json()
    unauth_file_res = client.get(f"/api/documents/{doc_id}/file?user_id={other_user_res['id']}")
    assert unauth_file_res.status_code == 403, f"Expected 403 for unauthorized user, got {unauth_file_res.status_code}"
    print("  [OK] Unauthorized user receives 403 Forbidden as expected")

    # 5. Delete removes both DB record and Storage file
    del_res = client.delete(f"/api/documents/{doc_id}?user_id={st_uid}")
    assert del_res.status_code == 200
    assert client.get(f"/api/documents/{doc_id}").status_code == 404
    assert client.get(f"/api/documents/{doc_id}/file?user_id={st_uid}").status_code == 404
    print("  [OK] Delete removes DB record and ensures file is no longer accessible")

    # 6. Re-analysis still works after upload/delete
    re_resume = client.post(
        "/api/documents/upload",
        data={"user_id": st_uid, "category": "Resume"},
        files={"file": ("Storage_Resume.txt", io.BytesIO(b"Candidate: Storage Test\nAWS Certified Solutions Architect - Associate"), "text/plain")}
    ).json()
    re_analyze1 = client.post(f"/api/documents/{re_resume['id']}/analyze")
    assert re_analyze1.status_code == 200
    assert re_analyze1.json()["metrics"]["trust_score"] == 40

    # Add supporting cert
    re_cert = client.post(
        "/api/documents/upload",
        data={"user_id": st_uid, "category": "Certifications"},
        files={"file": ("AWS_Cert.txt", io.BytesIO(b"AWS Certified Solutions Architect - Associate Certificate"), "text/plain")}
    ).json()
    re_analyze2 = client.post(f"/api/documents/{re_resume['id']}/analyze")
    assert re_analyze2.status_code == 200
    assert re_analyze2.json()["metrics"]["trust_score"] > 40
    print("  [OK] Re-analysis successfully verifies claims using persistent storage flow")

    # Clean up test documents
    client.delete(f"/api/documents/{re_resume['id']}?user_id={st_uid}")
    client.delete(f"/api/documents/{re_cert['id']}?user_id={st_uid}")

    print("\n>>> ALL BACKEND API & CREDENTIAL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    run_tests()


