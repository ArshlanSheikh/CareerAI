import copy
from datetime import datetime, timezone
from bson import ObjectId
from app.database.connection import get_db
from app.common.responses import serialize_doc
from app.ai.providers.gemini import GeminiProvider
from app.ai.prompt_builder import PromptBuilder, BASE_SYSTEM_INSTRUCTION
from app.modules.versions.service import VersionService
from app.modules.resume.schemas import DEFAULT_SECTION_ORDER


class EnhancementService:
    @staticmethod
    def generate_enhancement(
        user_id: str,
        resume_id: str,
        target_role: str = "",
        custom_instructions: str = "",
        analysis_id: str = "",
    ):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found or access denied"

        content = resume.get("content", {})
        effective_role = target_role.strip() or resume.get("target_role", "")

        # Retrieve weakness diagnostic context from analysis
        weaknesses = []
        if analysis_id and ObjectId.is_valid(analysis_id):
            analysis_doc = db.resume_analyses.find_one(
                {"_id": ObjectId(analysis_id), "user_id": user_id}
            )
            if analysis_doc and "analysis" in analysis_doc:
                for w in analysis_doc["analysis"].get("weaknesses", []):
                    weaknesses.append(f"{w.get('title')}: {w.get('description')}")
        else:
            latest_analysis = db.resume_analyses.find_one(
                {"resume_id": resume_id, "user_id": user_id},
                sort=[("created_at", -1)],
            )
            if latest_analysis and "analysis" in latest_analysis:
                for w in latest_analysis["analysis"].get("weaknesses", []):
                    weaknesses.append(f"{w.get('title')}: {w.get('description')}")

        # Build prompt and execute Gemini AI call
        prompt = PromptBuilder.build_resume_enhancement_prompt(
            resume_content=content,
            target_role=effective_role,
            analysis_weaknesses=weaknesses,
            custom_instructions=custom_instructions,
        )

        try:
            provider = GeminiProvider()
            data = provider.generate_json(prompt, BASE_SYSTEM_INSTRUCTION)
        except Exception as e:
            return None, f"AI generation error: {str(e)}"

        if not isinstance(data, dict):
            return None, "Invalid format returned by AI"

        improved_content = data.get("improved_content") or copy.deepcopy(content)
        enhancement_summary = data.get(
            "enhancement_summary",
            "Resume upgraded with ATS-friendly action verbs and polished professional formatting."
        )
        estimated_score_improvement = int(data.get("estimated_score_improvement", 15))

        # Build structured diff objects with original vs improved side by side
        raw_diffs = data.get("section_diffs", [])
        section_diffs = []

        # Standard sections mapping
        section_meta = {
            "professional_summary": "Professional Summary",
            "skills": "Technical Skills",
            "projects": "Projects",
            "experience": "Work Experience",
            "internships": "Internships",
            "education": "Education",
            "certifications": "Certifications",
            "additional_info": "Additional Information",
        }

        diff_by_key = {d.get("section"): d for d in raw_diffs if isinstance(d, dict)}

        for s_key, s_title in section_meta.items():
            orig_val = content.get(s_key)
            impr_val = improved_content.get(s_key)
            diff_info = diff_by_key.get(s_key, {})

            # Only include sections that exist in the original or improved content
            if orig_val is not None or impr_val is not None:
                section_diffs.append({
                    "section": s_key,
                    "title": s_title,
                    "change_summary": diff_info.get("change_summary", [
                        f"Refined {s_title} for enhanced professional impact and clarity."
                    ]),
                    "impact": diff_info.get("impact", "high"),
                    "original": orig_val,
                    "improved": impr_val,
                })

        now = datetime.now(timezone.utc)
        enhancement_doc = {
            "resume_id": resume_id,
            "user_id": user_id,
            "target_role": effective_role,
            "original_content": content,
            "improved_content": improved_content,
            "section_diffs": section_diffs,
            "enhancement_summary": enhancement_summary,
            "estimated_score_improvement": estimated_score_improvement,
            "created_at": now,
        }

        res = db.resume_enhancements.insert_one(enhancement_doc)
        enhancement_doc["_id"] = res.inserted_id

        return serialize_doc(enhancement_doc), None

    @staticmethod
    def get_latest_enhancement(user_id: str, resume_id: str):
        db = get_db()
        if not ObjectId.is_valid(resume_id):
            return None, "Invalid resume ID format"

        doc = db.resume_enhancements.find_one(
            {"resume_id": resume_id, "user_id": user_id},
            sort=[("created_at", -1)],
        )
        if not doc:
            return None, "No enhancement found for this resume"

        return serialize_doc(doc), None

    @staticmethod
    def get_enhancement(user_id: str, enhancement_id: str):
        db = get_db()
        if not ObjectId.is_valid(enhancement_id):
            return None, "Invalid enhancement ID format"

        doc = db.resume_enhancements.find_one(
            {"_id": ObjectId(enhancement_id), "user_id": user_id}
        )
        if not doc:
            return None, "Enhancement record not found"

        return serialize_doc(doc), None

    @staticmethod
    def apply_enhancement(
        user_id: str,
        resume_id: str,
        enhancement_id: str,
        mode: str = "new_version",
        accepted_sections: dict = None,
        custom_content: dict = None,
        title_for_new_resume: str = "",
    ):
        db = get_db()
        if not ObjectId.is_valid(resume_id) or not ObjectId.is_valid(enhancement_id):
            return None, "Invalid ID format"

        enhancement = db.resume_enhancements.find_one(
            {"_id": ObjectId(enhancement_id), "user_id": user_id}
        )
        if not enhancement:
            return None, "Enhancement not found"

        resume = db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": user_id})
        if not resume:
            return None, "Resume not found"

        # Prepare source improved content
        source_improved = custom_content if isinstance(custom_content, dict) and custom_content else enhancement.get("improved_content", {})
        original_content = resume.get("content", {})
        final_content = copy.deepcopy(original_content)

        # Merge sections based on accepted_sections map
        if accepted_sections and isinstance(accepted_sections, dict):
            for sec_key, is_accepted in accepted_sections.items():
                if is_accepted and sec_key in source_improved:
                    final_content[sec_key] = copy.deepcopy(source_improved[sec_key])
                elif not is_accepted and sec_key in original_content:
                    final_content[sec_key] = copy.deepcopy(original_content[sec_key])
        else:
            # If no accepted_sections specified, accept all improved sections
            for sec_key, sec_val in source_improved.items():
                final_content[sec_key] = copy.deepcopy(sec_val)

        now = datetime.now(timezone.utc)

        if mode == "new_resume":
            # Create a separate new resume
            new_title = title_for_new_resume.strip() or f"{resume.get('title', 'Resume')} (AI Improved)"
            new_doc = {
                "user_id": user_id,
                "title": new_title,
                "target_role": enhancement.get("target_role") or resume.get("target_role", ""),
                "template": resume.get("template", "modern"),
                "status": "draft",
                "content": final_content,
                "section_order": resume.get("section_order", DEFAULT_SECTION_ORDER),
                "section_visibility": resume.get("section_visibility", {}),
                "current_version": 1,
                "created_at": now,
                "updated_at": now,
            }
            res = db.resumes.insert_one(new_doc)
            new_resume_id = str(res.inserted_id)

            # Create initial version snapshot for the new resume
            VersionService.create_version(
                user_id=user_id,
                resume_id=new_resume_id,
                change_summary=f"Created from AI enhancement of '{resume.get('title', 'Resume')}'",
            )

            return {
                "success": True,
                "mode": "new_resume",
                "resume_id": new_resume_id,
                "message": f"Successfully created new resume: '{new_title}'",
            }, None

        elif mode == "new_version":
            # 1. Ensure current pre-enhancement state has a snapshot
            VersionService.create_version(
                user_id=user_id,
                resume_id=resume_id,
                change_summary=f"Pre-enhancement snapshot (v{resume.get('current_version', 1)})",
            )

            # 2. Update resume content in database
            db.resumes.update_one(
                {"_id": ObjectId(resume_id), "user_id": user_id},
                {"$set": {"content": final_content, "updated_at": now}},
            )

            # 3. Create a snapshot representing the AI-enhanced version
            summary_snippet = enhancement.get("enhancement_summary", "Applied AI enhancements")[:80]
            v_res, _ = VersionService.create_version(
                user_id=user_id,
                resume_id=resume_id,
                change_summary=f"AI Enhanced: {summary_snippet}",
            )

            return {
                "success": True,
                "mode": "new_version",
                "resume_id": resume_id,
                "version": v_res.get("version_number") if v_res else None,
                "message": "AI improvements applied as a new version snapshot.",
            }, None

        else:
            # Mode "replace": create backup then replace
            VersionService.create_version(
                user_id=user_id,
                resume_id=resume_id,
                change_summary="Backup before AI replacement",
            )

            db.resumes.update_one(
                {"_id": ObjectId(resume_id), "user_id": user_id},
                {"$set": {"content": final_content, "updated_at": now}},
            )

            return {
                "success": True,
                "mode": "replace",
                "resume_id": resume_id,
                "message": "Resume updated with AI improvements (backup created in history).",
            }, None
