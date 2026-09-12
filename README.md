# CredVerify

**AI-Powered Professional & Academic Credential Verification Platform**

CredVerify is a full-stack platform that helps verify professional and academic credentials by comparing claims made in resumes with uploaded supporting documents.

It identifies whether a claim is:

- **Verified / Match**
- **Mismatch**
- **Unsupported**

The platform also generates a **Trust Score** and verification report to help candidates and recruiters evaluate credential consistency.

## Features

- Resume upload and claim extraction
- Supporting credential/document upload
- AI-assisted credential verification
- Resume claim vs document evidence comparison
- Match, Mismatch and Unsupported status detection
- Trust Score generation
- Verification reports
- Candidate dashboard
- Recruiter dashboard
- Public verification profile
- Secure document storage
- User authentication
- Multiple document support
- Automatic document category detection
- Document deletion and re-analysis
- Shareable verification profile

## How It Works

1. User creates an account and signs in.
2. User uploads their resume.
3. CredVerify extracts important claims from the resume.
4. User uploads supporting documents such as certificates, experience letters or academic documents.
5. The verification engine compares resume claims with supporting evidence.
6. Each claim is classified as Match, Mismatch or Unsupported.
7. CredVerify calculates a Trust Score.
8. A detailed verification report is generated.
9. Users can share their public verification profile with recruiters.

## Architecture

```text
                    +---------------------+
                    |    User / Recruiter |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |    React + Vite     |
                    |      Frontend       |
                    +----------+----------+
                               |
                          REST API
                               |
                               v
                    +---------------------+
                    |   FastAPI Backend   |
                    |       Python        |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
    +---------------------+          +---------------------+
    |      Supabase       |          | Verification Engine |
    | PostgreSQL + Storage|          |       Python        |
    +---------------------+          +----------+----------+
                                                |
                                                v
                                     +---------------------+
                                     |  Claim vs Evidence  |
                                     |       Analysis      |
                                     +----------+----------+
                                                |
                                                v
                                     +---------------------+
                                     | Trust Score + Report|
                                     +---------------------+
```

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- React Router

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- PyPDF

### Database & Storage
- Supabase PostgreSQL
- Supabase Storage

### Deployment
- Vercel - Frontend
- Render - Backend
- Supabase - Database & Storage

## Project Structure

```text
credverify/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   ├── database.py
│   │   └── config.py
│   ├── requirements.txt
│   └── test_api.py
│
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
│
└── README.md
```

## Verification Logic

CredVerify does not treat a resume as proof by itself.

Instead, resume claims are compared with supporting evidence uploaded by the user.

**Example:**

- Resume: TCS Internship - 6 months
- Supporting Document: Internship duration - 3 months
- Result: Mismatch

**Another example:**

- Resume: Published Research Paper
- Supporting Document: No supporting evidence uploaded
- Result: Unsupported

When the claim and supporting document are consistent:

- Result: Verified / Match

## Trust Score

The platform calculates a Trust Score based on the consistency of verified claims and supporting evidence.

The score provides a quick overview of the reliability and completeness of the submitted credentials.

The score should be treated as an indicator for further verification, not as absolute proof that a document is genuine.

## Document Categories

CredVerify automatically categorizes uploaded documents into relevant groups such as:

- Resume
- Experience Letter
- Degree / Marksheet
- Certifications
- Government ID
- Other

The system also prevents duplicate supporting documents from being unnecessarily processed.

## Security

- User authentication
- User-specific document ownership
- Private document storage
- Backend-controlled Supabase access
- Ownership validation for document access
- Secure document deletion
- Sensitive server-side credentials are not exposed to the frontend

## Testing

The backend includes automated API and credential verification tests covering:

- Health API
- User APIs
- Document APIs
- Claims APIs
- Credential APIs
- Error handling
- Credential matching
- Multi-document verification
- Document ownership
- Document deletion
- Supabase database integration
- Supabase Storage integration
- Re-analysis workflow

The project has been tested with the complete backend API and credential verification test suite.

## Deployment

**Frontend:**
https://credverify-beta.vercel.app

**Backend:**
https://credverify-87xo.onrender.com

Database and document storage are hosted using Supabase.

## Live Demo

**Live Application:**
https://credverify-beta.vercel.app

## Future Enhancements

- Advanced OCR for scanned documents
- More intelligent AI-based claim extraction
- Institution and certificate verification APIs
- Email verification workflows
- Recruiter-side candidate comparison
- QR-based credential verification
- Blockchain-backed credential verification
- Advanced fraud and anomaly detection
- Improved analytics and verification history

## Disclaimer

CredVerify is designed to identify inconsistencies, unsupported claims and potential credential fraud for further verification.

A verification result or Trust Score does not guarantee that a credential is authentic. Final credential verification should be performed using appropriate official or institutional sources.

## Author

**Yogyansh Singh**

GitHub: https://github.com/yogyansh123/credverify

## License

This project is developed for academic and educational purposes.
