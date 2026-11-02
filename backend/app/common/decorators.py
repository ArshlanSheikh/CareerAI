from functools import wraps
from flask import request
from pydantic import ValidationError
from .responses import error_response


def validate_schema(schema_cls):
    """
    Decorator to validate incoming JSON request payloads against a Pydantic schema model.
    Attaches validated pydantic model instance to request.validated_data and as a keyword argument.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return error_response(
                    message="Invalid request format: JSON body expected",
                    errors=[{"field": "body", "message": "Content-Type must be application/json"}],
                    status_code=400,
                )

            data = request.get_json(silent=True)
            if data is None:
                data = {}

            try:
                validated_model = schema_cls(**data)
            except ValidationError as ve:
                formatted_errors = []
                for err in ve.errors():
                    field_path = ".".join(str(loc) for loc in err.get("loc", []))
                    formatted_errors.append({
                        "field": field_path,
                        "message": err.get("msg", "Invalid value"),
                        "type": err.get("type", "value_error"),
                    })
                return error_response(
                    message="Validation error",
                    errors=formatted_errors,
                    status_code=422,
                )

            request.validated_data = validated_model
            return fn(*args, validated_data=validated_model, **kwargs)

        return wrapper
    return decorator

