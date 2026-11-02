import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

_mongo_client = None
_db = None


def init_db(app):
    """
    Initializes the PyMongo client and ensures required collections and indexes exist.
    """
    global _mongo_client, _db
    mongo_uri = app.config.get("MONGO_URI", "mongodb://localhost:27017/careerai")
    db_name = app.config.get("MONGO_DB_NAME", "careerai")

    try:
        if _mongo_client is None:
            _mongo_client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
            )
        _db = _mongo_client[db_name]

        # Verify connection
        _mongo_client.admin.command("ping")
        logger.info(f"Connected to MongoDB successfully! Database: {db_name}")

        create_indexes(_db)

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.warning(f"Could not connect to MongoDB at {mongo_uri}: {e}. Ensure MongoDB is running.")
    except Exception as e:
        logger.error(f"Unexpected MongoDB initialization error: {e}")

    return _db


def get_db():
    """
    Returns the current MongoDB database instance.
    """
    global _db
    if _db is None:
        raise RuntimeError("Database is not initialized. Call init_db(app) first.")
    return _db


def get_client():
    global _mongo_client
    return _mongo_client


def close_db():
    global _mongo_client, _db
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _db = None


def create_indexes(db):
    """
    Creates essential indexes on MongoDB collections.
    """
    try:
        # Users collection
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.users.create_index([("created_at", DESCENDING)])

        # Student Profiles collection
        db.student_profiles.create_index([("user_id", ASCENDING)], unique=True)

        # Resumes collection
        db.resumes.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])
        db.resumes.create_index([("user_id", ASCENDING), ("title", ASCENDING)])

        # Resume Versions collection
        db.resume_versions.create_index([("resume_id", ASCENDING), ("version_number", DESCENDING)])
        db.resume_versions.create_index([("user_id", ASCENDING)])

        # AI Suggestions collection
        db.ai_suggestions.create_index([("resume_id", ASCENDING)])
        db.ai_suggestions.create_index([("user_id", ASCENDING)])

        logger.info("MongoDB indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Index creation encountered an error: {e}")
