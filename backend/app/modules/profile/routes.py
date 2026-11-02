from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import ProfileUpdateRequest
from .controller import ProfileController

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_bp.route("", methods=["GET"])
@jwt_required()
def get_profile():
    return ProfileController.get_profile()


@profile_bp.route("", methods=["PUT"])
@jwt_required()
@validate_schema(ProfileUpdateRequest)
def update_profile(validated_data: ProfileUpdateRequest):
    return ProfileController.update_profile(validated_data)

