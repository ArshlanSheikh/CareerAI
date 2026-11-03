from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import EnhancementService
from .schemas import GenerateEnhancementRequest, ApplyEnhancementRequest


class EnhancementController:
    @staticmethod
    def generate_enhancement(resume_id: str, data: GenerateEnhancementRequest):
        user_id = get_jwt_identity()
        result, error = EnhancementService.generate_enhancement(
            user_id=user_id,
            resume_id=resume_id,
            target_role=data.target_role or "",
            custom_instructions=data.custom_instructions or "",
            analysis_id=data.analysis_id or "",
        )
        if error:
            return error_response(error, status_code=400)
        return success_response(result, message="AI Resume Enhancement generated successfully", status_code=201)

    @staticmethod
    def get_latest_for_resume(resume_id: str):
        user_id = get_jwt_identity()
        result, error = EnhancementService.get_latest_enhancement(user_id, resume_id)
        if error:
            return error_response(error, status_code=404)
        return success_response(result)

    @staticmethod
    def get_enhancement(enhancement_id: str):
        user_id = get_jwt_identity()
        result, error = EnhancementService.get_enhancement(user_id, enhancement_id)
        if error:
            return error_response(error, status_code=404)
        return success_response(result)

    @staticmethod
    def apply_enhancement(resume_id: str, data: ApplyEnhancementRequest, enhancement_id: str = None):
        user_id = get_jwt_identity()
        # If enhancement_id not in URL, check data or fetch latest
        eff_enhancement_id = enhancement_id
        if not eff_enhancement_id:
            latest, err = EnhancementService.get_latest_enhancement(user_id, resume_id)
            if err or not latest:
                return error_response("No enhancement found to apply", status_code=404)
            eff_enhancement_id = latest["id"]

        result, error = EnhancementService.apply_enhancement(
            user_id=user_id,
            resume_id=resume_id,
            enhancement_id=eff_enhancement_id,
            mode=data.mode or "new_version",
            accepted_sections=data.accepted_sections,
            custom_content=data.custom_content,
            title_for_new_resume=data.title_for_new_resume or "",
        )
        if error:
            return error_response(error, status_code=400)
        return success_response(result, message=result.get("message", "Enhancement applied successfully"))

