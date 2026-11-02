import unittest
from app import create_app
from app.common.responses import serialize_doc, success_response, error_response
from app.common.decorators import validate_schema
from bson import ObjectId
from pydantic import BaseModel, Field
from flask import Blueprint, jsonify


class DummySchema(BaseModel):
    name: str = Field(..., min_length=2)
    email: str


class FoundationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("development")
        self.client = self.app.test_client()

        # Register a test route using validate_schema decorator
        test_bp = Blueprint("test_foundation_bp", __name__)

        @test_bp.route("/api/test-validation", methods=["POST"])
        @validate_schema(DummySchema)
        def test_validation(validated_data):
            return success_response(
                data={"name": validated_data.name, "email": validated_data.email},
                message="Validation succeeded",
            )

        self.app.register_blueprint(test_bp)

    @classmethod
    def tearDownClass(cls):
        from app.database.connection import close_db
        close_db()

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["service"], "CareerAI Backend API")
        self.assertEqual(data["data"]["database"], "connected")

    def test_404_handler(self):
        res = self.client.get("/api/non-existent-endpoint")
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("not found", data["message"].lower())

    def test_schema_validation_decorator_success(self):
        res = self.client.post(
            "/api/test-validation",
            json={"name": "Alice", "email": "alice@example.com"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["name"], "Alice")

    def test_schema_validation_decorator_failure(self):
        res = self.client.post(
            "/api/test-validation",
            json={"name": "A"},  # Missing email and name too short
        )
        self.assertEqual(res.status_code, 422)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Validation error")
        self.assertTrue(len(data["errors"]) > 0)

    def test_serialization_helper(self):
        oid = ObjectId()
        raw = {"_id": oid, "name": "Test", "nested": {"_id": ObjectId(), "count": 5}}
        serialized = serialize_doc(raw)
        self.assertEqual(serialized["id"], str(oid))
        self.assertIsInstance(serialized["nested"]["id"], str)


if __name__ == "__main__":
    unittest.main()
