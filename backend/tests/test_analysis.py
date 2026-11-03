import unittest
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db


class AnalysisTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-analysis.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Test Analysis"}})
        cls.db.resume_analyses.delete_many({"target_role": {"$regex": "Software Engineer"}})
        close_db()

    def setUp(self):
        self.user_email = f"student_{self._testMethodName.lower()}@test-analysis.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Analysis Test Student",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # Create a test resume with complete sample data
        resume_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "Test Analysis Resume",
                "target_role": "Full Stack Software Engineer",
                "template": "modern",
            },
        )
        self.resume_id = resume_res.get_json()["data"]["id"]

        # Populate sample content
        sample_content = {
            "personal_info": {
                "full_name": "Samantha Clark",
                "email": "samantha.clark@example.com",
                "phone": "+1 555-0144",
                "city": "Seattle",
                "state": "WA",
                "country": "USA",
                "linkedin_url": "https://linkedin.com/in/samanthaclark",
                "github_url": "https://github.com/samanthaclark",
            },
            "professional_summary": {
                "content": "Computer Science senior with proven experience building full-stack web applications in React and Python. Strong knowledge of RESTful API design and database optimization.",
                "target_role": "Full Stack Software Engineer",
                "experience_level": "Entry Level / Student",
            },
            "education": [
                {
                    "id": "EDU_1",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "institution": "University of Washington",
                    "start_year": "2020",
                    "end_year": "2024",
                    "grade_type": "GPA",
                    "grade": "3.88",
                    "description": "Dean's List 2021-2023",
                }
            ],
            "skills": [
                {
                    "id": "SKILL_1",
                    "category": "Languages",
                    "items": ["Python", "JavaScript", "TypeScript", "SQL"],
                },
                {
                    "id": "SKILL_2",
                    "category": "Frameworks",
                    "items": ["React", "Node.js", "Flask", "Express"],
                },
            ],
            "projects": [
                {
                    "id": "PROJ_1",
                    "name": "Cloud Task Pipeline",
                    "description": "Distributed task queue processing background asynchronous jobs.",
                    "technologies": ["Python", "Redis", "Docker"],
                    "role": "Lead Developer",
                    "start_date": "01/2024",
                    "end_date": "04/2024",
                    "personally_implemented_features": [
                        "Engineered Redis pub/sub queue handling 10,000 requests per minute.",
                        "Containerized backend microservices using Docker for consistent deployments.",
                    ],
                }
            ],
            "work_experience": [
                {
                    "id": "EXP_1",
                    "company_name": "Acme Technologies",
                    "job_title": "Software Engineering Intern",
                    "location": "Seattle, WA",
                    "start_date": "06/2023",
                    "end_date": "09/2023",
                    "responsibilities": [
                        "Collaborated with senior engineers to optimize PostgreSQL queries, improving query latency by 25%.",
                        "Built unit and integration test suites increasing automated coverage to 88%.",
                    ],
                }
            ],
        }

        self.client.put(
            f"/api/resumes/{self.resume_id}",
            headers=self.headers,
            json={"content": sample_content},
        )

    def test_01_trigger_resume_analysis(self):
        res = self.client.post(
            f"/api/analysis/resume/{self.resume_id}",
            headers=self.headers,
            json={"target_role": "Full Stack Software Engineer"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()["data"]

        # Validate core scoring fields
        self.assertIn("overall_score", data)
        self.assertIn("ats_compatibility_score", data)
        self.assertIn("job_readiness_score", data)
        self.assertIn("content_quality_score", data)
        self.assertIn("structure_completeness_score", data)
        self.assertIn("section_scores", data)
        self.assertIn("quality_dimensions", data)
        self.assertIn("strengths", data)
        self.assertIn("weaknesses", data)
        self.assertIn("actionable_recommendations", data)
        self.assertIn("disclaimer", data)

        self.assertGreaterEqual(data["overall_score"], 0)
        self.assertLessEqual(data["overall_score"], 100)
        self.assertGreaterEqual(data["ats_compatibility_score"], 0)
        self.assertLessEqual(data["ats_compatibility_score"], 100)
        self.assertGreaterEqual(data["job_readiness_score"], 0)
        self.assertLessEqual(data["job_readiness_score"], 100)

        # Check radar chart quality dimensions format
        dims = data["quality_dimensions"]
        self.assertGreaterEqual(len(dims), 3)
        for dim in dims:
            self.assertIn("dimension", dim)
            self.assertIn("score", dim)

        # Check disclaimer text is present
        self.assertIn("estimation", data["disclaimer"].lower())

    def test_02_get_latest_and_history(self):
        # 1. Trigger an initial analysis
        res1 = self.client.post(f"/api/analysis/resume/{self.resume_id}", headers=self.headers)
        self.assertEqual(res1.status_code, 201)
        analysis_id = res1.get_json()["data"]["id"]

        # 2. Get specific analysis by ID
        res_get = self.client.get(f"/api/analysis/{analysis_id}", headers=self.headers)
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.get_json()["data"]["id"], analysis_id)

        # 3. Get latest analysis
        res_latest = self.client.get(f"/api/analysis/resume/{self.resume_id}/latest", headers=self.headers)
        self.assertEqual(res_latest.status_code, 200)
        self.assertEqual(res_latest.get_json()["data"]["id"], analysis_id)

        # 4. Get analysis history list
        res_hist = self.client.get(f"/api/analysis/resume/{self.resume_id}/history", headers=self.headers)
        self.assertEqual(res_hist.status_code, 200)
        hist = res_hist.get_json()["data"]
        self.assertGreaterEqual(len(hist), 1)


if __name__ == "__main__":
    unittest.main()

