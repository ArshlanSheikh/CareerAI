from datetime import datetime, timezone
from pymongo import ReturnDocument
from bson import ObjectId
from app.database.connection import get_db
from app.common.responses import serialize_doc


class ProfileService:
    @staticmethod
    def get_or_create_profile(user_id_str: str):
        db = get_db()
        profile = db.student_profiles.find_one({"user_id": user_id_str})

        if not profile:
            # Look up user to initialize default profile
            user = None
            if ObjectId.is_valid(user_id_str):
                user = db.users.find_one({"_id": ObjectId(user_id_str)})

            email = user.get("email", "") if user else ""
            full_name = user.get("full_name", "") if user else ""
            now = datetime.now(timezone.utc)

            new_profile = {
                "user_id": user_id_str,
                "personal_info": {
                    "full_name": full_name,
                    "email": email,
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
                        "id": "SKILL_CAT_001",
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
            res = db.student_profiles.insert_one(new_profile)
            new_profile["_id"] = res.inserted_id
            profile = new_profile

        return serialize_doc(profile)

    @staticmethod
    def update_profile(user_id_str: str, update_dict: dict):
        db = get_db()
        now = datetime.now(timezone.utc)

        # Filter out top-level None values
        clean_update = {k: v for k, v in update_dict.items() if v is not None}
        clean_update["updated_at"] = now

        # Ensure user has a profile document before updating
        ProfileService.get_or_create_profile(user_id_str)

        updated_profile = db.student_profiles.find_one_and_update(
            {"user_id": user_id_str},
            {"$set": clean_update},
            return_document=ReturnDocument.AFTER,
        )

        return serialize_doc(updated_profile)

