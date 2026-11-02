import unittest
from app import create_app
from app.database.connection import get_db, close_db


class ProfileTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-profile.com$"}})
        cls.db.student_profiles.delete_many({"personal_info.email": {"$regex": "@test-profile.com$"}})
        close_db()

    def setUp(self):
        # Register a unique user for test
        self.user_email = f"student_{self._testMethodName.lower()}@test-profile.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Profile Test Student",
            },
        )
        self.assertEqual(reg_res.status_code, 201)
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_01_get_profile_unauthorized(self):
        res = self.client.get("/api/profile")
        self.assertEqual(res.status_code, 401)

    def test_02_get_profile_success(self):
        res = self.client.get("/api/profile", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["personal_info"]["email"], self.user_email)
        self.assertEqual(data["data"]["personal_info"]["full_name"], "Profile Test Student")

    def test_03_update_profile_personal_and_education(self):
        update_payload = {
            "personal_info": {
                "full_name": "Profile Test Student Updated",
                "email": self.user_email,
                "phone": "+1-555-0199",
                "city": "Austin",
                "state": "TX",
                "country": "USA",
                "linkedin_url": "https://linkedin.com/in/student",
                "github_url": "https://github.com/student",
                "portfolio_url": "https://student.dev",
                "profile_image": "",
            },
            "education": [
                {
                    "id": "EDU_001",
                    "degree": "B.S.",
                    "field_of_study": "Computer Science",
                    "institution": "University of Texas",
                    "start_year": "2021",
                    "end_year": "2025",
                    "grade_type": "GPA",
                    "grade": "3.85",
                    "description": "Dean's Honor List",
                }
            ],
            "skills": [
                {
                    "id": "SKILL_001",
                    "category": "Frontend Technologies",
                    "items": ["React", "JavaScript", "HTML", "CSS"],
                }
            ],
            "projects": [
                {
                    "id": "PROJ_001",
                    "name": "E-Commerce App",
                    "description": "Full stack store with cart and checkout",
                    "technologies": ["React", "Node.js", "MongoDB"],
                    "role": "Frontend Lead",
                    "start_date": "01/2024",
                    "end_date": "05/2024",
                    "github_url": "https://github.com/student/ecommerce",
                    "live_url": "https://ecommerce.student.dev",
                    "key_contributions": ["Implemented responsive shopping cart"],
                    "personally_implemented_features": ["State management with Context API"],
                }
            ],
            "work_experience": [
                {
                    "id": "EXP_001",
                    "company_name": "Tech Corp",
                    "job_title": "Software Intern",
                    "employment_type": "Internship",
                    "location": "Austin, TX",
                    "start_date": "06/2024",
                    "end_date": "08/2024",
                    "is_current": False,
                    "responsibilities": ["Developed REST APIs"],
                    "achievements": ["Reduced latency by 15%"],
                    "technologies": ["Python", "Flask"],
                }
            ],
        }

        res = self.client.put("/api/profile", headers=self.headers, json=update_payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        profile = data["data"]
        self.assertEqual(profile["personal_info"]["city"], "Austin")
        self.assertEqual(profile["personal_info"]["phone"], "+1-555-0199")
        self.assertEqual(len(profile["education"]), 1)
        self.assertEqual(profile["education"][0]["institution"], "University of Texas")
        self.assertEqual(len(profile["skills"]), 1)
        self.assertEqual(profile["skills"][0]["items"], ["React", "JavaScript", "HTML", "CSS"])
        self.assertEqual(len(profile["projects"]), 1)
        self.assertEqual(profile["projects"][0]["name"], "E-Commerce App")
        self.assertEqual(len(profile["work_experience"]), 1)

    def test_04_user_isolation(self):
        # Create second user
        other_email = f"other_{self._testMethodName.lower()}@test-profile.com"
        reg2 = self.client.post(
            "/api/auth/register",
            json={
                "email": other_email,
                "password": "Password123!",
                "full_name": "Other Student",
            },
        )
        token2 = reg2.get_json()["data"]["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 1 updates city
        self.client.put(
            "/api/profile",
            headers=self.headers,
            json={"personal_info": {"city": "Austin", "full_name": "Student 1", "email": self.user_email}},
        )

        # User 2 gets profile
        res2 = self.client.get("/api/profile", headers=headers2)
        profile2 = res2.get_json()["data"]
        self.assertEqual(profile2["personal_info"]["email"], other_email)
        self.assertNotEqual(profile2["personal_info"]["city"], "Austin")


if __name__ == "__main__":
    unittest.main()

