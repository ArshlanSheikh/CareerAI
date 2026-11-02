from flask_jwt_extended import get_jwt_identity
from app.common.responses import success_response, error_response
from .service import ResumeService
from .schemas import CreateResumeRequest, UpdateResumeRequest


class ResumeController:
    @staticmethod
    def create_resume(validated_data: CreateResumeRequest):
        user_id = get_jwt_identity()
        data = ResumeService.create_resume(user_id, validated_data.model_dump())
        return success_response(
            data=data,
            message="Resume created successfully",
            status_code=201,
        )

    @staticmethod
    def list_resumes():
        user_id = get_jwt_identity()
        resumes = ResumeService.list_resumes(user_id)
        return success_response(
            data=resumes,
            message="Resumes fetched successfully",
            status_code=200,
        )

    @staticmethod
    def get_resume(resume_id: str):
        user_id = get_jwt_identity()
        resume, error = ResumeService.get_resume(user_id, resume_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=resume,
            message="Resume fetched successfully",
            status_code=200,
        )

    @staticmethod
    def update_resume(resume_id: str, validated_data: UpdateResumeRequest):
        user_id = get_jwt_identity()
        update_data = validated_data.model_dump(exclude_unset=True)
        updated, error = ResumeService.update_resume(user_id, resume_id, update_data)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=updated,
            message="Resume updated successfully",
            status_code=200,
        )

    @staticmethod
    def duplicate_resume(resume_id: str):
        user_id = get_jwt_identity()
        duplicated, error = ResumeService.duplicate_resume(user_id, resume_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            data=duplicated,
            message="Resume duplicated successfully",
            status_code=201,
        )

    @staticmethod
    def delete_resume(resume_id: str):
        user_id = get_jwt_identity()
        success, error = ResumeService.delete_resume(user_id, resume_id)
        if error:
            return error_response(message=error, status_code=404)

        return success_response(
            message="Resume deleted successfully",
            status_code=200,
        )

    @staticmethod
    def import_resume():
        from flask import request
        user_id = get_jwt_identity()

        if "file" not in request.files:
            return error_response(message="No file part in upload request", status_code=400)

        file = request.files["file"]
        if not file or file.filename == "":
            return error_response(message="No file selected for import", status_code=400)

        filename = file.filename
        if not filename.lower().endswith(".pdf"):
            return error_response(message="Only PDF files are supported for resume import", status_code=400)

        file_bytes = file.read()
        if len(file_bytes) == 0:
            return error_response(message="The uploaded PDF file is empty", status_code=400)

        if len(file_bytes) > 10 * 1024 * 1024:
            return error_response(message="File size exceeds maximum allowed 10MB limit", status_code=400)

        try:
            resume, err = ResumeService.import_from_pdf(user_id, file_bytes, filename)
            if err:
                return error_response(message=err, status_code=400)
            return success_response(
                data=resume,
                message="Resume imported and structured successfully",
                status_code=201,
            )
        except ValueError as ve:
            return error_response(message=str(ve), status_code=422)
        except Exception as e:
            return error_response(message=f"Failed to import resume: {str(e)}", status_code=500)

    @staticmethod
    def download_pdf(resume_id: str):
        from flask import send_file
        import io

        user_id = get_jwt_identity()
        try:
            pdf_bytes, filename, error = ResumeService.generate_resume_pdf(user_id, resume_id)
            if error:
                return error_response(message=error, status_code=404)

            return send_file(
                io.BytesIO(pdf_bytes),
                mimetype="application/pdf",
                as_attachment=True,
                download_name=filename,
            )
        except Exception as e:
            return error_response(message=f"PDF generation failed: {str(e)}", status_code=500)

