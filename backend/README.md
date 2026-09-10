# CredVerify Backend

Python **FastAPI** backend providing the REST API foundation for the CredVerify credential verification platform.

> **Status – Foundation layer only.** Real OCR, AI analysis, and authentication are not yet implemented. This layer handles user profiles, document metadata, claims, and credentials with a local SQLite database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.103 |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (local) → swap URL for PostgreSQL in production |
| Validation | Pydantic 1.10 |
| Server | Uvicorn 0.23 |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py            ← FastAPI app, CORS, startup, router registration
│   ├── config.py          ← Environment settings (pydantic BaseSettings)
│   ├── database.py        ← SQLAlchemy engine, session factory, Base
│   ├── models/
│   │   ├── user.py        ← User ORM model
│   │   ├── document.py    ← Document ORM model
│   │   ├── claim.py       ← Resume Claim ORM model
│   │   └── credential.py  ← Credential Record ORM model
│   ├── schemas/
│   │   ├── user.py        ← UserCreate / UserResponse
│   │   ├── document.py    ← DocumentCreate / DocumentResponse
│   │   ├── claim.py       ← ClaimCreate / ClaimResponse
│   │   └── credential.py  ← CredentialCreate / CredentialResponse
│   ├── services/
│   │   ├── user_service.py
│   │   ├── document_service.py
│   │   ├── claim_service.py
│   │   └── credential_service.py
│   └── routes/
│       ├── health.py
│       ├── users.py
│       ├── documents.py
│       ├── claims.py
│       └── credentials.py
├── .env.example           ← Environment variable template
├── requirements.txt
└── README.md
```

---

## Setup & Running

### 1. Prerequisites
- Python 3.10+ (tested on 3.14)
- pip

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment (optional for local SQLite)
```bash
# Copy the template – defaults work out of the box for local dev
cp .env.example .env
```

### 4. Start the server
```bash
# Development mode (auto-reload on file changes)
uvicorn app.main:app --reload --port 8000
```

The server will:
- Start at **http://127.0.0.1:8000**
- Auto-create the SQLite database at `backend/credverify.db`
- Auto-create the `uploads/` directory

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/users` | Create a new user profile |
| `GET` | `/api/users/{user_id}` | Get a user profile by ID |
| `POST` | `/api/documents` | Register document upload metadata |
| `GET` | `/api/users/{user_id}/documents` | List all documents for a user |
| `POST` | `/api/claims` | Add a resume claim for a user |
| `GET` | `/api/users/{user_id}/claims` | List all claims for a user |
| `POST` | `/api/credentials` | Add a credential record for a user |
| `GET` | `/api/users/{user_id}/credentials` | List all credentials for a user |

### Interactive API Docs
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## Example – Quick test with curl

```bash
# 1. Health check
curl http://127.0.0.1:8000/api/health

# 2. Create a user
curl -X POST http://127.0.0.1:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Priyan Sharma","email":"priyan@example.com","role":"individual"}'

# 3. Register a document (use the user_id from step 2)
curl -X POST http://127.0.0.1:8000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<user_id>","original_name":"Resume.pdf","category":"Resume","file_size_bytes":1400000}'
```

---

## CORS

The API is pre-configured to allow requests from the React frontend origins:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

To add more origins, update `ALLOWED_ORIGINS` in your `.env` file (comma-separated).

---

## What's NOT implemented yet
- Real file binary storage (only metadata is stored)
- OCR / document text extraction
- AI claim-matching analysis
- JWT authentication
- Verification job queue
- Public profile lookup endpoint (planned next)
