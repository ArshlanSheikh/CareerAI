from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import CreateVersionRequest
from .controller import VersionController

versions_bp = Blueprint("versions", __name__, url_prefix="/api/resumes/<resume_id>/versions")


@versions_bp.route("", methods=["GET"])
@jwt_required()
def list_versions(resume_id: str):
    return VersionController.list_versions(resume_id)


@versions_bp.route("", methods=["POST"])
@jwt_required()
@validate_schema(CreateVersionRequest)
def create_version(resume_id: str, validated_data: CreateVersionRequest):
    return VersionController.create_version(resume_id, validated_data)


@versions_bp.route("/<version_id>", methods=["GET"])
@jwt_required()
def get_version(resume_id: str, version_id: str):
    return VersionController.get_version(resume_id, version_id)


@versions_bp.route("/<version_id>/restore", methods=["POST"])
@jwt_required()
def restore_version(resume_id: str, version_id: str):
    return VersionController.restore_version(resume_id, version_id)

