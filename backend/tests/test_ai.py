import unittest
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db
from app.ai.prompt_builder import PromptBuilder
from app.ai.response_parser import (
    SummaryAiResponse,
    ProjectAiResponse,
    parse_and_validate,
)


class AiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@test-ai.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "AI Test Resume"}})
        cls.db.ai_suggestions.delete_many({})
        close_db()

    def setUp(self):
        # Create user & resume
        self.user_email = f"student_{self._testMethodName.lower()}@test-ai.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.user_email,
                "password": "Password123!",
                "full_name": "AI Test Student",
            },
        )
        self.token = reg_res.get_json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # Create resume
        resume_res = self.client.post(
            "/api/resumes",
            headers=self.headers,
            json={
                "title": "AI Test Resume",
                "target_role": "Backend Engineer",
                "template": "modern",
            },
        )
        self.resume_id = resume_res.get_json()["data"]["id"]

    def test_01_prompt_builder_rules(self):
        prompt = PromptBuilder.build_summary_prompt(
            original_summary="CS student looking for job",
            target_role="Backend Engineer",
            skills_context=[{"category": "Backend", "items": ["Python", "Flask", "MongoDB"]}],
        )
        self.assertIn("Backend Engineer", prompt)
        self.assertIn("Python, Flask, MongoDB", prompt)
        self.assertIn("JSON RESPONSE SCHEMA", prompt)

    def test_02_response_parser_validation(self):
        raw = {
            "suggested_content": "Passionate backend engineer with expertise in Python.",
            "changes_summary": "Strengthened action verbs",
            "factual_warnings": [],
        }
        validated = parse_and_validate(raw, SummaryAiResponse)
        self.assertEqual(validated.suggested_content, raw["suggested_content"])

    def test_03_generate_summary_live_api(self):
        # Calls the actual Gemini API
        res = self.client.post(
            "/api/ai/generate-summary",
            headers=self.headers,
            json={
                "resume_id": self.resume_id,
                "original_content": "Final year student seeking backend role. Built Python REST APIs.",
                "target_role": "Backend Engineer",
                "experience_level": "Entry Level",
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        suggestion = data["data"]
        self.assertIn("suggested_content", suggestion)
        self.assertEqual(suggestion["section"], "summary")
        self.assertEqual(suggestion["status"], "pending")
        self.assertTrue(len(suggestion["suggested_content"]) > 10)

        # Verify suggestion stored in MongoDB
        db_sugg = self.db.ai_suggestions.find_one({"resume_id": self.resume_id})
        self.assertIsNotNone(db_sugg)
        self.assertEqual(db_sugg["status"], "pending")

        # Test fetching suggestions list
        list_res = self.client.get(f"/api/ai/suggestions/{self.resume_id}", headers=self.headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.get_json()["data"]), 1)

        # Test accepting suggestion
        sugg_id = suggestion["id"]
        accept_res = self.client.post(
            f"/api/ai/suggestions/{sugg_id}/accept",
            headers=self.headers,
            json={},
        )
        self.assertEqual(accept_res.status_code, 200)
        accept_data = accept_res.get_json()["data"]
        self.assertEqual(accept_data["suggestion"]["status"], "accepted")

        # Verify resume content updated in database
        updated_resume = self.db.resumes.find_one({"_id": ObjectId(self.resume_id)})
        self.assertIsNotNone(updated_resume)
        self.assertEqual(
            updated_resume["content"]["professional_summary"]["content"],
            suggestion["suggested_content"],
        )

    def test_04_reject_suggestion(self):
        # Create a dummy suggestion in database
        sugg = {
            "user_id": self.token,  # placeholder
            "resume_id": self.resume_id,
            "section": "summary",
            "suggested_content": "Draft",
            "status": "pending",
        }
        res_insert = self.db.ai_suggestions.insert_one(sugg)
        sugg_id = str(res_insert.inserted_id)

        # Update user_id to match current test user
        user = self.db.users.find_one({"email": self.user_email})
        self.db.ai_suggestions.update_one({"_id": res_insert.inserted_id}, {"$set": {"user_id": str(user["_id"])}})

        reject_res = self.client.post(f"/api/ai/suggestions/{sugg_id}/reject", headers=self.headers)
        self.assertEqual(reject_res.status_code, 200)
        self.assertEqual(reject_res.get_json()["data"]["status"], "rejected")


if __name__ == "__main__":
    unittest.main()
