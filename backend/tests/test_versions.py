import unittest
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db


class VersionsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-versions.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "Version Test"}})
        cls.db.resume_versions.delete_many({})
        close_db()

    def setUp(self):
        self.user_email = f"student_{self._testMethodName.lower()}@test-versions.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "Version Student",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # Create resume
        resume_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "Version Test Resume",
                "target_role": "Software Engineer",
                "template": "modern",
            },
        )
        self.resume_id = resume_res.get_json()["data"]["id"]

    def test_01_create_version_snapshot(self):
        res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "Initial baseline draft"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()["data"]
        self.assertEqual(data["version_number"], 1)
        self.assertEqual(data["change_summary"], "Initial baseline draft")

        # Verify database record
        v_doc = self.db.resume_versions.find_one({"resume_id": self.resume_id})
        self.assertIsNotNone(v_doc)
        self.assertEqual(v_doc["version_number"], 1)

    def test_02_create_multiple_sequential_versions(self):
        # Version 1
        self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v1 initial"},
        )

        # Update resume content
        self.client.put(
            f"/api/resumes/{self.resume_id}",
            headers=self.headers,
            json={
                "target_role": "Backend Specialist",
                "content": {
                    "professional_summary": {
                        "content": "Specialized in Python and distributed systems.",
                        "target_role": "Backend Specialist",
                    }
                },
            },
        )

        # Version 2
        v2_res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v2 Backend specialized"},
        )
        self.assertEqual(v2_res.status_code, 201)
        v2_data = v2_res.get_json()["data"]
        self.assertEqual(v2_data["version_number"], 2)

        # Verify resume current_version updated
        resume = self.db.resumes.find_one({"_id": ObjectId(self.resume_id)})
        self.assertEqual(resume["current_version"], 2)

    def test_03_list_versions(self):
        # Create 2 versions
        self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v1"},
        )
        self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v2"},
        )

        res = self.client.get(f"/api/resumes/{self.resume_id}/versions", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        versions = res.get_json()["data"]
        self.assertEqual(len(versions), 2)
        # Should be descending order (v2 first, then v1)
        self.assertEqual(versions[0]["version_number"], 2)
        self.assertEqual(versions[1]["version_number"], 1)

    def test_04_get_version_by_id(self):
        create_res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v1 details check"},
        )
        v_id = create_res.get_json()["data"]["id"]

        get_res = self.client.get(
            f"/api/resumes/{self.resume_id}/versions/{v_id}",
            headers=self.headers,
        )
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()["data"]["id"], v_id)

    def test_05_restore_version_creates_new_active_version(self):
        # 1. Baseline Version 1
        self.client.put(
            f"/api/resumes/{self.resume_id}",
            headers=self.headers,
            json={
                "content": {
                    "professional_summary": {"content": "Version 1 Summary text"}
                }
            },
        )
        v1_res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "Version 1 baseline"},
        )
        v1_id = v1_res.get_json()["data"]["id"]

        # 2. Modify and save Version 2
        self.client.put(
            f"/api/resumes/{self.resume_id}",
            headers=self.headers,
            json={
                "content": {
                    "professional_summary": {"content": "Version 2 Summary completely modified"}
                }
            },
        )
        self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "Version 2 modifications"},
        )

        # 3. Restore Version 1
        restore_res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions/{v1_id}/restore",
            headers=self.headers,
        )
        self.assertEqual(restore_res.status_code, 200)
        data = restore_res.get_json()["data"]

        # Verify a new version snapshot (Version 3) was created
        restored_snapshot = data["restored_snapshot"]
        self.assertEqual(restored_snapshot["version_number"], 3)
        self.assertIn("Restored from Version 1", restored_snapshot["change_summary"])
        self.assertEqual(
            restored_snapshot["content"]["professional_summary"]["content"],
            "Version 1 Summary text",
        )

        # Verify active resume updated to Version 3
        active_resume = data["active_resume"]
        self.assertEqual(active_resume["current_version"], 3)
        self.assertEqual(
            active_resume["content"]["professional_summary"]["content"],
            "Version 1 Summary text",
        )

        # Verify complete audit trail preserved in database (total 3 versions exist)
        total_versions = self.db.resume_versions.count_documents({"resume_id": self.resume_id})
        self.assertEqual(total_versions, 3)

    def test_06_cross_user_isolation(self):
        v_res = self.client.post(
            f"/api/resumes/{self.resume_id}/versions",
            headers=self.headers,
            json={"change_summary": "v1 isolation"},
        )
        v_id = v_res.get_json()["data"]["id"]

        # Create user 2
        user2_res = self.client.post(
            "/api/auth/register",
            json={
                "email": "user2@test-versions.com",
                "password": "Password123!",
                "full_name": "User Two",
            },
        )
        token2 = user2_res.get_json()["data"]["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 tries to list User 1's versions
        res = self.client.get(f"/api/resumes/{self.resume_id}/versions", headers=headers2)
        self.assertEqual(res.status_code, 404)

        # User 2 tries to restore User 1's version
        res_restore = self.client.post(
            f"/api/resumes/{self.resume_id}/versions/{v_id}/restore",
            headers=headers2,
        )
        self.assertEqual(res_restore.status_code, 404)


if __name__ == "__main__":
    unittest.main()

