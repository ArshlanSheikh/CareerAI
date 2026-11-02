# CareerAI – Stage 1: AI-Powered Resume Builder

CareerAI is an AI-powered resume builder designed for college students, freshers, internship seekers, and job applicants. It provides a structured, end-to-end resume creation and management workspace with multi-template rendering, PDF import via PyMuPDF, AI content refinement via the official Google Gemini SDK, version control snapshots with instant rollback, and selectable-text PDF generation using Playwright.

---

## Architecture & Technology Stack

### Frontend
- **Framework**: React.js 18 + Vite
- **Styling**: Pure CSS Modules (`*.module.css`) & Global Design Tokens (Zero Tailwind)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **HTTP Client**: Axios with automated JWT interceptors and token refresh rotation

### Backend
- **Framework**: Python 3.13 + Flask (Modular Application Factory Architecture)
- **Database**: MongoDB 8.0 with PyMongo (No SQLAlchemy / No Relational ORM)
- **Authentication**: Flask-JWT-Extended (Short-lived Access Tokens + Long-lived Refresh Tokens)
- **Validation**: Pydantic v2 schemas for all inputs, outputs, and database models
- **AI Integration**: Official Google Gemini Python SDK (`google-genai`) with JSON mode and fallback cascade
- **PDF Extraction**: PyMuPDF (`pymupdf`) text and layout extraction
- **PDF Generation**: Playwright headless browser automation (producing true selectable text)

---

## Stage 1 Features

1. **Student Authentication & Session Management**:
   - Registration, login, logout, password hashing (`scrypt`), token refresh rotation, and protected routes.
   - Strict user isolation across profiles, resumes, AI suggestions, and version snapshots.

2. **Reusable Student Profile**:
   - Master profile storing personal contact information, education, dynamic categorized technical skills, projects, and work experience.
   - Decoupled from resumes: resumes import a copy snapshot rather than hard-linking.

3. **Resume Creation & Dashboard**:
   - **Option A (Create from Scratch)**: Enter title, target role, select starting template, with optional 1-click import from profile.
   - **Option B (Import Existing PDF)**: Upload PDF resume, extract text via PyMuPDF, structure with Gemini AI into the standardized resume schema.
   - Actions: Edit, Preview, Duplicate (`(Copy)`), Rename, Delete (with cascading cleanup), Download PDF, Version History.

4. **Resume Editor Workspace**:
   - 3-panel layout:
     - **Left Panel**: Section navigation, completion indicators, show/hide eye toggles, and up/down reordering.
     - **Center Panel**: Multi-record forms for all 8 standardized sections.
     - **Right Panel**: Real-time synchronized paper preview reflecting template and content edits instantly.
   - State management with dirty-tracking, manual save, and 3-second auto-save debounce.

5. **Professional Templates & Live Preview**:
   - **Modern Professional**: Indigo accents (`#4f46e5`), structured hierarchy, pill tags.
   - **Minimal ATS-Friendly**: High contrast, standard sans-serif (`Arial`), solid divider rules, 100% scanner readable.
   - **Traditional Professional**: Classic serif typography (`Georgia`), small-caps styling, formal headers.
   - Live paper simulation with standard 11-inch page-break guide, 70%–130% zoom controls, and `@media print` styles.

6. **Google Gemini AI Assistant (Human-in-the-Loop)**:
   - Assistance for Summary, Projects, Experience, Internships, and Technical Skills.
   - Multi-model fallback cascade (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-3.5-flash`).
   - Anti-hallucination prompt design: AI suggestions are never auto-applied.
   - Comparison modal: Original vs. Suggested diff, factual verification warnings, change explanation, manual edit before accept, and custom revision prompt.

7. **PDF Generation & Export**:
   - Headless browser rendering using Playwright.
   - Outputs 100% selectable-text PDFs with consistent typography, custom section ordering, and metadata injection.

8. **Resume Version History & Rollback**:
   - Sequential version snapshot creation (`v1`, `v2`, `v3`...) with custom notes.
   - Full content preview for historical versions without overwriting the active resume.
   - Restoring a previous version creates a **new active version** (preserving complete revision history and audit trail).

---

## Directory Structure

```
CareerAI/
├── backend/
│   ├── app/
│   │   ├── ai/                      # Gemini integration & prompt builder
│   │   ├── common/                  # Validators, response helpers, decorators
│   │   ├── config/                  # Settings and environment configs
│   │   ├── database/                # PyMongo connection & index management
│   │   ├── modules/
│   │   │   ├── auth/                # Auth routes, controller, service, schemas
│   │   │   ├── profile/             # Profile routes, controller, service, schemas
│   │   │   ├── resume/              # Resume routes, controller, service, schemas
│   │   │   ├── ai/                  # AI suggestion routes, controller, schemas
│   │   │   └── versions/            # Version history routes, controller, service
│   │   └── pdf/                     # PyMuPDF extraction & Playwright generation
│   ├── tests/                       # 45 automated unit and E2E integration tests
│   ├── requirements.txt
│   ├── run.py
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # App router and bootstrap
│   │   ├── components/common/       # Button, Input, Card, Modal, Loader, ProtectedRoute
│   │   ├── context/                 # AuthContext, NotificationContext
│   │   ├── layouts/                 # AppLayout, AuthLayout, Navbar
│   │   ├── modules/
│   │   │   ├── auth/                # LoginPage, RegisterPage
│   │   │   ├── dashboard/           # DashboardPage, ResumeCard
│   │   │   ├── profile/             # ProfilePage
│   │   │   ├── resume/              # ResumeEditorPage, ResumePreviewPage, ResumeImportPage, VersionHistoryDrawer
│   │   │   ├── templates/           # ModernTemplate, AtsTemplate, TraditionalTemplate, TemplateRenderer
│   │   │   └── ai/                  # AiSuggestionModal, aiService
│   │   ├── services/                # Axios instance (api.js) with JWT interceptors
│   │   └── styles/                  # variables.css, global.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- MongoDB (v7.0+) running locally on `mongodb://localhost:27017`
- Google Gemini API Key

### Backend Setup
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Activate virtual environment:
   ```bash
   # Windows
   .\venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify `.env` configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/careerai
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
5. Run the server:
   ```bash
   python run.py
   ```
   The API will be available at `http://localhost:5000`.

### Frontend Setup
1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## Running Automated Tests

Run the complete backend test suite (45 tests across foundation, authentication, profile, resume, AI, PDF import, PDF export, versions, and full-journey E2E):

```bash
cd backend
python -m unittest discover tests
```

Build the frontend production bundle:

```bash
cd frontend
npm run build
```

---

## Stage 1 Verification Checklist (Section 24)

- [x] Student registration, login, token refresh, and logout.
- [x] Reusable profile creation and updates.
- [x] Manual resume creation from scratch + profile snapshot import.
- [x] PDF resume upload, PyMuPDF extraction, and Gemini AI structuring.
- [x] Standardized resume content model across all features.
- [x] 3-panel resume editor (nav/ordering/visibility, section forms, live paper preview).
- [x] Gemini AI content enhancement with factual confirmation review workflow.
- [x] 3 decoupled templates: Modern Professional, Minimal ATS-Friendly, Traditional Professional.
- [x] Live resume preview with zoom controls and 11-inch page-break guide.
- [x] High-fidelity selectable-text PDF export using Playwright with metadata injection.
- [x] Resume version history snapshots, preview, and audit-trail rollback.
- [x] Complete test suite passing (45/45 tests green).
