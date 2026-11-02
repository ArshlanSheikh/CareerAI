import copy
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import ReturnDocument
from app.database.connection import get_db
from app.common.responses import serialize_doc


class VersionService:
    @staticmethod
    def create_version(user_id: str, resume_id: str, change_summary: str = ""):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        # Determine next sequential version number
        latest_v = db.resume_versions.find_one(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("version_number", -1)],
        )
        if latest_v:
            next_version = latest_v["version_number"] + 1
        else:
            current_v = resume.get("current_version", 1)
            next_version = current_v if current_v > 0 else 1

        now = datetime.now(timezone.utc)
        note = change_summary.strip() if change_summary else f"Version {next_version} snapshot"

        version_doc = {
            "resume_id": resume_id,
            "user_id": user_id,
            "version_number": next_version,
            "title": resume.get("title", "Resume"),
            "target_role": resume.get("target_role", ""),
            "template": resume.get("template", "modern"),
            "content": copy.deepcopy(resume.get("content", {})),
            "change_summary": note,
            "created_at": now,
        }

        res = db.resume_versions.insert_one(version_doc)
        version_doc["_id"] = res.inserted_id

        # Update resume's current_version marker
        db.resumes.update_one(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": {"current_version": next_version, "updated_at": now}},
        )

        return serialize_doc(version_doc), None

    @staticmethod
    def list_versions(user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        versions = list(
            db.resume_versions.find(
                {"resume_id": resume_id, "user_id": user_id}
            ).sort("version_number", -1)
        )

        return serialize_doc(versions), None

    @staticmethod
    def get_version(user_id: str, resume_id: str, version_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(version_id):
            return None, "Invalid ID format"

        version = db.resume_versions.find_one(
            {"_id": ObjectId(version_id), "resume_id": resume_id, "user_id": user_id}
        )
        if not version:
            return None, "Resume version snapshot not found or access denied"

        return serialize_doc(version), None

    @staticmethod
    def restore_version(user_id: str, resume_id: str, version_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(version_id):
            return None, "Invalid ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        target_version = db.resume_versions.find_one(
            {"_id": ObjectId(version_id), "resume_id": resume_id, "user_id": user_id}
        )
        if not target_version:
            return None, "Target version snapshot not found or access denied"

        # Find highest version number to create a NEW audit-trail snapshot
        latest_v = db.resume_versions.find_one(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("version_number", -1)],
        )
        next_version = (latest_v["version_number"] + 1) if latest_v else 2

        now = datetime.now(timezone.utc)
        restored_note = f"Restored from Version {target_version['version_number']}"

        new_snapshot = {
            "resume_id": resume_id,
            "user_id": user_id,
            "version_number": next_version,
            "title": target_version.get("title", resume.get("title")),
            "target_role": target_version.get("target_role", resume.get("target_role")),
            "template": target_version.get("template", resume.get("template")),
            "content": copy.deepcopy(target_version.get("content", {})),
            "change_summary": restored_note,
            "created_at": now,
        }

        res = db.resume_versions.insert_one(new_snapshot)
        new_snapshot["_id"] = res.inserted_id

        # Update active resume document with restored content and next version
        updated_resume = db.resumes.find_one_and_update(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {
                "$set": {
                    "content": new_snapshot["content"],
                    "template": new_snapshot["template"],
                    "target_role": new_snapshot["target_role"],
                    "current_version": next_version,
                    "updated_at": now,
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        return {
            "restored_snapshot": serialize_doc(new_snapshot),
            "active_resume": serialize_doc(updated_resume),
        }, None

