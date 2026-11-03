import logging
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from .config import config_by_name
from .database.connection import init_db, get_db
from .common.responses import error_response, success_response

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
)
logger = logging.getLogger(__name__)

jwt = JWTManager()


def create_app(config_name=None):
    """
    Application Factory for CareerAI Flask Backend.
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app_config = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(app_config)

    # Initialize CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Initialize JWT Manager
    jwt.init_app(app)

    # JWT Error handlers
    @jwt.unauthorized_loader
    def custom_unauthorized_response(callback):
        return error_response(
            message="Authorization token is missing or malformed",
            errors=[{"field": "Authorization", "message": callback}],
            status_code=401,
        )

    @jwt.expired_token_loader
    def custom_expired_token_response(jwt_header, jwt_payload):
        return error_response(
            message="Token has expired. Please refresh your token or log in again.",
            errors=[{"token_type": jwt_payload.get("type", "access"), "code": "token_expired"}],
            status_code=401,
        )

    @jwt.invalid_token_loader
    def custom_invalid_token_response(callback):
        return error_response(
            message="Invalid authorization token",
            errors=[{"field": "Authorization", "message": callback}],
            status_code=401,
        )

    # Initialize Database
    init_db(app)

    # Global HTTP and Exception Handlers
    @app.errorhandler(404)
    def handle_404(e):
        return error_response(
            message="Requested resource not found",
            errors=[{"path": request.path, "method": request.method}],
            status_code=404,
        )

    @app.errorhandler(405)
    def handle_405(e):
        return error_response(
            message="Method not allowed for this endpoint",
            errors=[{"path": request.path, "method": request.method}],
            status_code=405,
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return error_response(
            message=e.description,
            errors=[{"code": e.code, "name": e.name}],
            status_code=e.code,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e):
        logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return error_response(
            message="Internal server error occurred",
            errors=[{"details": str(e) if app.debug else "An unexpected error occurred."}],
            status_code=500,
        )

    # Base Health Check Route
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_status = "connected"
        try:
            db = get_db()
            db.command("ping")
        except Exception as ex:
            db_status = f"disconnected: {str(ex)}"

        return success_response(
            data={
                "status": "healthy",
                "service": "CareerAI Backend API",
                "version": "1.0.0",
                "database": db_status,
                "environment": app_config.ENV,
            },
            message="CareerAI API service is running",
        )

    # Register Blueprints
    from .modules.auth.routes import auth_bp
    from .modules.profile.routes import profile_bp
    from .modules.resume.routes import resume_bp
    from .modules.ai.routes import ai_bp
    from .modules.versions.routes import versions_bp
    from .modules.analysis.routes import analysis_bp
    from .modules.enhancement.routes import enhancement_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(versions_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(enhancement_bp)

    return app

