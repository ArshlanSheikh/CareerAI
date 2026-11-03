from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import AnalyzeResumeRequest
from .controller import AnalysisController

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/analysis")


@analysis_bp.route("/resume/<resume_id>", methods=["POST"])
@jwt_required()
def analyze_resume(resume_id: str):
    # Support optional JSON body
    json_data = request.get_json(silent=True) or {}
    req = AnalyzeResumeRequest(**json_data)
    return AnalysisController.analyze_resume(resume_id, req)


@analysis_bp.route("/<analysis_id>", methods=["GET"])
@jwt_required()
def get_analysis(analysis_id: str):
    return AnalysisController.get_analysis(analysis_id)


@analysis_bp.route("/resume/<resume_id>/latest", methods=["GET"])
@jwt_required()
def get_latest_for_resume(resume_id: str):
    return AnalysisController.get_latest_for_resume(resume_id)


@analysis_bp.route("/resume/<resume_id>/history", methods=["GET"])
@jwt_required()
def list_for_resume(resume_id: str):
    return AnalysisController.list_for_resume(resume_id)

