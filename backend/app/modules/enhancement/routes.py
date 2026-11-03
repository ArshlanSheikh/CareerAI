from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import GenerateEnhancementRequest, ApplyEnhancementRequest
from .controller import EnhancementController

enhancement_bp = Blueprint("enhancement", __name__, url_prefix="/api/enhancement")


@enhancement_bp.route("/resume/<resume_id>/generate", methods=["POST"])
@jwt_required()
def generate_enhancement(resume_id: str):
    json_data = request.get_json(silent=True) or {}
    req = GenerateEnhancementRequest(**json_data)
    return EnhancementController.generate_enhancement(resume_id, req)


@enhancement_bp.route("/resume/<resume_id>/latest", methods=["GET"])
@jwt_required()
def get_latest_for_resume(resume_id: str):
    return EnhancementController.get_latest_for_resume(resume_id)


@enhancement_bp.route("/<enhancement_id>", methods=["GET"])
@jwt_required()
def get_enhancement(enhancement_id: str):
    return EnhancementController.get_enhancement(enhancement_id)


@enhancement_bp.route("/resume/<resume_id>/apply", methods=["POST"])
@jwt_required()
def apply_enhancement(resume_id: str):
    json_data = request.get_json(silent=True) or {}
    req = ApplyEnhancementRequest(**json_data)
    return EnhancementController.apply_enhancement(resume_id, req)

