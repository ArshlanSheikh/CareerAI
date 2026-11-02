from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import VersionService
from .schemas import CreateVersionRequest


class VersionController:
    @staticmethod
    def list_versions(resume_id: str):
        user_id = get_jwt_identity()
        versions, error = VersionService.list_versions(user_id, resume_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=versions,
            message="Resume versions retrieved successfully",
            status_code=200,
        )

    @staticmethod
    def create_version(resume_id: str, validated_data: CreateVersionRequest):
        user_id = get_jwt_identity()
        note = validated_data.change_summary if validated_data else ""
        snapshot, error = VersionService.create_version(user_id, resume_id, note)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=snapshot,
            message="Resume version snapshot created successfully",
            status_code=201,
        )

    @staticmethod
    def get_version(resume_id: str, version_id: str):
        user_id = get_jwt_identity()
        version, error = VersionService.get_version(user_id, resume_id, version_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=version,
            message="Version details retrieved successfully",
            status_code=200,
        )

    @staticmethod
    def restore_version(resume_id: str, version_id: str):
        user_id = get_jwt_identity()
        result, error = VersionService.restore_version(user_id, resume_id, version_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=result,
            message=f"Resume restored successfully to version {result['active_resume']['current_version']}",
            status_code=200,
        )

