from flask import jsonify
from bson import ObjectId
from datetime import datetime, date


def serialize_doc(doc):
    """
    Recursively converts MongoDB ObjectIds and datetimes in dicts/lists to JSON serializable types.
    """
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        serialized = {}
        for k, v in doc.items():
            if k == "_id" and isinstance(v, ObjectId):
                serialized["id"] = str(v)
            elif isinstance(v, ObjectId):
                serialized[k] = str(v)
            elif isinstance(v, (datetime, date)):
                serialized[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                serialized[k] = serialize_doc(v)
            else:
                serialized[k] = v
        return serialized
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc


def success_response(data=None, message="Success", status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": serialize_doc(data),
    }
    return jsonify(payload), status_code


def error_response(message="An error occurred", errors=None, status_code=400):
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else [],
    }
    return jsonify(payload), status_code

