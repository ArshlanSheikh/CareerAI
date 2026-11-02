from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import ProfileService
from .schemas import ProfileUpdateRequest


class ProfileController:
    @staticmethod
    def get_profile():
        user_id = get_jwt_identity()
        if not user_id:
            return error_response(message="Unauthorized request", status_code=401)

        profile = ProfileService.get_or_create_profile(user_id)
        return success_response(
            data=profile,
            message="Student profile retrieved successfully",
            status_code=200,
        )

    @staticmethod
    def update_profile(validated_data: ProfileUpdateRequest):
        user_id = get_jwt_identity()
        if not user_id:
            return error_response(message="Unauthorized request", status_code=401)

        update_dict = validated_data.model_dump(exclude_unset=True)
        updated_profile = ProfileService.update_profile(user_id, update_dict)

        return success_response(
            data=updated_profile,
            message="Student profile updated successfully",
            status_code=200,
        )

