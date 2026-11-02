from datetime import datetime, timezone
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from app.database.connection import get_db
from app.common.responses import serialize_doc


class AuthService:
    @staticmethod
    def register(email: str, password: str, full_name: str):
        db = get_db()
        email_clean = email.strip().lower()

        # Check duplicate email
        existing_user = db.users.find_one({"email": email_clean})
        if existing_user:
            return None, "An account with this email address already exists"

        now = datetime.now(timezone.utc)
        password_hash = generate_password_hash(password)

        user_doc = {
            "email": email_clean,
            "password_hash": password_hash,
            "full_name": full_name.strip(),
            "created_at": now,
            "updated_at": now,
        }

        result = db.users.insert_one(user_doc)
        user_id_str = str(result.inserted_id)

        # Seed initial student profile document linked to this user
        profile_doc = {
            "user_id": user_id_str,
            "personal_info": {
                "full_name": full_name.strip(),
                "email": email_clean,
                "phone": "",
                "city": "",
                "state": "",
                "country": "",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "profile_image": "",
            },
            "education": [],
            "skills": [
                {
                    "id": "SKILL_DEFAULT_1",
                    "category": "Core Technologies",
                    "items": [],
                }
            ],
            "projects": [],
            "work_experience": [],
            "internships": [],
            "certifications": [],
            "additional_info": {
                "awards": [],
                "hackathons": [],
                "publications": [],
                "volunteer_experience": [],
                "languages": [],
            },
            "created_at": now,
            "updated_at": now,
        }
        db.student_profiles.insert_one(profile_doc)

        access_token = create_access_token(identity=user_id_str)
        refresh_token = create_refresh_token(identity=user_id_str)

        user_response = {
            "id": user_id_str,
            "email": email_clean,
            "full_name": full_name.strip(),
            "created_at": now.isoformat(),
        }

        return {
            "user": user_response,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }, None

    @staticmethod
    def login(email: str, password: str):
        db = get_db()
        email_clean = email.strip().lower()

        user = db.users.find_one({"email": email_clean})
        if not user:
            return None, "Invalid email or password"

        if not check_password_hash(user["password_hash"], password):
            return None, "Invalid email or password"

        user_id_str = str(user["_id"])
        access_token = create_access_token(identity=user_id_str)
        refresh_token = create_refresh_token(identity=user_id_str)

        user_response = {
            "id": user_id_str,
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
        }

        return {
            "user": user_response,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }, None

    @staticmethod
    def refresh_access_token(user_id_str: str):
        db = get_db()
        if not ObjectId.is_valid(user_id_str):
            return None, "Invalid user token identity"

        user = db.users.find_one({"_id": ObjectId(user_id_str)})
        if not user:
            return None, "User account no longer exists"

        new_access_token = create_access_token(identity=user_id_str)
        return {"access_token": new_access_token}, None

    @staticmethod
    def get_current_user(user_id_str: str):
        db = get_db()
        if not ObjectId.is_valid(user_id_str):
            return None, "Invalid user identifier"

        user = db.users.find_one({"_id": ObjectId(user_id_str)})
        if not user:
            return None, "User not found"

        user_response = {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
        }
        return user_response, None

