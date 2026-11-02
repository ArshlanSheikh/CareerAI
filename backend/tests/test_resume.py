import unittest
from app import create_app
from app.database.connection import get_db, close_db


class ResumeTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-resume.com$"}})
        cls.db.student_profiles.delete_many({"personal_info.email": {"$regex": "@test-resume.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Test Resume"}})
        close_db()

    def setUp(self):
        # Register main user
        self.user_email = f"student_{self._testMethodName.lower()}@test-resume.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Resume Test Student",
            },
        )
        self.assertEqual(reg_res.status_code, 201)
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_01_create_resume_from_scratch(self):
        res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "Test Resume - Full Stack",
                "target_role": "Full Stack Developer",
                "template": "modern",
                "import_from_profile": False,
            },
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        resume = data["data"]
        self.assertEqual(resume["title"], "Test Resume - Full Stack")
        self.assertEqual(resume["target_role"], "Full Stack Developer")
        self.assertEqual(resume["template"], "modern")
        self.assertEqual(resume["current_version"], 1)
        self.assertEqual(resume["status"], "draft")
        self.assertIn("content", resume)
        self.assertIn("section_order", resume["content"])

    def test_02_create_resume_with_profile_import(self):
        # First update user profile with education and skills
        self.client.put(
            "/api/profile",
            headers=self.headers,
            json={
                "personal_info": {
                    "full_name": "Resume Test Student",
                    "email": self.user_email,
                    "phone": "+1-555-4321",
                },
                "education": [
                    {
                        "id": "EDU_1",
                        "degree": "B.Tech",
                        "field_of_study": "Information Technology",
                        "institution": "MIT",
                        "start_year": "2020",
                        "end_year": "2024",
                    }
                ],
                "skills": [
                    {
                        "id": "SKILL_1",
                        "category": "Languages",
                        "items": ["Python", "JavaScript"],
                    }
                ],
            },
        )

        # Create resume with import_from_profile = True
        res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "Test Resume - Imported Profile",
                "target_role": "Software Engineer",
                "template": "ats",
                "import_from_profile": True,
            },
        )
        self.assertEqual(res.status_code, 201)
        resume = res.get_json()["data"]
        self.assertEqual(len(resume["content"]["education"]), 1)
        self.assertEqual(resume["content"]["education"][0]["institution"], "MIT")
        self.assertEqual(resume["content"]["personal_info"]["phone"], "+1-555-4321")
        self.assertEqual(len(resume["content"]["skills"]), 1)
        self.assertEqual(resume["content"]["skills"][0]["items"], ["Python", "JavaScript"])

    def test_03_list_resumes(self):
        # Create 2 resumes
        self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume 1", "target_role": "Frontend"},
        )
        self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume 2", "target_role": "Backend"},
        )

        res = self.client.get("/api/resumes", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["data"]), 2)

    def test_04_get_and_update_resume(self):
        create_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume Original", "target_role": "DevOps"},
        )
        resume_id = create_res.get_json()["data"]["id"]

        # Get resume
        get_res = self.client.get(f"/api/resumes/{resume_id}", headers=self.headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()["data"]["title"], "Test Resume Original")

        # Update resume
        put_res = self.client.put(
            f"/api/resumes/{resume_id}",
            headers=self.headers,
            json={
                "title": "Test Resume Updated Title",
                "template": "traditional",
                "status": "completed",
            },
        )
        self.assertEqual(put_res.status_code, 200)
        updated = put_res.get_json()["data"]
        self.assertEqual(updated["title"], "Test Resume Updated Title")
        self.assertEqual(updated["template"], "traditional")
        self.assertEqual(updated["status"], "completed")

    def test_05_duplicate_resume(self):
        create_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume To Duplicate", "target_role": "Architect"},
        )
        resume_id = create_res.get_json()["data"]["id"]

        dup_res = self.client.post(f"/api/resumes/{resume_id}/duplicate", headers=self.headers)
        self.assertEqual(dup_res.status_code, 201)
        duplicated = dup_res.get_json()["data"]
        self.assertNotEqual(duplicated["id"], resume_id)
        self.assertEqual(duplicated["title"], "Test Resume To Duplicate (Copy)")
        self.assertEqual(duplicated["target_role"], "Architect")

    def test_06_delete_resume(self):
        create_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume To Delete"},
        )
        resume_id = create_res.get_json()["data"]["id"]

        del_res = self.client.delete(f"/api/resumes/{resume_id}", headers=self.headers)
        self.assertEqual(del_res.status_code, 200)

        # Confirm 404 after deletion
        get_res = self.client.get(f"/api/resumes/{resume_id}", headers=self.headers)
        self.assertEqual(get_res.status_code, 404)

    def test_07_cross_user_isolation(self):
        # Create resume under User 1
        create_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={"title": "Test Resume User 1 Secret"},
        )
        resume_id = create_res.get_json()["data"]["id"]

        # Register User 2
        user2_email = f"user2_{self._testMethodName.lower()}@test-resume.com"
        reg2 = self.client.post(
            "/api/auth/register",
            json={
                "email": user2_email,
                "password": "Password123!",
                "full_name": "User Two",
            },
        )
        token2 = reg2.get_json()["data"]["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 tries to GET User 1's resume
        res_get = self.client.get(f"/api/resumes/{resume_id}", headers=headers2)
        self.assertEqual(res_get.status_code, 404)

        # User 2 tries to PUT User 1's resume
        res_put = self.client.put(
            f"/api/resumes/{resume_id}",
            headers=headers2,
            json={"title": "Hacked Title"},
        )
        self.assertEqual(res_put.status_code, 404)

        # User 2 tries to DELETE User 1's resume
        res_del = self.client.delete(f"/api/resumes/{resume_id}", headers=headers2)
        self.assertEqual(res_del.status_code, 404)


if __name__ == "__main__":
    unittest.main()

