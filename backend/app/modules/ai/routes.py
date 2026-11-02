from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import (
    SummaryAiRequest,
    ProjectAiRequest,
    ExperienceAiRequest,
    InternshipAiRequest,
    SkillsAiRequest,
    AcceptSuggestionRequest,
)
from .controller import AiController

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/generate-summary", methods=["POST"])
@jwt_required()
@validate_schema(SummaryAiRequest)
def generate_summary(validated_data: SummaryAiRequest):
    return AiController.generate_summary(validated_data)


@ai_bp.route("/improve-project", methods=["POST"])
@jwt_required()
@validate_schema(ProjectAiRequest)
def improve_project(validated_data: ProjectAiRequest):
    return AiController.improve_project(validated_data)


@ai_bp.route("/improve-experience", methods=["POST"])
@jwt_required()
@validate_schema(ExperienceAiRequest)
def improve_experience(validated_data: ExperienceAiRequest):
    return AiController.improve_experience(validated_data)


@ai_bp.route("/improve-internship", methods=["POST"])
@jwt_required()
@validate_schema(InternshipAiRequest)
def improve_internship(validated_data: InternshipAiRequest):
    return AiController.improve_internship(validated_data)


@ai_bp.route("/suggest-skills", methods=["POST"])
@jwt_required()
@validate_schema(SkillsAiRequest)
def suggest_skills(validated_data: SkillsAiRequest):
    return AiController.suggest_skills(validated_data)


@ai_bp.route("/suggestions/<resume_id>", methods=["GET"])
@jwt_required()
def get_suggestions(resume_id: str):
    return AiController.get_suggestions(resume_id)


@ai_bp.route("/suggestions/<suggestion_id>/accept", methods=["POST"])
@jwt_required()
@validate_schema(AcceptSuggestionRequest)
def accept_suggestion(suggestion_id: str, validated_data: AcceptSuggestionRequest):
    return AiController.accept_suggestion(suggestion_id, validated_data)


@ai_bp.route("/suggestions/<suggestion_id>/reject", methods=["POST"])
@jwt_required()
def reject_suggestion(suggestion_id: str):
    return AiController.reject_suggestion(suggestion_id)

