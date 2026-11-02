from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import AuthService
from .schemas import RegisterRequest, LoginRequest


class AuthController:
    @staticmethod
    def register(validated_data: RegisterRequest):
        result, error = AuthService.register(
            email=validated_data.email,
            password=validated_data.password,
            full_name=validated_data.full_name,
        )
        if error:
            status_code = 409 if "already exists" in error.lower() else 400
            return error_response(message=error, status_code=status_code)

        return success_response(
            data=result,
            message="Student account created successfully",
            status_code=201,
        )

    @staticmethod
    def login(validated_data: LoginRequest):
        result, error = AuthService.login(
            email=validated_data.email,
            password=validated_data.password,
        )
        if error:
            return error_response(message=error, status_code=401)

        return success_response(
            data=result,
            message="Login successful",
            status_code=200,
        )

    @staticmethod
    def refresh():
        user_id = get_jwt_identity()
        result, error = AuthService.refresh_access_token(user_id)
        if error:
            return error_response(message=error, status_code=401)

        return success_response(
            data=result,
            message="Access token refreshed successfully",
            status_code=200,
        )

    @staticmethod
    def me():
        user_id = get_jwt_identity()
        result, error = AuthService.get_current_user(user_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=result,
            message="User profile retrieved successfully",
            status_code=200,
        )

    @staticmethod
    def logout():
        return success_response(
            message="User session ended successfully",
            status_code=200,
        )

