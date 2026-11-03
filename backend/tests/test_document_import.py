import io
import unittest
import docx
import pymupdf
from app import create_app
from app.database.connection import get_db, close_db
from app.pdf.document_extractor import DocumentExtractor


def create_sample_docx() -> bytes:
    """Helper to construct a realistic text-based DOCX resume in-memory."""
    doc = docx.Document()
    doc.add_heading("Taylor Reed", level=1)
    doc.add_paragraph("New York, NY | taylor.reed@example.com | (555) 987-6543")
    doc.add_paragraph("linkedin.com/in/taylorreed | github.com/taylorreed")

    doc.add_heading("PROFESSIONAL SUMMARY", level=2)
    doc.add_paragraph(
        "Software Engineer with 2+ years of experience building Python and React applications. "
        "Passionate about distributed backend architecture, cloud services, and scalable web apps."
    )

    doc.add_heading("EDUCATION", level=2)
    doc.add_paragraph("Columbia University | B.S. in Computer Engineering, GPA: 3.9 | 2019 - 2023")

    doc.add_heading("TECHNICAL SKILLS", level=2)
    doc.add_paragraph("Languages: Python, Go, TypeScript, SQL")
    doc.add_paragraph("Frameworks: FastAPI, Django, React, Node.js")
    doc.add_paragraph("Cloud & Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis")

    doc.add_heading("PROJECTS", level=2)
    doc.add_paragraph("Distributed Cache Manager | Go, Redis, Docker")
    doc.add_paragraph("• Architected a high-throughput in-memory caching cluster handling 20,000 req/sec.")
    doc.add_paragraph("• Implemented raft consensus algorithm for fault-tolerant leader election.")

    file_stream = io.BytesIO()
    doc.save(file_stream)
    return file_stream.getvalue()


class DocumentImportTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()
        cls.db.users.delete_many({"email": {"$regex": "@test-doc-import.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Imported"}})

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-doc-import.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Imported"}})
        close_db()

    def setUp(self):
        self.user_email = f"student_{self._testMethodName.lower()}@test-doc-import.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Multi-Format Student",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_01_extract_docx_document(self):
        docx_bytes = create_sample_docx()
        extracted = DocumentExtractor.extract_text(docx_bytes, "resume.docx")

        self.assertIn("Taylor Reed", extracted)
        self.assertIn("taylor.reed@example.com", extracted)
        self.assertIn("Columbia University", extracted)
        self.assertIn("Distributed Cache Manager", extracted)
        self.assertGreater(len(extracted), 200)

    def test_02_extract_unsupported_format(self):
        with self.assertRaises(ValueError) as ctx:
            DocumentExtractor.extract_text(b"some content", "resume.exe")
        self.assertIn("Unsupported file format", str(ctx.exception))

    def test_03_extract_preview_api_endpoint(self):
        docx_bytes = create_sample_docx()
        res = self.client.post(
            "/api/resumes/extract-preview",
            headers=self.headers,
            data={"file": (io.BytesIO(docx_bytes), "Taylor_Reed_Resume.docx")},
            content_type="multipart/form-data",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertEqual(data["filename"], "Taylor_Reed_Resume.docx")
        self.assertIn("parsed_content", data)
        parsed = data["parsed_content"]
        self.assertIn("personal_info", parsed)
        self.assertIn("education", parsed)
        self.assertIn("skills", parsed)

    def test_04_import_from_confirmed_json(self):
        confirmed_content = {
            "personal_info": {
                "full_name": "Jordan Smith",
                "email": "jordan@example.com",
                "phone": "+1 555-0199",
                "city": "Austin",
                "state": "TX",
                "country": "USA",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "profile_image": "",
            },
            "professional_summary": {
                "content": "Full stack engineer experienced in React and Python.",
                "target_role": "Software Engineer",
                "experience_level": "Entry Level",
            },
            "education": [],
            "skills": [{"id": "SKILL_1", "category": "Languages", "items": ["Python", "JavaScript"]}],
            "projects": [],
            "work_experience": [],
            "internships": [],
            "certifications": [],
            "additional_info": {},
        }

        res = self.client.post(
            "/api/resumes/import",
            headers=self.headers,
            json={
                "title": "Jordan's Custom Resume",
                "confirmed_content": confirmed_content,
            },
        )
        self.assertEqual(res.status_code, 201)
        created = res.get_json()["data"]
        self.assertEqual(created["title"], "Jordan's Custom Resume")
        self.assertEqual(created["content"]["personal_info"]["full_name"], "Jordan Smith")


if __name__ == "__main__":
    unittest.main()

