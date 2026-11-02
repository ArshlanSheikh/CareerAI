import unittest
import pymupdf
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db
from app.pdf.generation import PdfGenerator


class PdfExportTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-pdf-export.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Export Test"}})
        close_db()

    def setUp(self):
        self.user_email = f"student_{self._testMethodName.lower()}@test-pdf-export.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Sarah Connor",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # Create resume
        resume_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "Export Test Resume",
                "target_role": "Full Stack Engineer",
                "template": "modern",
            },
        )
        self.resume_id = resume_res.get_json()["data"]["id"]

        # Populate with rich content
        self.client.put(
            f"/api/resumes/{self.resume_id}",
            headers=self.headers,
            json={
                "content": {
                    "personal_info": {
                        "full_name": "Sarah Connor",
                        "email": "sarah.connor@example.com",
                        "phone": "555-0199",
                        "city": "Los Angeles",
                        "state": "CA",
                        "country": "USA",
                        "linkedin_url": "https://linkedin.com/in/sarahconnor",
                        "github_url": "https://github.com/sarahconnor",
                    },
                    "professional_summary": {
                        "content": "Experienced engineer with specialization in Python REST microservices and React.",
                        "target_role": "Full Stack Engineer",
                        "experience_level": "Entry Level",
                    },
                    "education": [
                        {
                            "id": "EDU_1",
                            "degree": "B.S. in Computer Science",
                            "field_of_study": "Computer Science",
                            "institution": "UCLA",
                            "start_year": "2020",
                            "end_year": "2024",
                            "grade_type": "GPA",
                            "grade": "3.9",
                            "description": "Dean's Honor List",
                        }
                    ],
                    "skills": [
                        {
                            "id": "SKILL_1",
                            "category": "Languages",
                            "items": ["Python", "JavaScript", "TypeScript"],
                        }
                    ],
                    "projects": [
                        {
                            "id": "PROJ_1",
                            "name": "Cloud Pipeline Monitor",
                            "role": "Lead Architect",
                            "technologies": ["Python", "Docker", "AWS"],
                            "start_date": "01/2024",
                            "end_date": "05/2024",
                            "description": "Distributed monitoring engine.",
                            "personally_implemented_features": [
                                "Engineered asynchronous event stream ingestion",
                                "Reduced memory footprint by 40% with batch buffering",
                            ],
                        }
                    ],
                    "work_experience": [],
                    "internships": [],
                    "certifications": [],
                    "additional_info": {
                        "awards": ["1st Place Hackathon 2024"],
                        "hackathons": [],
                        "publications": [],
                        "volunteer_experience": [],
                        "languages": ["English", "Spanish"],
                    },
                    "section_order": ["summary", "education", "skills", "projects", "additional"],
                    "hidden_sections": [],
                }
            },
        )

    def test_01_render_html_templates(self):
        resume = self.db.resumes.find_one({"_id": ObjectId(self.resume_id)})

        # Modern template
        resume["template"] = "modern"
        html_modern = PdfGenerator.render_html(resume)
        self.assertIn("Sarah Connor", html_modern)
        self.assertIn("template-modern", html_modern)
        self.assertIn("Professional Summary", html_modern)
        self.assertIn("Cloud Pipeline Monitor", html_modern)

        # ATS template
        resume["template"] = "ats"
        html_ats = PdfGenerator.render_html(resume)
        self.assertIn("template-ats", html_ats)
        self.assertIn("Arial, Helvetica, sans-serif", html_ats)

        # Traditional template
        resume["template"] = "traditional"
        html_trad = PdfGenerator.render_html(resume)
        self.assertIn("template-traditional", html_trad)
        self.assertIn("Georgia", html_trad)

    def test_02_generate_pdf_and_verify_selectable_text(self):
        resume = self.db.resumes.find_one({"_id": ObjectId(self.resume_id)})
        pdf_bytes = PdfGenerator.generate_pdf(resume)

        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 5000)

        # Verify selectable text using PyMuPDF
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        self.assertGreaterEqual(doc.page_count, 1)

        extracted_text = doc[0].get_text()
        self.assertIn("Sarah Connor", extracted_text)
        self.assertIn("UCLA", extracted_text)
        self.assertIn("Cloud Pipeline Monitor", extracted_text)

        # Verify metadata
        meta = doc.metadata
        self.assertEqual(meta["creator"], "CareerAI Resume Builder")
        self.assertEqual(meta["author"], "Sarah Connor")
        doc.close()

    def test_03_download_pdf_endpoint(self):
        res = self.client.get(f"/api/resumes/{self.resume_id}/pdf", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, "application/pdf")
        self.assertIn("Sarah_Connor_Resume.pdf", res.headers.get("Content-Disposition", ""))

        # Check PDF bytes validity
        pdf_data = res.data
        self.assertTrue(pdf_data.startswith(b"%PDF-"))

    def test_04_download_pdf_unauthorized_isolation(self):
        # Register second user
        user2_res = self.client.post(
            "/api/auth/register",
            json={
                "email": "intruder@test-pdf-export.com",
                "password": "Password123!",
                "full_name": "Intruder User",
            },
        )
        token2 = user2_res.get_json()["data"]["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 attempts to download User 1's PDF
        res = self.client.get(f"/api/resumes/{self.resume_id}/pdf", headers=headers2)
        self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()

