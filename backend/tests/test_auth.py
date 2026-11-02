import unittest
from app import create_app
from app.database.connection import get_db, close_db


class AuthTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        # Clean up test users created during test runs
        cls.db.users.delete_many({"email": {"$regex": "@test-auth.com$"}})
        cls.db.student_profiles.delete_many({"personal_info.email": {"$regex": "@test-auth.com$"}})
        close_db()

    def setUp(self):
        # Unique email per test method run
        self.test_email = f"student_{self._testMethodName.lower()}@test-auth.com"
        self.test_password = "SecurePassword123!"
        self.test_name = "Alex Johnson"

    def test_01_register_success(self):
        res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("access_token", data["data"])
        self.assertIn("refresh_token", data["data"])
        self.assertEqual(data["data"]["user"]["email"], self.test_email)
        self.assertEqual(data["data"]["user"]["full_name"], self.test_name)

        # Verify student profile seed
        user_id = data["data"]["user"]["id"]
        profile = self.db.student_profiles.find_one({"user_id": user_id})
        self.assertIsNotNone(profile)
        self.assertEqual(profile["personal_info"]["email"], self.test_email)

    def test_02_register_duplicate_email(self):
        # First registration
        self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )
        # Second registration with same email
        res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": "Another Name",
            },
        )
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("already exists", data["message"])

    def test_03_register_validation_failure(self):
        # Invalid email and short password
        res = self.client.post(
            "/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "123",
                "full_name": "A",
            },
        )
        self.assertEqual(res.status_code, 422)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Validation error")

    def test_04_login_success(self):
        # Register user first
        self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )

        # Attempt login
        res = self.client.post(
            "/api/auth/login",
            json={
                "email": self.test_email,
                "password": self.test_password,
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("access_token", data["data"])
        self.assertEqual(data["data"]["user"]["email"], self.test_email)

    def test_05_login_invalid_password(self):
        self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )

        res = self.client.post(
            "/api/auth/login",
            json={
                "email": self.test_email,
                "password": "WrongPassword!",
            },
        )
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("invalid", data["message"].lower())

    def test_06_login_nonexistent_user(self):
        res = self.client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@test-auth.com",
                "password": "AnyPassword123",
            },
        )
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data["success"])

    def test_07_me_endpoint_authorized(self):
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )
        access_token = reg_res.get_json()["data"]["access_token"]

        res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["email"], self.test_email)
        self.assertEqual(data["data"]["full_name"], self.test_name)

    def test_08_me_endpoint_unauthorized(self):
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data["success"])

    def test_09_refresh_token(self):
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": self.test_name,
            },
        )
        refresh_token = reg_res.get_json()["data"]["refresh_token"]

        res = self.client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("access_token", data["data"])

    def test_10_logout(self):
        res = self.client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])


if __name__ == "__main__":
    unittest.main()

