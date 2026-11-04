from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import AnalysisService
from .schemas import AnalyzeResumeRequest


class AnalysisController:
    @staticmethod
    def analyze_resume(resume_id: str, validated_data: AnalyzeResumeRequest = None):
        user_id = get_jwt_identity()
        target_role = validated_data.target_role if validated_data else ""

        service = AnalysisService()
        analysis, err = service.analyze_resume(user_id, resume_id, target_role)
        if err:
            return error_response(message=err, status_code=400 if "not found" in err.lower() else 500)

        return success_response(
            data=analysis,
            message="Resume analyzed successfully",
            status_code=201,
        )

    @staticmethod
    def get_analysis(analysis_id: str):
        user_id = get_jwt_identity()
        service = AnalysisService()
        analysis, err = service.get_analysis(user_id, analysis_id)
        if err:
            return error_response(message=err, status_code=404)

        return success_response(data=analysis, message="Analysis retrieved successfully")

    @staticmethod
    def get_latest_for_resume(resume_id: str):
        user_id = get_jwt_identity()
        service = AnalysisService()
        analysis, err = service.get_latest_analysis_for_resume(user_id, resume_id)
        if err:
            if "not found" in err.lower():
                return success_response(data=None, message="No previous analysis found")
            return error_response(message=err, status_code=400)

        return success_response(data=analysis, message="Latest analysis retrieved successfully")

    @staticmethod
    def list_for_resume(resume_id: str):
        user_id = get_jwt_identity()
        service = AnalysisService()
        analyses, err = service.list_analyses_for_resume(user_id, resume_id)
        if err:
            return error_response(message=err, status_code=400)

        return success_response(data=analyses, message="Analysis history retrieved successfully")

