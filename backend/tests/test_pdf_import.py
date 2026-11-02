import io
import unittest
import pymupdf
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db
from app.pdf.extraction import PdfExtractor


def create_sample_resume_pdf() -> bytes:
    """Helper to construct a realistic text-based PDF resume in-memory."""
    doc = pymupdf.open()
    page = doc.new_page()

    sample_text = """
Alex Morgan
San Francisco, CA | alex.morgan@example.com | (555) 234-5678
linkedin.com/in/alexmorgan | github.com/alexmorgan

PROFESSIONAL SUMMARY
Motivated Computer Science graduate with hands-on experience in full-stack web applications, Python REST APIs, and modern React interfaces. Seeking an entry-level Software Engineer role.

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science (GPA: 3.85 / 4.0) | Aug 2020 – May 2024
Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Database Management

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, SQL, C++
- Frameworks & Libraries: React, Flask, Node.js, Express, Tailwind
- Databases & Cloud: MongoDB, PostgreSQL, AWS (S3, EC2), Docker
- Developer Tools: Git, GitHub Actions, Linux, Postman

PROJECTS
Career Portal Engine | Python, Flask, React, MongoDB
- Architected a responsive full-stack job application tracking platform with real-time analytics.
- Integrated JWT authentication and role-based access control protecting over 5,000 user records.
- Optimized MongoDB aggregation queries reducing dashboard load time by 38%.

WORK EXPERIENCE
Software Engineering Intern | TechNova Labs, San Francisco, CA
Jun 2023 – Aug 2023
- Developed microservices in Python for asynchronous background email dispatching.
- Implemented comprehensive PyTest suites achieving 94% code coverage across core modules.
"""
    # Insert text into page (starting at margin 50, 50)
    page.insert_text((50, 50), sample_text, fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class PdfImportTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-pdf-import.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Imported"}})
        close_db()

    def setUp(self):
        self.user_email = f"student_{self._testMethodName.lower()}@test-pdf-import.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "PDF Import Student",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_01_extract_text_from_valid_pdf(self):
        pdf_bytes = create_sample_resume_pdf()
        extracted = PdfExtractor.extract_text(pdf_bytes)

        self.assertIn("Alex Morgan", extracted)
        self.assertIn("alex.morgan@example.com", extracted)
        self.assertIn("University of California, Berkeley", extracted)
        self.assertIn("Career Portal Engine", extracted)
        self.assertGreater(len(extracted), 200)

    def test_02_extract_text_invalid_bytes(self):
        with self.assertRaises(ValueError):
            PdfExtractor.extract_text(b"not a valid pdf file content")

    def test_03_extract_text_empty_pdf(self):
        # Empty bytes
        with self.assertRaises(ValueError):
            PdfExtractor.extract_text(b"")

        # PDF page with blank whitespace only
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((50, 50), "   \n\n   ")
        blank_bytes = doc.tobytes()
        doc.close()
        with self.assertRaises(ValueError):
            PdfExtractor.extract_text(blank_bytes)

    def test_04_import_resume_endpoint_live(self):
        pdf_bytes = create_sample_resume_pdf()

        data = {
            "file": (io.BytesIO(pdf_bytes), "alex_morgan_resume.pdf"),
        }

        res = self.client.post(
            "/api/resumes/import",
            headers=self.headers,
            data=data,
            content_type="multipart/form-data",
        )

        self.assertEqual(res.status_code, 201)
        res_json = res.get_json()
        self.assertTrue(res_json["success"])

        resume_data = res_json["data"]
        self.assertIn("id", resume_data)
        self.assertIn("Alex Morgan", resume_data["title"])

        content = resume_data["content"]
        # Check personal info extracted
        self.assertEqual(content["personal_info"]["full_name"], "Alex Morgan")
        self.assertIn("alex.morgan@example.com", content["personal_info"]["email"])

        # Check education extracted
        self.assertGreaterEqual(len(content["education"]), 1)
        self.assertIn("Berkeley", content["education"][0]["institution"])

        # Check skills extracted
        self.assertGreaterEqual(len(content["skills"]), 1)

        # Check database persistence
        db_resume = self.db.resumes.find_one({"_id": ObjectId(resume_data["id"])})
        self.assertIsNotNone(db_resume)
        self.assertEqual(db_resume["content"]["personal_info"]["full_name"], "Alex Morgan")


if __name__ == "__main__":
    unittest.main()
