from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from app.ai.ai_service import AiService
from .schemas import (
    SummaryAiRequest,
    ProjectAiRequest,
    ExperienceAiRequest,
    InternshipAiRequest,
    SkillsAiRequest,
    AcceptSuggestionRequest,
)

_ai_service = None


def get_ai_service():
    global _ai_service
    if _ai_service is None:
        _ai_service = AiService()
    return _ai_service


class AiController:
    @staticmethod
    def generate_summary(validated_data: SummaryAiRequest):
        user_id = get_jwt_identity()
        try:
            service = get_ai_service()
            result, error = service.generate_summary(
                user_id=user_id,
                resume_id=validated_data.resume_id,
                data=validated_data.model_dump(),
            )
            if error:
                return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

            return success_response(
                data=result,
                message="AI Professional Summary generated successfully",
                status_code=200,
            )
        except Exception as e:
            return error_response(message=f"AI generation failed: {str(e)}", status_code=500)

    @staticmethod
    def improve_project(validated_data: ProjectAiRequest):
        user_id = get_jwt_identity()
        try:
            service = get_ai_service()
            result, error = service.improve_project(
                user_id=user_id,
                resume_id=validated_data.resume_id,
                data=validated_data.model_dump(),
            )
            if error:
                return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

            return success_response(
                data=result,
                message="Project description enhanced successfully",
                status_code=200,
            )
        except Exception as e:
            return error_response(message=f"AI project enhancement failed: {str(e)}", status_code=500)

    @staticmethod
    def improve_experience(validated_data: ExperienceAiRequest):
        user_id = get_jwt_identity()
        try:
            service = get_ai_service()
            result, error = service.improve_experience(
                user_id=user_id,
                resume_id=validated_data.resume_id,
                data=validated_data.model_dump(),
            )
            if error:
                return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

            return success_response(
                data=result,
                message="Work experience enhanced successfully",
                status_code=200,
            )
        except Exception as e:
            return error_response(message=f"AI experience enhancement failed: {str(e)}", status_code=500)

    @staticmethod
    def improve_internship(validated_data: InternshipAiRequest):
        user_id = get_jwt_identity()
        try:
            service = get_ai_service()
            result, error = service.improve_internship(
                user_id=user_id,
                resume_id=validated_data.resume_id,
                data=validated_data.model_dump(),
            )
            if error:
                return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

            return success_response(
                data=result,
                message="Internship bullets enhanced successfully",
                status_code=200,
            )
        except Exception as e:
            return error_response(message=f"AI internship enhancement failed: {str(e)}", status_code=500)

    @staticmethod
    def suggest_skills(validated_data: SkillsAiRequest):
        user_id = get_jwt_identity()
        try:
            service = get_ai_service()
            result, error = service.suggest_skills(
                user_id=user_id,
                resume_id=validated_data.resume_id,
                data=validated_data.model_dump(),
            )
            if error:
                return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

            return success_response(
                data=result,
                message="Relevant skill suggestions generated successfully",
                status_code=200,
            )
        except Exception as e:
            return error_response(message=f"AI skill suggestions failed: {str(e)}", status_code=500)

    @staticmethod
    def get_suggestions(resume_id: str):
        user_id = get_jwt_identity()
        service = get_ai_service()
        suggestions = service.get_suggestions_by_resume(user_id, resume_id)
        return success_response(data=suggestions, message="AI suggestions retrieved successfully")

    @staticmethod
    def accept_suggestion(suggestion_id: str, validated_data: AcceptSuggestionRequest):
        user_id = get_jwt_identity()
        service = get_ai_service()
        result, error = service.accept_suggestion(
            user_id=user_id,
            suggestion_id=suggestion_id,
            modified_content=validated_data.modified_content,
        )
        if error:
            return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

        return success_response(
            data=result,
            message="AI suggestion accepted and applied to resume",
            status_code=200,
        )

    @staticmethod
    def reject_suggestion(suggestion_id: str):
        user_id = get_jwt_identity()
        service = get_ai_service()
        result, error = service.reject_suggestion(user_id, suggestion_id)
        if error:
            return error_response(message=error, status_code=404 if "not found" in error.lower() else 400)

        return success_response(
            data=result,
            message="AI suggestion rejected",
            status_code=200,
        )

