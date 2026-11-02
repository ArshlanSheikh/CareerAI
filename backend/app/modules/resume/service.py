import copy
import re
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import ReturnDocument
from app.database.connection import get_db
from app.common.responses import serialize_doc


def get_default_resume_content(personal_info=None):
    return {
        "personal_info": personal_info or {
            "full_name": "",
            "email": "",
            "phone": "",
            "city": "",
            "state": "",
            "country": "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
            "profile_image": "",
        },
        "professional_summary": {
            "content": "",
            "target_role": "",
            "experience_level": "Entry Level / Student",
        },
        "education": [],
        "skills": [
            {
                "id": "SKILL_CAT_001",
                "category": "Programming Languages",
                "items": [],
            },
            {
                "id": "SKILL_CAT_002",
                "category": "Frameworks & Libraries",
                "items": [],
            },
            {
                "id": "SKILL_CAT_003",
                "category": "Developer Tools & Databases",
                "items": [],
            },
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
        "section_order": [
            "summary",
            "education",
            "skills",
            "projects",
            "experience",
            "internships",
            "certifications",
            "additional",
        ],
        "hidden_sections": [],
    }


class ResumeService:
    @staticmethod
    def create_resume(user_id: str, data: dict):
        db = get_db()
        now = datetime.now(timezone.utc)

        title = data.get("title", "Untitled Resume").strip()
        target_role = data.get("target_role", "").strip()
        template = data.get("template", "modern")
        import_from_profile = data.get("import_from_profile", False)

        content = get_default_resume_content()

        # If import_from_profile is requested, copy data snapshot from student_profiles
        if import_from_profile:
            profile = db.student_profiles.find_one({"user_id": user_id})
            if profile:
                if profile.get("personal_info"):
                    content["personal_info"] = copy.deepcopy(profile["personal_info"])
                if profile.get("education"):
                    content["education"] = copy.deepcopy(profile["education"])
                if profile.get("skills"):
                    content["skills"] = copy.deepcopy(profile["skills"])
                if profile.get("projects"):
                    content["projects"] = copy.deepcopy(profile["projects"])
                if profile.get("work_experience"):
                    content["work_experience"] = copy.deepcopy(profile["work_experience"])
                if profile.get("internships"):
                    content["internships"] = copy.deepcopy(profile["internships"])
                if profile.get("certifications"):
                    content["certifications"] = copy.deepcopy(profile["certifications"])

        if target_role:
            content["professional_summary"]["target_role"] = target_role

        resume_doc = {
            "user_id": user_id,
            "title": title,
            "target_role": target_role,
            "template": template,
            "current_version": 1,
            "status": "draft",
            "content": content,
            "created_at": now,
            "updated_at": now,
        }

        result = db.resumes.insert_one(resume_doc)
        resume_doc["_id"] = result.inserted_id

        return serialize_doc(resume_doc)

    @staticmethod
    def list_resumes(user_id: str):
        db = get_db()
        resumes = list(
            db.resumes.find(
                {"user_id": user_id},
                {
                    "_id": 1,
                    "user_id": 1,
                    "title": 1,
                    "target_role": 1,
                    "template": 1,
                    "current_version": 1,
                    "status": 1,
                    "created_at": 1,
                    "updated_at": 1,
                },
            ).sort("updated_at", -1)
        )
        return serialize_doc(resumes)

    @staticmethod
    def get_resume(user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        return serialize_doc(resume), None

    @staticmethod
    def update_resume(user_id: str, resume_id: str, update_data: dict):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        # Verify ownership
        existing = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not existing:
            return None, "Resume not found or access denied"

        now = datetime.now(timezone.utc)
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        clean_update["updated_at"] = now

        updated = db.resumes.find_one_and_update(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": clean_update},
            return_document=ReturnDocument.AFTER,
        )

        return serialize_doc(updated), None

    @staticmethod
    def duplicate_resume(user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        original = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not original:
            return None, "Original resume not found or access denied"

        now = datetime.now(timezone.utc)
        duplicate_doc = copy.deepcopy(original)
        del duplicate_doc["_id"]

        duplicate_doc["title"] = f"{original['title']} (Copy)"
        duplicate_doc["current_version"] = 1
        duplicate_doc["status"] = "draft"
        duplicate_doc["created_at"] = now
        duplicate_doc["updated_at"] = now

        result = db.resumes.insert_one(duplicate_doc)
        duplicate_doc["_id"] = result.inserted_id

        return serialize_doc(duplicate_doc), None

    @staticmethod
    def delete_resume(user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return False, "Invalid resume ID format"

        result = db.resumes.delete_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if result.deleted_count == 0:
            return False, "Resume not found or access denied"

        # Clean up related versions and suggestions
        db.resume_versions.delete_many({"resume_id": resume_id})
        db.ai_suggestions.delete_many({"resume_id": resume_id})

        return True, None

    @staticmethod
    def import_from_pdf(user_id: str, file_bytes: bytes, filename: str):
        from app.pdf.extraction import PdfExtractor
        from app.ai.ai_service import AiService

        # 1. Extract raw text with PyMuPDF
        raw_text = PdfExtractor.extract_text(file_bytes)

        # 2. Parse into standardized structure with Gemini
        ai_svc = AiService()
        parsed_content = ai_svc.parse_resume_from_text(raw_text)

        # 3. Create new resume document
        db = get_db()
        now = datetime.now(timezone.utc)

        # Determine title from candidate name or filename
        candidate_name = parsed_content.get("personal_info", {}).get("full_name", "").strip()
        base_name = filename.rsplit(".", 1)[0] if filename else "Imported Resume"
        if candidate_name:
            title = f"{candidate_name} Resume (Imported)"
        else:
            title = f"{base_name} (Imported)"

        target_role = parsed_content.get("professional_summary", {}).get("target_role", "")

        resume_doc = {
            "user_id": user_id,
            "title": title,
            "target_role": target_role,
            "template": "modern",
            "current_version": 1,
            "status": "draft",
            "content": parsed_content,
            "created_at": now,
            "updated_at": now,
        }

        result = db.resumes.insert_one(resume_doc)
        resume_doc["_id"] = result.inserted_id

        return serialize_doc(resume_doc), None

    @staticmethod
    def generate_resume_pdf(user_id: str, resume_id: str):
        from app.pdf.generation import PdfGenerator

        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, None, "Resume not found or access denied"

        # Generate PDF bytes
        pdf_bytes = PdfGenerator.generate_pdf(resume)

        # Generate clean filename
        full_name = resume.get("content", {}).get("personal_info", {}).get("full_name") or "Student"
        clean_name = re.sub(r"[^\w\s-]", "", full_name).strip().replace(" ", "_")
        filename = f"{clean_name}_Resume.pdf"

        return pdf_bytes, filename, None

