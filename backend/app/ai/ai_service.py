from datetime import datetime, timezone
from bson import ObjectId
from pymongo import ReturnDocument
from app.database.connection import get_db
from app.common.responses import serialize_doc
from .providers.gemini import GeminiProvider
from .prompt_builder import PromptBuilder, BASE_SYSTEM_INSTRUCTION
from .response_parser import (
    SummaryAiResponse,
    ProjectAiResponse,
    ExperienceAiResponse,
    InternshipAiResponse,
    SkillsAiResponse,
    parse_and_validate,
)


class AiService:
    def __init__(self):
        self.provider = GeminiProvider()

    def generate_summary(self, user_id: str, resume_id: str, data: dict):
        db = get_db()
        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        content = resume.get("content", {})
        original_summary = data.get("original_content") or content.get("professional_summary", {}).get("content", "")
        target_role = data.get("target_role") or resume.get("target_role") or content.get("professional_summary", {}).get("target_role", "")
        experience_level = data.get("experience_level") or content.get("professional_summary", {}).get("experience_level", "Entry Level / Student")
        custom_instructions = data.get("custom_instructions", "")

        prompt = PromptBuilder.build_summary_prompt(
            original_summary=original_summary,
            target_role=target_role,
            experience_level=experience_level,
            skills_context=content.get("skills", []),
            education_context=content.get("education", []),
            projects_context=content.get("projects", []),
            experience_context=content.get("work_experience", []),
            custom_instructions=custom_instructions,
        )

        raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        validated: SummaryAiResponse = parse_and_validate(raw_json, SummaryAiResponse)

        now = datetime.now(timezone.utc)
        suggestion_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "section": "summary",
            "item_id": None,
            "field": "content",
            "original_content": original_summary,
            "suggested_content": validated.suggested_content,
            "changes": validated.changes_summary,
            "factual_warnings": validated.factual_warnings,
            "status": "pending",
            "created_at": now,
        }

        res = db.ai_suggestions.insert_one(suggestion_doc)
        suggestion_doc["_id"] = res.inserted_id

        return serialize_doc(suggestion_doc), None

    def improve_project(self, user_id: str, resume_id: str, data: dict):
        db = get_db()
        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        project_id = data.get("project_id")
        project_name = data.get("project_name", "")
        technologies = data.get("technologies", [])
        original_description = data.get("original_description", "")
        key_contributions = data.get("key_contributions", [])
        personally_implemented = data.get("personally_implemented_features", [])
        custom_instructions = data.get("custom_instructions", "")

        prompt = PromptBuilder.build_project_prompt(
            project_name=project_name,
            technologies=technologies,
            original_description=original_description,
            key_contributions=key_contributions,
            personally_implemented_features=personally_implemented,
            custom_instructions=custom_instructions,
        )

        raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        validated: ProjectAiResponse = parse_and_validate(raw_json, ProjectAiResponse)

        now = datetime.now(timezone.utc)
        suggested_payload = {
            "description": validated.suggested_description,
            "personally_implemented_features": validated.suggested_bullets,
        }

        suggestion_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "section": "projects",
            "item_id": project_id,
            "field": "project_content",
            "original_content": {
                "description": original_description,
                "personally_implemented_features": personally_implemented,
            },
            "suggested_content": suggested_payload,
            "changes": validated.changes_summary,
            "factual_warnings": validated.factual_warnings,
            "status": "pending",
            "created_at": now,
        }

        res = db.ai_suggestions.insert_one(suggestion_doc)
        suggestion_doc["_id"] = res.inserted_id

        return serialize_doc(suggestion_doc), None

    def improve_experience(self, user_id: str, resume_id: str, data: dict):
        db = get_db()
        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        experience_id = data.get("experience_id")
        company_name = data.get("company_name", "")
        job_title = data.get("job_title", "")
        responsibilities = data.get("responsibilities", [])
        achievements = data.get("achievements", [])
        technologies = data.get("technologies", [])
        custom_instructions = data.get("custom_instructions", "")

        prompt = PromptBuilder.build_experience_prompt(
            company_name=company_name,
            job_title=job_title,
            responsibilities=responsibilities,
            achievements=achievements,
            technologies=technologies,
            custom_instructions=custom_instructions,
        )

        raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        validated: ExperienceAiResponse = parse_and_validate(raw_json, ExperienceAiResponse)

        now = datetime.now(timezone.utc)
        suggestion_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "section": "work_experience",
            "item_id": experience_id,
            "field": "responsibilities",
            "original_content": responsibilities,
            "suggested_content": validated.suggested_responsibilities,
            "changes": validated.changes_summary,
            "factual_warnings": validated.factual_warnings,
            "status": "pending",
            "created_at": now,
        }

        res = db.ai_suggestions.insert_one(suggestion_doc)
        suggestion_doc["_id"] = res.inserted_id

        return serialize_doc(suggestion_doc), None

    def improve_internship(self, user_id: str, resume_id: str, data: dict):
        db = get_db()
        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        internship_id = data.get("internship_id")
        organization = data.get("organization", "")
        position = data.get("position", "")
        responsibilities = data.get("responsibilities", [])
        skills_learned = data.get("skills_learned", [])
        custom_instructions = data.get("custom_instructions", "")

        prompt = PromptBuilder.build_internship_prompt(
            organization=organization,
            position=position,
            responsibilities=responsibilities,
            skills_learned=skills_learned,
            custom_instructions=custom_instructions,
        )

        raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        validated: InternshipAiResponse = parse_and_validate(raw_json, InternshipAiResponse)

        now = datetime.now(timezone.utc)
        suggestion_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "section": "internships",
            "item_id": internship_id,
            "field": "responsibilities",
            "original_content": responsibilities,
            "suggested_content": validated.suggested_responsibilities,
            "changes": validated.changes_summary,
            "factual_warnings": validated.factual_warnings,
            "status": "pending",
            "created_at": now,
        }

        res = db.ai_suggestions.insert_one(suggestion_doc)
        suggestion_doc["_id"] = res.inserted_id

        return serialize_doc(suggestion_doc), None

    def suggest_skills(self, user_id: str, resume_id: str, data: dict):
        db = get_db()
        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        content = resume.get("content", {})
        target_role = data.get("target_role") or resume.get("target_role", "")

        prompt = PromptBuilder.build_skills_prompt(
            target_role=target_role,
            existing_skills=content.get("skills", []),
            projects=content.get("projects", []),
            experience=content.get("work_experience", []),
        )

        raw_json = self.provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        validated: SkillsAiResponse = parse_and_validate(raw_json, SkillsAiResponse)

        now = datetime.now(timezone.utc)
        suggestion_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "section": "skills",
            "item_id": None,
            "field": "suggested_skills",
            "original_content": content.get("skills", []),
            "suggested_content": [s.model_dump() for s in validated.suggested_skills],
            "changes": validated.changes_summary,
            "factual_warnings": [],
            "status": "pending",
            "created_at": now,
        }

        res = db.ai_suggestions.insert_one(suggestion_doc)
        suggestion_doc["_id"] = res.inserted_id

        return serialize_doc(suggestion_doc), None

    def get_suggestions_by_resume(self, user_id: str, resume_id: str):
        db = get_db()
        suggestions = list(
            db.ai_suggestions.find(
                {"resume_id": resume_id, "user_id": user_id}
            ).sort("created_at", -1)
        )
        return serialize_doc(suggestions)

    def accept_suggestion(self, user_id: str, suggestion_id: str, modified_content=None):
        db = get_db()
        if not ObjectId.is_valid(suggestion_id):
            return None, "Invalid suggestion ID format"

        suggestion = db.ai_suggestions.find_one(
            {"_id": ObjectId(suggestion_id), "user_id": user_id}
        )
        if not suggestion:
            return None, "Suggestion not found or access denied"

        # Content to apply: either student's manually edited content or the original suggestion
        content_to_apply = modified_content if modified_content is not None else suggestion["suggested_content"]

        resume_id = suggestion["resume_id"]
        section = suggestion["section"]
        item_id = suggestion.get("item_id")
        now = datetime.now(timezone.utc)

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Target resume not found"

        content = resume.get("content", {})

        # Apply based on section
        if section == "summary":
            if "professional_summary" not in content:
                content["professional_summary"] = {}
            content["professional_summary"]["content"] = content_to_apply

        elif section == "projects" and item_id:
            projects = content.get("projects", [])
            for proj in projects:
                if proj.get("id") == item_id:
                    if isinstance(content_to_apply, dict):
                        if "description" in content_to_apply:
                            proj["description"] = content_to_apply["description"]
                        if "personally_implemented_features" in content_to_apply:
                            proj["personally_implemented_features"] = content_to_apply["personally_implemented_features"]
                    break

        elif section == "work_experience" and item_id:
            experience = content.get("work_experience", [])
            for exp in experience:
                if exp.get("id") == item_id:
                    if isinstance(content_to_apply, list):
                        exp["responsibilities"] = content_to_apply
                    break

        elif section == "internships" and item_id:
            internships = content.get("internships", [])
            for intn in internships:
                if intn.get("id") == item_id:
                    if isinstance(content_to_apply, list):
                        intn["responsibilities"] = content_to_apply
                    break

        elif section == "skills":
            # Add accepted skill categories / items
            current_skills = content.get("skills", [])
            if isinstance(content_to_apply, list):
                for new_cat in content_to_apply:
                    cat_name = new_cat.get("category", "Additional Skills")
                    new_items = new_cat.get("skills", [])
                    # Match existing or append
                    matched = False
                    for existing_cat in current_skills:
                        if existing_cat.get("category", "").lower() == cat_name.lower():
                            existing_set = set(existing_cat.get("items", []))
                            existing_set.update(new_items)
                            existing_cat["items"] = list(existing_set)
                            matched = True
                            break
                    if not matched:
                        current_skills.append({
                            "id": f"SKILL_{int(now.timestamp())}_{len(current_skills)}",
                            "category": cat_name,
                            "items": new_items,
                        })
                content["skills"] = current_skills

        # Update resume document
        db.resumes.update_one(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": {"content": content, "updated_at": now}},
        )

        # Mark suggestion accepted
        updated_suggestion = db.ai_suggestions.find_one_and_update(
            {"_id": ObjectId(suggestion_id)},
            {"$set": {"status": "accepted", "applied_content": content_to_apply, "updated_at": now}},
            return_document=ReturnDocument.AFTER,
        )

        return {
            "suggestion": serialize_doc(updated_suggestion),
            "updated_resume": serialize_doc(db.resumes.find_one({"_id": ObjectId(resume_id)})),
        }, None

    def reject_suggestion(self, user_id: str, suggestion_id: str):
        db = get_db()
        if not ObjectId.is_valid(suggestion_id):
            return None, "Invalid suggestion ID format"

        updated = db.ai_suggestions.find_one_and_update(
            {"_id": ObjectId(suggestion_id), "user_id": user_id},
            {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc)}},
            return_document=ReturnDocument.AFTER,
        )
        if not updated:
            return None, "Suggestion not found or access denied"

        return serialize_doc(updated), None

    def parse_resume_from_text(self, raw_text: str) -> dict:
        """
        Takes raw extracted text from a PDF and uses Gemini to map it into
        the standardized CareerAI resume content structure.
        Validates the output with StandardizedResumeContent.
        """
        prompt = PromptBuilder.build_pdf_extraction_prompt(raw_text)
        system_instruction = (
            "You are an expert resume parsing engine. Convert the raw resume text into the exact requested JSON schema. "
            "Never invent missing details. Output strictly valid JSON."
        )
        raw_json = self.provider.generate_json(prompt, system_instruction)

        # Ensure ids exist for list items if AI left them out or omitted fields
        if "education" in raw_json and isinstance(raw_json["education"], list):
            for i, edu in enumerate(raw_json["education"]):
                if isinstance(edu, dict) and not edu.get("id"):
                    edu["id"] = f"EDU_{i+1}"
        if "skills" in raw_json and isinstance(raw_json["skills"], list):
            for i, sk in enumerate(raw_json["skills"]):
                if isinstance(sk, dict) and not sk.get("id"):
                    sk["id"] = f"SKILL_{i+1}"
        if "projects" in raw_json and isinstance(raw_json["projects"], list):
            for i, pr in enumerate(raw_json["projects"]):
                if isinstance(pr, dict) and not pr.get("id"):
                    pr["id"] = f"PROJ_{i+1}"
        if "work_experience" in raw_json and isinstance(raw_json["work_experience"], list):
            for i, we in enumerate(raw_json["work_experience"]):
                if isinstance(we, dict) and not we.get("id"):
                    we["id"] = f"EXP_{i+1}"
        if "internships" in raw_json and isinstance(raw_json["internships"], list):
            for i, it in enumerate(raw_json["internships"]):
                if isinstance(it, dict) and not it.get("id"):
                    it["id"] = f"INT_{i+1}"
        if "certifications" in raw_json and isinstance(raw_json["certifications"], list):
            for i, ce in enumerate(raw_json["certifications"]):
                if isinstance(ce, dict) and not ce.get("id"):
                    ce["id"] = f"CERT_{i+1}"

        # Validate against StandardizedResumeContent Pydantic schema
        from app.modules.resume.schemas import StandardizedResumeContent
        validated = StandardizedResumeContent(**raw_json)
        return validated.model_dump()

