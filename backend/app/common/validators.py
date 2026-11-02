import re
from bson import ObjectId


EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$")


def is_valid_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def is_valid_object_id(oid_str: str) -> bool:
    if not oid_str or not isinstance(oid_str, str):
        return False
    return ObjectId.is_valid(oid_str)

