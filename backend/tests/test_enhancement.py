import unittest
import json
from bson import ObjectId
from app import create_app
from app.database.connection import get_db


class TestEnhancementModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("testing")
        cls.client = cls.app.test_client()
        cls.db = get_db()
        # Clean up any test users
        cls.db.users.delete_many({"email": {"$regex": "@test-enhancement.com$"}})

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-enhancement.com$"}})

    def setUp(self):
        # Register and login test user
        self.email = f"user_{ObjectId()}@test-enhancement.com"
        self.password = "SecurePassword123!"
        reg_res = self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "full_name": "Test Candidate"
        })
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # Create a sample resume
        sample_resume_payload = {
            "title": "Software Engineer Resume",
            "target_role": "Full Stack Engineer",
            "template": "modern",
            "content": {
                "personal_info": {
                    "full_name": "Test Candidate",
                    "email": self.email,
                    "phone": "+1 555 123 4567",
                    "city": "San Francisco",
                    "state": "CA",
                    "country": "USA",
                    "linkedin_url": "",
                    "github_url": "",
                    "portfolio_url": "",
                    "profile_image": ""
                },
                "professional_summary": {
                    "content": "CS student who built web apps with React and Python.",
                    "target_role": "Full Stack Engineer",
                    "experience_level": "Entry Level"
                },
                "education": [
                    {
                        "id": "edu-1",
                        "degree": "B.S. in Computer Science",
                        "field_of_study": "Computer Science",
                        "institution": "University of Tech",
                        "start_year": "2020",
                        "end_year": "2024",
                        "grade_type": "GPA",
                        "grade": "3.8",
                        "description": "Dean's list"
                    }
                ],
                "skills": [
                    {
                        "id": "sk-1",
                        "category": "Languages",
                        "items": ["Python", "JavaScript", "SQL"]
                    }
                ],
                "projects": [
                    {
                        "id": "proj-1",
                        "name": "E-Commerce Microservices",
                        "description": "Built an online store with product catalog.",
                        "technologies": ["Python", "Flask", "React", "MongoDB"],
                        "role": "Lead Developer",
                        "start_date": "Jan 2023",
                        "end_date": "May 2023",
                        "github_url": "https://github.com/example/ecommerce",
                        "live_url": "",
                        "key_contributions": [
                            "Built cart service",
                            "Wrote database schemas",
                            "Created responsive UI"
                        ],
                        "personally_implemented_features": []
                    }
                ],
                "work_experience": [
                    {
                        "id": "exp-1",
                        "company_name": "CloudTech Labs",
                        "job_title": "Software Engineering Intern",
                        "employment_type": "Internship",
                        "location": "Remote",
                        "start_date": "Jun 2023",
                        "end_date": "Aug 2023",
                        "is_current": False,
                        "responsibilities": [
                            "Worked on bug fixes in frontend",
                            "Helped migrate SQL queries"
                        ],
                        "achievements": [],
                        "technologies": ["React", "PostgreSQL"]
                    }
                ],
                "internships": [],
                "certifications": [],
                "additional_info": {
                    "awards": [],
                    "hackathons": [],
                    "publications": [],
                    "volunteer_experience": [],
                    "languages": ["English"]
                }
            }
        }

        create_res = self.client.post("/api/resumes", json=sample_resume_payload, headers=self.headers)
        self.resume_id = create_res.get_json()["data"]["id"]

    def test_full_enhancement_and_apply_flow(self):
        # 1. Generate Enhancement
        gen_res = self.client.post(
            f"/api/enhancement/resume/{self.resume_id}/generate",
            json={
                "target_role": "Full Stack Engineer",
                "custom_instructions": "Focus on high impact action verbs and clean technical metrics"
            },
            headers=self.headers
        )
        self.assertEqual(gen_res.status_code, 201)
        data = gen_res.get_json()["data"]
        self.assertIn("improved_content", data)
        self.assertIn("section_diffs", data)
        self.assertIn("enhancement_summary", data)
        enhancement_id = data["id"]

        # Check section diffs
        diffs = data["section_diffs"]
        self.assertTrue(len(diffs) > 0)
        summary_diff = next((d for d in diffs if d["section"] == "professional_summary"), None)
        self.assertIsNotNone(summary_diff)

        # 2. Get Latest Enhancement
        latest_res = self.client.get(
            f"/api/enhancement/resume/{self.resume_id}/latest",
            headers=self.headers
        )
        self.assertEqual(latest_res.status_code, 200)
        self.assertEqual(latest_res.get_json()["data"]["id"], enhancement_id)

        # 3. Apply Enhancement with mode 'new_version'
        apply_res = self.client.post(
            f"/api/enhancement/resume/{self.resume_id}/apply",
            json={
                "mode": "new_version",
                "accepted_sections": {
                    "professional_summary": True,
                    "projects": True,
                    "skills": True
                }
            },
            headers=self.headers
        )
        self.assertEqual(apply_res.status_code, 200)
        apply_data = apply_res.get_json()["data"]
        self.assertEqual(apply_data["mode"], "new_version")

        # Verify the resume was updated and version incremented
        resume_res = self.client.get(f"/api/resumes/{self.resume_id}", headers=self.headers)
        updated_resume = resume_res.get_json()["data"]
        self.assertTrue(updated_resume["current_version"] >= 2)

        # 4. Apply Enhancement with mode 'new_resume'
        new_resume_res = self.client.post(
            f"/api/enhancement/resume/{self.resume_id}/apply",
            json={
                "mode": "new_resume",
                "title_for_new_resume": "AI Polished Senior Resume"
            },
            headers=self.headers
        )
        self.assertEqual(new_resume_res.status_code, 200)
        new_data = new_resume_res.get_json()["data"]
        self.assertEqual(new_data["mode"], "new_resume")
        new_id = new_data["resume_id"]
        self.assertNotEqual(new_id, self.resume_id)

        # Verify separate resume exists
        separate_res = self.client.get(f"/api/resumes/{new_id}", headers=self.headers)
        self.assertEqual(separate_res.status_code, 200)
        self.assertEqual(separate_res.get_json()["data"]["title"], "AI Polished Senior Resume")


if __name__ == "__main__":
    unittest.main()
