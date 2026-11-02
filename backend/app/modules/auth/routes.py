from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.common.decorators import validate_schema
from .schemas import RegisterRequest, LoginRequest
from .controller import AuthController

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
@validate_schema(RegisterRequest)
def register(validated_data: RegisterRequest):
    return AuthController.register(validated_data)


@auth_bp.route("/login", methods=["POST"])
@validate_schema(LoginRequest)
def login(validated_data: LoginRequest):
    return AuthController.login(validated_data)


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    return AuthController.refresh()


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    return AuthController.me()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return AuthController.logout()

