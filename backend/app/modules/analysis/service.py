import logging
from datetime import datetime, timezone
from bson import ObjectId
from app.database.connection import get_db
from app.common.responses import serialize_doc
from app.ai.providers.gemini import GeminiProvider
from app.ai.prompt_builder import PromptBuilder, BASE_SYSTEM_INSTRUCTION
from .schemas import ResumeAnalysisModel

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self):
        self.provider = GeminiProvider()

    def analyze_resume(self, user_id: str, resume_id: str, target_role: str = ""):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        content = resume.get("content", {})
        active_target_role = (
            target_role
            or resume.get("target_role")
            or content.get("professional_summary", {}).get("target_role")
            or "Software Engineer"
        )

        prompt = PromptBuilder.build_resume_analysis_prompt(content, active_target_role)

        try:
            raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
            validated = ResumeAnalysisModel(**raw_json)
        except Exception as e:
            logger.error(f"Failed to generate or validate resume analysis: {e}", exc_info=True)
            return None, f"Analysis generation error: {str(e)}"

        now = datetime.now(timezone.utc)
        analysis_doc = validated.model_dump()
        analysis_doc.update({
            "user_id": user_id,
            "resume_id": resume_id,
            "resume_title": resume.get("title", "Untitled Resume"),
            "target_role": active_target_role,
            "created_at": now,
        })

        res = db.resume_analyses.insert_one(analysis_doc)
        analysis_doc["_id"] = res.inserted_id

        # Cache latest score overview on the resume document
        db.resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {
                "$set": {
                    "latest_analysis_id": str(res.inserted_id),
                    "overall_score": validated.overall_score,
                    "ats_score": validated.ats_compatibility_score,
                    "job_readiness_score": validated.job_readiness_score,
                    "last_analyzed_at": now,
                }
            },
        )

        return serialize_doc(analysis_doc), None

    def get_analysis(self, user_id: str, analysis_id: str):
        db = get_db()
        if not ObjectId.is_valid(analysis_id):
            return None, "Invalid analysis ID format"

        doc = db.resume_analyses.find_one({"_id": ObjectId(analysis_id), "user_id": user_id})
        if not doc:
            return None, "Analysis report not found"

        return serialize_doc(doc), None

    def get_latest_analysis_for_resume(self, user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        doc = db.resume_analyses.find_one(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("created_at", -1)],
        )
        if not doc:
            return None, "No analysis reports found for this resume"

        return serialize_doc(doc), None

    def list_analyses_for_resume(self, user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        cursor = db.resume_analyses.find(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("created_at", -1)],
        )
        return [serialize_doc(doc) for doc in cursor], None

