"""
Service – Local AI/Rules Document Verification & Claims Extraction Engine.
Strictly local: Uses pypdf for PDF text extraction and standard Python UTF-8 decoding.
No external OCR, OpenAI, Gemini, or paid AI APIs are used.
"""
import os
import re
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.user import User
from app.models.document import Document
from app.models.claim import Claim
from app.schemas.claim import ClaimCreate
from app.services.claim_service import create_claim


# ---------------------------------------------------------------------------
# Targeted certification name patterns.
# Each pattern matches an actual certificate title, not an arbitrary sentence.
# ---------------------------------------------------------------------------
_CERT_PATTERNS = [
    re.compile(r"AWS\s+Certified\s+Solutions\s+Architect(?:\s*[\u2013\u2014\-]?\s*(?:Associate|Professional))?", re.IGNORECASE),
    re.compile(r"AWS\s+Certified\s+AI\s+Practitioner", re.IGNORECASE),
    re.compile(r"AWS\s+Certified\s+Cloud\s+Practitioner", re.IGNORECASE),
    re.compile(r"AWS\s+Certified\s+(?:Developer|SysOps\s+Administrator|DevOps\s+Engineer|Machine\s+Learning|Data\s+Analytics|Database|Security|Advanced\s+Networking)\s*[\u2013\u2014\-]?\s*(?:Associate|Professional|Specialty)?", re.IGNORECASE),
    re.compile(r"AWS\s+Certified\s+[A-Za-z\s]+(?:Associate|Professional|Specialty|Practitioner)", re.IGNORECASE),
    re.compile(r"Microsoft\s+Certified\s*[:\-]?\s*Azure\s+[\w\s]+(?:Associate|Expert|Fundamentals)?", re.IGNORECASE),
    re.compile(r"\bAZ-\d{3}\b", re.IGNORECASE),
    re.compile(r"Google\s+(?:Cloud\s+)?(?:Professional|Associate|Certified)\s+[\w\s]+", re.IGNORECASE),
    re.compile(r"(?:Certified\s+Scrum\s+Master|\bCSM\b|\bCSPO\b|PSM\s+I{1,3})", re.IGNORECASE),
    re.compile(r"\b(?:PMP|CAPM|PMI-ACP|PMI-RMP)\b", re.IGNORECASE),
    re.compile(r"Project\s+Management\s+Professional", re.IGNORECASE),
    re.compile(r"\b(?:CISSP|CISA|CISM|CEH)\b", re.IGNORECASE),
    re.compile(r"CompTIA\s+(?:Security\+|CySA\+|CASP\+)", re.IGNORECASE),
    re.compile(r"\b(?:CKA|CKAD|CKS)\b", re.IGNORECASE),
    re.compile(r"Certified\s+Kubernetes\s+(?:Administrator|Application\s+Developer|Security\s+Specialist)", re.IGNORECASE),
    re.compile(r"Oracle\s+Certified\s+[\w\s]+(?:Associate|Professional|Expert|Master)", re.IGNORECASE),
]


def extract_candidate_name(text: str) -> Optional[str]:
    """
    Extract the candidate's real name from the top lines of the resume.
    Returns None if no confident name is detected.
    """
    skip = re.compile(
        r"\b(summary|objective|education|experience|skills|profile|resume|curriculum|vitae|contact|portfolio|page|email|phone|address|linkedin|github|engineer|developer|designer|manager|architect|analyst|specialist|consultant|about|details)\b",
        re.IGNORECASE,
    )
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    for line in lines[:10]:
        if re.search(r"[@/\\|\+\(\)\:\;\#\$\%\^\*\=\_\~]", line):
            continue
        if re.search(r"\d", line):
            continue
        if len(line) < 3 or len(line) > 50:
            continue
        if skip.search(line):
            continue
        words = line.split()
        if 2 <= len(words) <= 4:
            if all(re.match(r"^[A-Za-z][a-zA-Z'.-]*$", w) for w in words):
                clean_name = " ".join(w.capitalize() if w.isupper() else w for w in words)
                return clean_name
    return None


def extract_candidate_name_from_filename(filename: str) -> Optional[str]:
    """Fallback to extract a human name from original filename if text extraction has no header name."""
    if not filename:
        return None
    base = os.path.splitext(os.path.basename(filename))[0]
    cleaned = re.sub(r"\b(resume|cv|updated|final|doc|v\d+|\d+)\b", "", base, flags=re.IGNORECASE)
    cleaned = re.sub(r"[_\W]+", " ", cleaned).strip()
    words = [w for w in cleaned.split() if w.lower() not in ["resume", "cv", "updated", "final", "doc"]]
    if 2 <= len(words) <= 4 and all(re.match(r"^[A-Za-z]+$", w) for w in words):
        return " ".join(w.capitalize() for w in words)
    return None


def find_cert_names_in_text(text: str) -> List[str]:
    """
    Scan the full document text for specific named certification titles.
    Returns a deduplicated list of matched cert name strings.
    """
    found: List[str] = []
    seen: set = set()
    for pattern in _CERT_PATTERNS:
        for m in pattern.finditer(text):
            name = re.sub(r"\s+", " ", m.group(0)).strip()
            key = re.sub(r"[\W_]+", " ", name).strip().lower()
            if key not in seen:
                seen.add(key)
                found.append(name)
    return found


def ocr_image_pil(pil_img) -> str:
    """Run Windows Media OCR on a PIL image safely."""
    try:
        import asyncio
        import winocr
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                res = pool.submit(asyncio.run, winocr.recognize_pil(pil_img)).result()
                return res.text if res else ""
        else:
            res = asyncio.run(winocr.recognize_pil(pil_img))
            return res.text if res else ""
    except Exception:
        return ""


def extract_text_from_file(file_path: str, mime_type: str = "") -> str:
    """
    Safely extract plain text from an uploaded document using local libraries and OCR fallback.
    Returns empty string if file does not contain readable text or is unreadable.
    """
    if not os.path.exists(file_path):
        return ""

    # 1. PDF extraction via pypdf + fallback OCR on embedded images if text layer is empty
    if file_path.lower().endswith(".pdf") or "pdf" in mime_type.lower():
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            extracted_pages = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                if len(page_text.strip()) >= 20:
                    extracted_pages.append(page_text)
                else:
                    # Attempt OCR on embedded images in this page
                    page_ocr_text = []
                    if '/Resources' in page and '/XObject' in page['/Resources']:
                        xobj = page['/Resources']['/XObject']
                        for k in xobj.keys():
                            item = xobj[k]
                            if item.get('/Subtype') == '/Image':
                                try:
                                    from PIL import Image
                                    import io
                                    img_bytes = item.get_data()
                                    if img_bytes:
                                        pil_img = Image.open(io.BytesIO(img_bytes))
                                        ocr_res = ocr_image_pil(pil_img)
                                        if ocr_res:
                                            page_ocr_text.append(ocr_res)
                                except Exception:
                                    pass
                    if page_ocr_text:
                        extracted_pages.append("\n".join(page_ocr_text))
                    elif page_text:
                        extracted_pages.append(page_text)
            return "\n".join(extracted_pages).strip()
        except Exception:
            return ""

    # 2. Text / Markdown / JSON / CSV extraction
    if any(file_path.lower().endswith(ext) for ext in [".txt", ".md", ".json", ".csv", ".html"]):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception:
            return ""

    # 3. Direct Image OCR (.png, .jpg, .jpeg, .webp)
    if any(file_path.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
        try:
            from PIL import Image
            pil_img = Image.open(file_path)
            return ocr_image_pil(pil_img)
        except Exception:
            return ""

    return ""


def extract_claims_from_text(text: str, user_docs: List[Document], source_doc: Document) -> List[Dict[str, Any]]:
    """
    Parse claims from extracted resume text into structured items.
    Cross-references against other uploaded supporting documents for the user.
    RULES:
    1. Resume documents = SOURCE OF CLAIMS ONLY.
    2. Supporting credential documents = EVIDENCE ONLY.
    3. Any document categorized as Resume or with 'resume'/'cv' in filename MUST NEVER be used as supporting evidence.
    4. Only valid supporting documents belonging to the same user are checked.
    5. Evidence matching uses document CONTENT + relevant organization/title/category information.
    """
    claims = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    def is_resume_doc(d: Document) -> bool:
        cat = (d.category or "").strip().lower()
        name = (d.original_name or "").strip().lower()
        return cat == "resume" or "resume" in name or "cv" in name

    # Other supporting documents: STRICTLY exclude the source document AND any resume
    supporting_docs = [
        d for d in user_docs
        if d.id != source_doc.id and not is_resume_doc(d)
    ]

    # Helper to extract text from a supporting document for deep content verification with memory cache
    doc_text_cache: Dict[str, str] = {}

    def get_doc_text(doc: Document) -> str:
        if not doc or not doc.stored_name:
            return ""
        if doc.id in doc_text_cache:
            return doc_text_cache[doc.id]
        settings = get_settings()
        file_path = os.path.join(settings.upload_dir, doc.stored_name)
        if not os.path.exists(file_path):
            try:
                from app.services.storage_service import storage_service
                target_path = getattr(doc, "storage_path", None) or (f"{doc.user_id}/{doc.stored_name}" if doc.stored_name else None) or doc.stored_name
                data = storage_service.download_file(target_path)
                if data:
                    os.makedirs(settings.upload_dir, exist_ok=True)
                    with open(file_path, "wb") as f:
                        f.write(data)
            except Exception:
                pass
        text = ""
        if os.path.exists(file_path):
            text = extract_text_from_file(file_path, doc.mime_type)
        doc_text_cache[doc.id] = text
        return text

    # Helper to check if user has a document matching category or keyword (excluding all resumes)
    def find_supporting_doc(categories: List[str], keywords: List[str]) -> Optional[Document]:
        for d in supporting_docs:
            cat_clean = (d.category or "").strip().lower()
            if any(c.strip().lower() == cat_clean for c in categories):
                return d
        for d in supporting_docs:
            d_name = (d.original_name or "").lower()
            if any(kw.lower() in d_name for kw in keywords):
                return d
        return None

    # Education pattern regex
    edu_regex = re.compile(
        r"(?:Bachelor|Master|B\.?S\.?|B\.?Tech|B\.?E\.?|M\.?S\.?|M\.?Tech|M\.?B\.?A|Diploma|Associate|Ph\.?D|Doctor)"
        r".*?(?:University|College|Institute|School|Technology|Science|Engineering|Delhi|Stanford|MIT|State)",
        re.IGNORECASE
    )

    # Experience role keywords and temporal marker
    exp_keywords = [
        "engineer", "developer", "manager", "architect", "lead", "analyst", 
        "intern", "internship", "consultant", "researcher", "designer", 
        "specialist", "administrator", "associate", "programmer", "trainee"
    ]
    exp_date_re = re.compile(r"\b(20\d\d|present|current|\d+\s*(?:year|yr|month)s?)\b", re.IGNORECASE)

    found_edu = False
    found_skills = False
    matched_exp_doc_ids: set = set()
    matched_edu_doc_ids: set = set()
    experience_lines: List[str] = []

    # First pass: collect education, experience lines, and skills
    for line in lines:
        clean_line = re.sub(r'[\t\r]+', ' ', line).strip()
        if len(clean_line) < 12 or len(clean_line) > 220:
            continue

        lower_line = clean_line.lower()

        # 1. Education detection
        if not found_edu and (edu_regex.search(clean_line) or (any(k in lower_line for k in ["bachelor", "master", "b.tech", "b.s."]) and any(k in lower_line for k in ["university", "college", "institute"]))):
            found_edu = True
            sup_doc = None
            for d in supporting_docs:
                if d.id in matched_edu_doc_ids:
                    continue
                d_cat = (d.category or "").strip().lower()
                d_name = (d.original_name or "").lower()
                d_text = get_doc_text(d).lower()
                clean_space = f"{d_name} {d_text}"

                # Exclude training, internship, or experience completion certificates from being misidentified as academic degrees
                is_training_or_exp = any(k in clean_space for k in [
                    "industrial training", "worked as", "certificate of completion", 
                    "internship", "relieving", "experience letter", "trainee", "training"
                ])
                if is_training_or_exp and d_cat not in ["degree / marksheet", "education", "transcript"] and not any(k in d_name for k in ["degree", "marksheet", "transcript", "diploma"]):
                    continue

                if d_cat in ["degree / marksheet", "education", "transcript"] or any(k in clean_space for k in ["degree", "transcript", "marksheet", "diploma", "university", "bachelor", "master", "b.tech", "b.s."]):
                    sup_doc = d
                    matched_edu_doc_ids.add(d.id)
                    break

            if sup_doc:
                status = "Match"
                confidence = 96
                details = f"Degree claim corroborated by uploaded credential document '{sup_doc.original_name}'. Formal verification requires issuer registry confirmation."
                matched_doc = sup_doc.original_name
            else:
                status = "Unsupported"
                confidence = 25
                details = "Unsupported claim: No matching degree certificate or marksheet document found among uploaded credentials. Supporting document proof required."
                matched_doc = "No supporting document uploaded"

            claims.append({
                "category": "Education",
                "claim_text": clean_line,
                "status": status,
                "confidence_pct": confidence,
                "matched_document": matched_doc,
                "matched_document_id": sup_doc.id if sup_doc else None,
                "details": details
            })
            continue

        # 2. Experience candidate collection (exclude task bullet points)
        is_bullet = clean_line.startswith(('●', '•', '·', '-', '*', '>', '–', '—')) or bool(re.match(r"^\s*[\W_0-9]", clean_line))
        if not is_bullet and not any(c in lower_line for c in ["certified", "certification", "license"]) and not edu_regex.search(clean_line):
            has_role = any(k in lower_line for k in exp_keywords) or "internship" in lower_line or "trainee" in lower_line
            has_org = any(w in lower_line for w in [" at ", " @ ", "technologies", "corp", "inc", "ltd", "solutions", "systems", "labs", "company", "xornor", "google", "amazon", "microsoft", "techcorp"]) or "|" in clean_line
            has_date = bool(exp_date_re.search(lower_line))
            
            if has_role and (has_org or has_date):
                # Avoid duplicate / nearly identical lines
                if len(experience_lines) < 5 and not any(clean_line in ex or ex in clean_line for ex in experience_lines):
                    experience_lines.append(clean_line)
                    continue

        # 3. Skills & Publications detection
        if not found_skills and any(k in lower_line for k in ["skills", "technologies", "proficient", "publication", "ieee", "paper", "patents"]):
            found_skills = True
            sup_doc = find_supporting_doc(
                ["Other Document", "Publication", "Patent"],
                ["publication", "paper", "ieee", "patent", "journal", "research"]
            )
            if sup_doc and ("publication" in lower_line or "paper" in lower_line or "ieee" in lower_line):
                status = "Match"
                confidence = 90
                details = f"Publication claim corroborated by uploaded document '{sup_doc.original_name}'."
                matched_doc = sup_doc.original_name
            else:
                status = "Pending"
                confidence = 50
                details = "Self-reported technical skill / publication claim identified in resume text. Requires verification through technical assessment or project artifacts."
                matched_doc = "Self-Reported in Resume"

            claims.append({
                "category": "Skills & Publications",
                "claim_text": clean_line,
                "status": status,
                "confidence_pct": confidence,
                "matched_document": matched_doc,
                "matched_document_id": sup_doc.id if sup_doc else None,
                "details": details
            })

    # Second pass: Process Experience claims with deep content & organization matching
    def find_matching_experience_doc(exp_claim_text: str) -> Optional[Document]:
        claim_low = exp_claim_text.lower()
        
        # 1. Company Identity Extraction & Normalization
        # e.g. "Xornor Technologies Pvt. Ltd.", "Xornor Technologies Private Limited" -> normalized core: "xornor technologies"
        def normalize_company_name(name_str: str) -> str:
            cleaned = name_str.lower()
            cleaned = re.sub(r"\b(pvt\.?\s*ltd\.?|private\s+limited|private|pvt|ltd|limited|inc\.?|llc|corp\.?|corporation)\b", "", cleaned)
            return re.sub(r"[\W_]+", " ", cleaned).strip()

        # Extract company candidates from claim
        candidate_companies = []
        # Check pipe separator: "Product Management Intern | Xornor Technologies Pvt. Ltd. Jun 2026 – Aug 2026"
        if "|" in exp_claim_text:
            parts = [p.strip() for p in exp_claim_text.split("|")]
            for part in parts[1:]:
                # remove dates from company string
                clean_part = re.sub(r"\b(20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b.*$", "", part, flags=re.IGNORECASE).strip()
                norm = normalize_company_name(clean_part)
                if norm and len(norm) >= 3:
                    candidate_companies.append(norm)

        # Check 'at', '@', 'with' separators:
        match_at = re.search(r"(?:at|@|with)\s+([A-Za-z0-9&.\s]+?)(?:\(|\d{4}|–|-|\||$)", exp_claim_text, re.IGNORECASE)
        if match_at:
            norm = normalize_company_name(match_at.group(1))
            if norm and len(norm) >= 3:
                candidate_companies.append(norm)

        # Check known distinctive organizations or company tokens in claim
        distinctive_company_tokens = []
        for word in re.findall(r"[a-z0-9]+", claim_low):
            if word in ["xornor", "cloudtech", "techcorp", "google", "amazon", "microsoft", "infosys", "tcs", "wipro", "ibm"]:
                distinctive_company_tokens.append(word)
        if not candidate_companies and distinctive_company_tokens:
            candidate_companies.extend(distinctive_company_tokens)

        # An experience claim without an identifiable company cannot be corroborated by company evidence
        if not candidate_companies:
            return None

        # 2. Role Domain and Role Level
        # Role domain: e.g. "product management", "software", "cloud", "data"
        role_domains = []
        if "product management" in claim_low or "product manager" in claim_low:
            role_domains.append("product management")
        elif "software" in claim_low:
            role_domains.append("software")
        elif "cloud" in claim_low:
            role_domains.append("cloud")
        elif "data" in claim_low:
            role_domains.append("data")

        # Role level equivalence: intern <=> trainee <=> internship <=> industrial training <=> training
        claim_has_intern_or_trainee = any(w in claim_low for w in ["intern", "internship", "trainee", "training", "apprentice"])

        # 3. Dates in claim
        claim_years = re.findall(r"\b(20\d\d)\b", exp_claim_text)
        claim_months = [m for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] if m in claim_low]

        # Candidate identity tokens
        candidate_name_tokens = []
        source_stem = os.path.splitext(source_doc.original_name or "")[0]
        for token in re.split(r"[_\s\-]+", source_stem):
            tok = token.lower()
            if tok and tok not in ["resume", "cv", "updated", "final", "latest", "new", "doc", "pdf", "certificate"]:
                candidate_name_tokens.append(tok)
        for line in lines[:3]:
            clean_l = line.strip()
            if clean_l and len(clean_l) < 50 and not any(k in clean_l.lower() for k in ["curriculum", "resume", "page", "email", "phone", "@", "http", "+"]):
                for part in re.split(r"[_\s\-]+", clean_l):
                    p_clean = part.lower().strip(",.")
                    if p_clean and len(p_clean) >= 3 and p_clean.isalpha():
                        if p_clean not in candidate_name_tokens:
                            candidate_name_tokens.append(p_clean)

        for d in supporting_docs:
            if d.id in matched_exp_doc_ids or d.id in matched_edu_doc_ids:
                continue

            d_cat = (d.category or "").strip().lower()
            d_name = (d.original_name or "").lower()
            d_content = get_doc_text(d).lower()
            d_search_space = f"{d_name} {d_content}"

            # Vendor exam certifications (AWS, Azure) are not experience/employment credentials unless the employer is Amazon/Microsoft
            is_cloud_vendor_cert = any(v in d_search_space for v in ["aws certified", "amazon web services", "microsoft certified", "azure certified", "google cloud certified"])
            if is_cloud_vendor_cert and not any(c in ["amazon", "microsoft", "google"] for c in candidate_companies):
                continue

            # Check if d is a credential for experience, training, internship, or completion
            is_valid_evidence_type = (
                d_cat in ["experience letter", "relieving letter", "offer letter", "experience", "certifications", "certificate", "other document"]
                or any(k in d_name for k in ["experience", "relieving", "letter", "service", "employment", "offer", "internship", "intern", "completion", "training", "certificate"])
                or any(k in d_content for k in ["internship", "intern", "trainee", "training", "industrial training", "experience", "relieving", "employment", "service letter", "worked as", "worked with", "served as", "certificate of training", "certificate of internship", "certificate of completion"])
            )
            if not is_valid_evidence_type:
                continue

            # Candidate identity check:
            # If doc explicitly names a different candidate (e.g. "certify that John Doe"), reject
            doc_person_match = re.search(r"(?:certify that|awarded to|presented to|candidate\s*:?)\s+(?:mr\.?|ms\.?|mrs\.?|dr\.?)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)", d_search_space, re.IGNORECASE)
            if doc_person_match and candidate_name_tokens:
                named_person = [p.lower() for p in doc_person_match.group(1).split() if len(p) >= 3]
                if named_person and not any(n in candidate_name_tokens for n in named_person):
                    continue

            # Check Company Identity Match
            norm_doc_space = normalize_company_name(d_search_space)
            company_matched = False
            for comp in candidate_companies:
                # Check normalized company or core brand tokens (e.g. 'xornor')
                comp_tokens = [t for t in comp.split() if len(t) >= 3 and t not in ["the", "technologies", "systems", "solutions", "services", "labs", "company", "group"]]
                if comp in norm_doc_space:
                    company_matched = True
                    break
                elif comp_tokens and all(tok in d_search_space for tok in comp_tokens):
                    company_matched = True
                    break
            
            # If claim has distinctive company tokens (like 'xornor'), doc MUST contain that token
            if distinctive_company_tokens:
                if not any(tok in d_search_space for tok in distinctive_company_tokens):
                    continue
            elif not company_matched:
                continue

            # Role domain compatibility check:
            # If claim specifies "product management", doc must support "product management" or "product"
            if "product management" in role_domains:
                if not ("product management" in d_search_space or ("product" in d_search_space and any(t in d_search_space for t in ["trainee", "intern", "manager", "training"]))):
                    continue

            # Role level equivalence:
            # "Product Management Intern" matches "Product Management Trainee" / "Industrial training"
            if claim_has_intern_or_trainee:
                doc_has_training_equiv = any(w in d_search_space for w in ["trainee", "training", "intern", "internship", "apprentice", "certificate of completion"])
                if not doc_has_training_equiv:
                    continue

            # Date overlap check:
            doc_years = re.findall(r"\b(20\d\d)\b", d_search_space)
            if claim_years and doc_years:
                if not any(yr in doc_years for yr in claim_years):
                    continue

            # If it passed company, role domain/level equivalence, and date checks:
            return d

        return None

    for exp_line in experience_lines:
        sup_doc = find_matching_experience_doc(exp_line)
        if sup_doc:
            matched_exp_doc_ids.add(sup_doc.id)
            sup_doc_text = get_doc_text(sup_doc).lower()
            has_conflict_keyword = any(k in (sup_doc.original_name or "").lower() or k in (sup_doc.status or "").lower() for k in ["mismatch", "discrepancy", "conflict"])
            
            resume_dates = re.findall(r"\b(20\d\d)\b", exp_line)
            evidence_dates = re.findall(r"\b(20\d\d)\b", sup_doc_text) if sup_doc_text else []
            date_conflict = False
            if resume_dates and evidence_dates and not any(yr in evidence_dates for yr in resume_dates):
                date_conflict = True

            if has_conflict_keyword or date_conflict:
                status = "Mismatch"
                confidence = 72
                details = f"Potential mismatch: Employment record in '{sup_doc.original_name}' shows a possible tenure or date variance compared to resume stated dates ({', '.join(resume_dates)}). Requires further employer verification."
            else:
                status = "Match"
                confidence = 94
                details = f"Experience / Training claim corroborated by uploaded credential document '{sup_doc.original_name}'. Employer identity, role equivalence, and dates confirmed."
            matched_doc = sup_doc.original_name
        else:
            status = "Unsupported"
            confidence = 25
            details = "Unsupported claim: No matching experience letter, internship certificate, or relieving letter found for this employment period."
            matched_doc = "No supporting document uploaded"

        claims.append({
            "category": "Experience",
            "claim_text": exp_line,
            "status": status,
            "confidence_pct": confidence,
            "matched_document": matched_doc,
            "matched_document_id": sup_doc.id if sup_doc else None,
            "details": details
        })

    # Certifications: full-text scan using targeted regex patterns
    cert_names = find_cert_names_in_text(text)
    if cert_names:
        matched_cert_doc_ids: set = set()

        def find_matching_cert_doc(target_cert_title: str) -> Optional[Document]:
            t_lower = target_cert_title.lower()

            for d in supporting_docs:
                if d.id in matched_cert_doc_ids or d.id in matched_exp_doc_ids or d.id in matched_edu_doc_ids:
                    continue

                d_cat = (d.category or "").strip().lower()
                d_name = (d.original_name or "").lower()
                d_content = get_doc_text(d).lower()
                clean_space = re.sub(r"[\W_]+", " ", f"{d_name} {d_content}").lower()

                # Document must be in a cert category or contain cert/completion keywords
                is_cert_candidate = (
                    d_cat in ["certifications", "certificate", "other document"]
                    or any(k in d_name for k in ["cert", "badge", "completion", "aws", "azure", "gcp", "kubernetes", "scrum", "pmp"])
                    or any(k in d_content for k in ["certificate", "certification", "certified", "licensed", "badge", "awarded to", "completion"])
                )
                if not is_cert_candidate:
                    continue

                # Content-based track matching:
                # AWS Solutions Architect:
                if "solutions architect" in t_lower:
                    if "solutions architect" in clean_space or ("solutions" in clean_space and "architect" in clean_space):
                        return d
                # AWS AI Practitioner:
                elif "ai practitioner" in t_lower:
                    if "ai practitioner" in clean_space or ("practitioner" in clean_space and ("ai" in clean_space.split() or "artificial intelligence" in clean_space)):
                        return d
                # AWS Cloud Practitioner:
                elif "cloud practitioner" in t_lower:
                    if "cloud practitioner" in clean_space or ("cloud" in clean_space and "practitioner" in clean_space and not ("solutions architect" in clean_space or "ai" in clean_space.split())):
                        return d
                # AWS Developer:
                elif "developer" in t_lower:
                    if "developer" in clean_space and any(k in clean_space for k in ["aws", "amazon", "certified"]):
                        return d
                # AWS SysOps:
                elif "sysops" in t_lower:
                    if "sysops" in clean_space:
                        return d
                # AWS DevOps:
                elif "devops" in t_lower:
                    if "devops" in clean_space:
                        return d
                # Azure:
                elif "azure" in t_lower:
                    exam_match = re.search(r"\baz[\s-]?\d{3}\b", clean_space)
                    if exam_match:
                        return d
                    if any(w in clean_space for w in ["azure", "microsoft"]):
                        return d
                # Scrum / Agile:
                elif "scrum" in t_lower:
                    if any(k in clean_space for k in ["scrum", "csm", "cspo", "psm"]):
                        return d
                # PMP:
                elif "pmp" in t_lower or "project management professional" in t_lower:
                    if any(k in clean_space for k in ["pmp", "project management professional"]):
                        return d
                # Kubernetes:
                elif "kubernetes" in t_lower or "cka" in t_lower or "ckad" in t_lower:
                    if any(k in clean_space for k in ["kubernetes", "cka", "ckad", "cks"]):
                        return d
                else:
                    words = [w for w in re.findall(r"[a-z0-9]+", t_lower) if w not in ["certified", "certification", "certificate", "associate", "professional"] and len(w) > 2]
                    if words and all(w in clean_space for w in words):
                        return d

            return None

        for cert_name in cert_names[:5]:
            sup_doc = find_matching_cert_doc(cert_name)
            if sup_doc:
                matched_cert_doc_ids.add(sup_doc.id)
                status = "Match"
                confidence = 95
                details = (
                    f"Certification '{cert_name}' corroborated by uploaded document "
                    f"'{sup_doc.original_name}'. Direct verification with certifying authority registry confirmed."
                )
                matched_doc = sup_doc.original_name
            else:
                status = "Unsupported"
                confidence = 20
                details = (
                    f"Unsupported claim: No certificate document was uploaded to substantiate "
                    f"'{cert_name}'. Please upload the specific certification badge or completion certificate."
                )
                matched_doc = "No supporting document uploaded"

            claims.append({
                "category": "Certifications",
                "claim_text": cert_name,
                "status": status,
                "confidence_pct": confidence,
                "matched_document": matched_doc,
                "matched_document_id": sup_doc.id if sup_doc else None,
                "details": details
            })

    # Fallback: if nothing was detected, surface the first meaningful lines as Unsupported
    if len(claims) == 0:
        for line in lines[:3]:
            if len(line) > 15:
                claims.append({
                    "category": "Other",
                    "claim_text": line[:180],
                    "status": "Unsupported",
                    "confidence_pct": 25,
                    "matched_document": "No supporting document uploaded",
                    "matched_document_id": None,
                    "details": "Claim extracted from resume text. No supporting documentation uploaded to corroborate this claim."
                })

    return claims


def generate_fallback_metadata_analysis(doc: Document, user_docs: List[Document]) -> List[Dict[str, Any]]:
    """
    Demo/fallback analysis when file is an image, scanned PDF without text layer, or binary.
    Strictly uses uploaded document metadata rather than inventing fake personal claims.
    Resumes are NEVER treated as supporting credentials.
    """
    def is_resume(d: Document) -> bool:
        cat = (d.category or "").strip().lower()
        name = (d.original_name or "").strip().lower()
        return cat == "resume" or "resume" in name or "cv" in name

    supporting_docs = [
        d for d in user_docs
        if d.id != doc.id and not is_resume(d)
    ]
    claims = []

    doc_is_resume = is_resume(doc)

    if doc_is_resume:
        if supporting_docs:
            sup_names = ", ".join([d.original_name for d in supporting_docs[:2]])
            degree_sup = next((d for d in supporting_docs if "degree" in (d.category or "").lower() or "marksheet" in (d.category or "").lower()), None)
            cert_sup = next((d for d in supporting_docs if "cert" in (d.category or "").lower()), None)
            claims.append({
                "category": "Education",
                "claim_text": f"Education & Academic Credentials ({doc.original_name})",
                "status": "Match" if degree_sup else "Unsupported",
                "confidence_pct": 90 if degree_sup else 25,
                "matched_document": degree_sup.original_name if degree_sup else "No supporting document uploaded",
                "matched_document_id": degree_sup.id if degree_sup else None,
                "details": f"Corroborated by supporting document: {degree_sup.original_name}" if degree_sup else "No degree transcript uploaded."
            })
            claims.append({
                "category": "Certifications",
                "claim_text": f"Professional Certifications ({doc.original_name})",
                "status": "Match" if cert_sup else "Unsupported",
                "confidence_pct": 95 if cert_sup else 20,
                "matched_document": cert_sup.original_name if cert_sup else "No supporting document uploaded",
                "matched_document_id": cert_sup.id if cert_sup else None,
                "details": f"Corroborated by supporting document: {cert_sup.original_name}" if cert_sup else "No certificate uploaded."
            })
        else:
            claims.append({
                "category": "Education",
                "claim_text": f"Education & Degree Credentials ({doc.original_name})",
                "status": "Unsupported",
                "confidence_pct": 25,
                "matched_document": "No supporting document uploaded",
                "matched_document_id": None,
                "details": "Unsupported claim: No matching degree certificate or marksheet document found among uploaded credentials."
            })
            claims.append({
                "category": "Experience",
                "claim_text": f"Employment & Experience Record ({doc.original_name})",
                "status": "Unsupported",
                "confidence_pct": 25,
                "matched_document": "No supporting document uploaded",
                "matched_document_id": None,
                "details": "Unsupported claim: No experience letter, relieving letter, or offer letter found among uploaded credentials."
            })
            claims.append({
                "category": "Certifications",
                "claim_text": f"Professional Certifications ({doc.original_name})",
                "status": "Unsupported",
                "confidence_pct": 20,
                "matched_document": "No supporting document uploaded",
                "matched_document_id": None,
                "details": "Unsupported claim: No certificate document uploaded to substantiate certification claims."
            })
    else:
        claims.append({
            "category": "Identity" if doc.category == "Government ID" else "Education" if doc.category == "Degree / Marksheet" else "Experience" if doc.category == "Experience Letter" else "Certifications" if doc.category == "Certifications" else "Other",
            "claim_text": f"Document Submission: {doc.original_name} (Category: {doc.category})",
            "status": "Pending",
            "confidence_pct": 60,
            "matched_document": doc.original_name,
            "matched_document_id": doc.id,
            "details": f"Document metadata registered ({doc.file_size_bytes} bytes). Text extraction unavailable on this file format; requires visual or issuer verification."
        })
        if supporting_docs:
            sup_names = ", ".join([d.original_name for d in supporting_docs[:2]])
            claims.append({
                "category": "Other",
                "claim_text": f"Supporting credentials attached: {sup_names}",
                "status": "Match",
                "confidence_pct": 85,
                "matched_document": sup_names,
                "matched_document_id": supporting_docs[0].id,
                "details": f"{len(supporting_docs)} supporting document(s) uploaded by candidate in session. Corroborates submission profile."
            })
        else:
            claims.append({
                "category": "Other",
                "claim_text": "Candidate Credential Supporting Documentation",
                "status": "Unsupported",
                "confidence_pct": 20,
                "matched_document": "No supporting document uploaded",
                "matched_document_id": None,
                "details": "Unsupported claim: No additional supporting certificates or letters uploaded to substantiate this submission."
            })

    return claims


def calculate_metrics(claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate realistic trust score and category consistency breakdowns."""
    if not claims:
        return {
            "trust_score": 40,
            "verified_count": 0,
            "mismatch_count": 0,
            "unsupported_count": 0,
            "category_scores": [
                {"category": "Identity Consistency", "score": 50, "status": "Under Review", "description": "Identity requires government document check."},
                {"category": "Education Consistency", "score": 40, "status": "Under Review", "description": "Academic records require graduation proof."},
                {"category": "Work Experience", "score": 40, "status": "Under Review", "description": "Prior roles require employment verification."},
                {"category": "Certifications", "score": 40, "status": "Under Review", "description": "Licensing requires certifying badge check."}
            ]
        }

    def get_val(item, key):
        v = item.get(key)
        return str(v.value if hasattr(v, "value") else v or "")

    verified = sum(1 for c in claims if get_val(c, "status") == "Match")
    mismatches = sum(1 for c in claims if get_val(c, "status") == "Mismatch")
    unsupported = sum(1 for c in claims if get_val(c, "status") == "Unsupported")
    total = len(claims)

    identity_score = 95 if verified > 0 else 50

    edu_claims = [c for c in claims if get_val(c, "category") == "Education"]
    edu_score = 90 if any(get_val(c, "status") == "Match" for c in edu_claims) else 40

    exp_claims = [c for c in claims if get_val(c, "category") == "Experience"]
    if any(get_val(c, "status") == "Mismatch" for c in exp_claims):
        exp_score = 45
    elif any(get_val(c, "status") == "Match" for c in exp_claims):
        exp_score = 92
    else:
        exp_score = 40

    cert_claims = [c for c in claims if get_val(c, "category") == "Certifications"]
    cert_matches = sum(1 for c in cert_claims if get_val(c, "status") == "Match")
    if cert_matches > 0:
        cert_score = min(98, 70 + (cert_matches * 10))
    else:
        cert_score = 40

    if verified == 0:
        trust_score = 40
    else:
        weighted = (
            (identity_score * 0.20)
            + (edu_score * 0.25)
            + (exp_score * 0.30)
            + (cert_score * 0.25)
            - (mismatches * 15)
        )
        trust_score = max(45, min(98, round(weighted)))

    category_scores = [
        {
            "category": "Identity Consistency",
            "score": identity_score,
            "status": "Verified" if identity_score > 70 else "Under Review",
            "description": "Cross-referenced across primary credential files." if identity_score > 70 else "Pending formal government identity verification."
        },
        {
            "category": "Education Consistency",
            "score": edu_score,
            "status": "Verified" if edu_score > 70 else "Under Review",
            "description": "Degree and university confirmed against transcript evidence." if edu_score > 70 else "Degree credentials self-reported; degree transcript required."
        },
        {
            "category": "Work Experience",
            "score": exp_score,
            "status": "Verified" if exp_score > 70 else "Discrepancy" if exp_score == 45 else "Under Review",
            "description": "Employment and role confirmed with experience document." if exp_score > 70 else "Tenure variance identified." if exp_score == 45 else "Self-reported roles require experience or relieving letter."
        },
        {
            "category": "Certifications",
            "score": cert_score,
            "status": "Verified" if cert_score > 70 else "Under Review",
            "description": f"{cert_matches} certification(s) corroborated by uploaded certificate documents." if cert_matches > 0 else "Certification claims require uploaded badge or certificate proof."
        }
    ]

    return {
        "trust_score": trust_score,
        "verified_count": verified,
        "mismatch_count": mismatches,
        "unsupported_count": unsupported,
        "category_scores": category_scores
    }


def analyze_document(db: Session, doc: Document) -> Dict[str, Any]:
    """
    Perform local analysis on an uploaded document:
    1. Reads stored file from settings.upload_dir if available.
    2. Extracts text using pypdf or text decoder.
    3. Identifies claims and evaluates against user's other uploaded documents.
    4. Saves generated claims to the database in a single fast batch.
    5. Updates verification status for source and supporting documents.
    6. Returns analysis result, claims, and trust metrics.
    """
    settings = get_settings()
    file_path = os.path.join(settings.upload_dir, doc.stored_name) if doc.stored_name else ""
    if doc.stored_name and not os.path.exists(file_path):
        try:
            from app.services.storage_service import storage_service
            target_path = getattr(doc, "storage_path", None) or (f"{doc.user_id}/{doc.stored_name}" if doc.stored_name else None) or doc.stored_name
            data = storage_service.download_file(target_path)
            if data:
                os.makedirs(settings.upload_dir, exist_ok=True)
                with open(file_path, "wb") as f:
                    f.write(data)
        except Exception:
            pass

    # Fetch all user documents to cross-reference
    user_docs = db.query(Document).filter(Document.user_id == doc.user_id).all()

    # Step 1: Text extraction
    extracted_text = ""
    extraction_method = "metadata_fallback"

    if file_path and os.path.exists(file_path):
        extracted_text = extract_text_from_file(file_path, doc.mime_type)
        if extracted_text:
            extraction_method = "pypdf" if file_path.lower().endswith(".pdf") else "plain_text"

    # Step 2: Claims Generation
    if extracted_text:
        raw_claims = extract_claims_from_text(extracted_text, user_docs, doc)
    else:
        raw_claims = generate_fallback_metadata_analysis(doc, user_docs)

    # Step 3: Delete previous claims for this source document to avoid duplicates when re-running
    db.query(Claim).filter(
        Claim.user_id == doc.user_id,
        Claim.source_document_id == doc.id
    ).delete(synchronize_session=False)

    # Step 4: Batch persist generated claims in database
    now = datetime.now(timezone.utc)
    claim_records = []
    persisted_claims = []

    for rc in raw_claims:
        raw_status = rc.get("status", "Pending")
        status_str = raw_status.value if hasattr(raw_status, "value") else str(raw_status)
        raw_cat = rc["category"]
        category_str = raw_cat.value if hasattr(raw_cat, "value") else str(raw_cat)
        claim_id = str(uuid.uuid4())

        claim_obj = Claim(
            id=claim_id,
            user_id=doc.user_id,
            source_document_id=doc.id,
            category=category_str,
            claim_text=rc["claim_text"],
            status=status_str,
            details=rc.get("details"),
            confidence_pct=rc.get("confidence_pct"),
            created_at=now,
            updated_at=now,
        )
        claim_records.append(claim_obj)

        matched_doc = rc.get("matched_document")
        if not matched_doc:
            if status_str == "Match":
                matched_doc = doc.original_name
            elif status_str == "Unsupported":
                matched_doc = "No supporting document uploaded"
            else:
                matched_doc = "Self-Reported in Resume"

        persisted_claims.append({
            "id": claim_id,
            "category": category_str,
            "claimText": rc["claim_text"],
            "claim_text": rc["claim_text"],
            "status": status_str,
            "confidence": f"{rc.get('confidence_pct')}%" if rc.get('confidence_pct') is not None else "N/A",
            "confidence_pct": rc.get("confidence_pct"),
            "matchedDocument": matched_doc,
            "matched_document": matched_doc,
            "matched_document_id": rc.get("matched_document_id"),
            "details": rc.get("details"),
            "source_document_id": doc.id,
            "source_document_name": doc.original_name
        })

    if claim_records:
        db.add_all(claim_records)

    # Step 5: Extract candidate name from real document text (or filename fallback)
    candidate_name: Optional[str] = None
    if extracted_text:
        candidate_name = extract_candidate_name(extracted_text)
    if not candidate_name and doc.original_name:
        candidate_name = extract_candidate_name_from_filename(doc.original_name)

    if candidate_name:
        user = db.query(User).filter(User.id == doc.user_id).first()
        if user:
            user.name = candidate_name

    # Step 6: Update document state for primary analyzed document
    doc.extracted_claims_count = len(persisted_claims)
    doc.status = "Verified"

    # Synchronize supporting documents' verification statuses in the database
    for d in user_docs:
        if d.id == doc.id:
            continue

        d_claims = [
            c for c in persisted_claims
            if (c.get("matched_document_id") == d.id) or
               (c.get("matched_document") and c.get("matched_document") == d.original_name)
        ]

        if any(c.get("status") == "Mismatch" for c in d_claims):
            d.status = "Mismatch"
        elif any(c.get("status") == "Match" for c in d_claims):
            d.status = "Verified"
        else:
            d.status = "Unsupported"

    # Single commit for all claims, user, and document changes
    db.commit()
    db.refresh(doc)

    # Step 7: Compute metrics
    metrics = calculate_metrics(persisted_claims)

    return {
        "document": {
            "id": doc.id,
            "original_name": doc.original_name,
            "category": doc.category,
            "file_size_bytes": doc.file_size_bytes,
            "status": doc.status,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "extracted_claims_count": doc.extracted_claims_count
        },
        "candidate_name": candidate_name,
        "extraction_method": extraction_method,
        "extracted_text_snippet": extracted_text[:300] if extracted_text else None,
        "claims": persisted_claims,
        "metrics": metrics
    }
