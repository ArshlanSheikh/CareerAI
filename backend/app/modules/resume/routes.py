from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import CreateResumeRequest, UpdateResumeRequest
from .controller import ResumeController

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resumes")


@resume_bp.route("", methods=["POST"])
@jwt_required()
@validate_schema(CreateResumeRequest)
def create_resume(validated_data: CreateResumeRequest):
    return ResumeController.create_resume(validated_data)


@resume_bp.route("", methods=["GET"])
@jwt_required()
def list_resumes():
    return ResumeController.list_resumes()


@resume_bp.route("/<resume_id>", methods=["GET"])
@jwt_required()
def get_resume(resume_id: str):
    return ResumeController.get_resume(resume_id)


@resume_bp.route("/<resume_id>", methods=["PUT"])
@jwt_required()
@validate_schema(UpdateResumeRequest)
def update_resume(resume_id: str, validated_data: UpdateResumeRequest):
    return ResumeController.update_resume(resume_id, validated_data)


@resume_bp.route("/<resume_id>/duplicate", methods=["POST"])
@jwt_required()
def duplicate_resume(resume_id: str):
    return ResumeController.duplicate_resume(resume_id)


@resume_bp.route("/<resume_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(resume_id: str):
    return ResumeController.delete_resume(resume_id)


@resume_bp.route("/import", methods=["POST"])
@jwt_required()
def import_resume():
    return ResumeController.import_resume()


@resume_bp.route("/extract-preview", methods=["POST"])
@jwt_required()
def extract_preview():
    return ResumeController.extract_preview()


@resume_bp.route("/<resume_id>/pdf", methods=["GET"])
@jwt_required()
def download_pdf(resume_id: str):
    return ResumeController.download_pdf(resume_id)

