import io
import unittest
import pymupdf
from bson import ObjectId
from app import create_app
from app.database.connection import get_db, close_db


class FullStudentJourneyE2ETestCase(unittest.TestCase):
    """
    End-to-End integration test simulating the entire student user journey:
    1. Register & authenticate
    2. Maintain profile (personal info, education, skills, projects, experience)
    3. Create resume from scratch importing profile data
    4. Request AI summary enhancement with Gemini
    5. Accept AI suggestion and verify content update
    6. Save manual version snapshot (v1)
    7. Edit resume sections and switch template to ATS
    8. Save new version snapshot (v2)
    9. Download high-fidelity PDF and verify selectable text via Playwright
    10. Rollback to version 1 and verify new sequential active version (v3) created
    11. Import PDF resume via PyMuPDF + Gemini
    12. Duplicate resume
    13. Delete resume and confirm cascading cleanup
    """

    @classmethod
    def setUpClass(cls):
        cls.app = create_app("development")
        cls.client = cls.app.test_client()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.users.delete_many({"email": {"$regex": "@e2e-journey.com$"}})
        cls.db.resumes.delete_many({"title": {"$regex": "E2E"}})
        cls.db.resume_versions.delete_many({})
        cls.db.ai_suggestions.delete_many({})
        close_db()

    def test_full_student_journey_workflow(self):
        # ---------------------------------------------------------
        # STEP 1: Registration and Authentication
        # ---------------------------------------------------------
        user_email = "alex.student@e2e-journey.com"
        reg_res = self.client.post(
            "/api/auth/register",
            json={
                "email": user_email,
                "password": "SecurePassword123!",
                "full_name": "Alex Mercer",
            },
        )
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()["data"]
        access_token = reg_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Verify /api/auth/me
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["data"]["email"], user_email)

        # ---------------------------------------------------------
        # STEP 2: Setup Reusable Profile
        # ---------------------------------------------------------
        profile_payload = {
            "personal_info": {
                "full_name": "Alex Mercer",
                "email": user_email,
                "phone": "+1-555-0144",
                "city": "Seattle",
                "state": "WA",
                "country": "USA",
                "linkedin_url": "https://linkedin.com/in/alexmercer",
                "github_url": "https://github.com/alexmercer",
            },
            "education": [
                {
                    "id": "EDU_P1",
                    "degree": "B.S. Software Engineering",
                    "field_of_study": "Software Engineering",
                    "institution": "University of Washington",
                    "start_year": "2020",
                    "end_year": "2024",
                    "grade_type": "GPA",
                    "grade": "3.88",
                    "description": "Graduated Magna Cum Laude",
                }
            ],
            "skills": [
                {
                    "id": "SKILL_P1",
                    "category": "Programming Languages",
                    "items": ["Python", "JavaScript", "TypeScript", "SQL"],
                },
                {
                    "id": "SKILL_P2",
                    "category": "Frameworks",
                    "items": ["React", "Flask", "Node.js"],
                },
            ],
            "projects": [
                {
                    "id": "PROJ_P1",
                    "name": "Cloud Observability Platform",
                    "description": "Real-time metrics aggregator.",
                    "technologies": ["Python", "Flask", "Docker"],
                    "role": "Lead Backend Developer",
                    "start_date": "01/2024",
                    "end_date": "05/2024",
                    "github_url": "https://github.com/alexmercer/observability",
                    "key_contributions": ["Designed telemetry ingest pipeline"],
                    "personally_implemented_features": ["Batch buffer with redis"],
                }
            ],
            "work_experience": [],
            "internships": [],
            "certifications": [],
        }

        prof_res = self.client.put("/api/profile", headers=headers, json=profile_payload)
        self.assertEqual(prof_res.status_code, 200)
        self.assertEqual(prof_res.get_json()["data"]["personal_info"]["city"], "Seattle")

        # ---------------------------------------------------------
        # STEP 3: Create Resume from Scratch importing Profile Data
        # ---------------------------------------------------------
        create_res = self.client.post(
            "/api/resumes",
            headers=headers,
            json={
                "title": "E2E Software Engineer Resume",
                "target_role": "Backend Engineer",
                "template": "modern",
                "import_from_profile": True,
            },
        )
        self.assertEqual(create_res.status_code, 201)
        resume_data = create_res.get_json()["data"]
        resume_id = resume_data["id"]

        # Verify cloned profile data exists independently in resume
        self.assertEqual(resume_data["content"]["personal_info"]["full_name"], "Alex Mercer")
        self.assertEqual(resume_data["content"]["education"][0]["institution"], "University of Washington")
        self.assertEqual(len(resume_data["content"]["skills"]), 2)

        # ---------------------------------------------------------
        # STEP 4: Request AI Summary Enhancement (Gemini API)
        # ---------------------------------------------------------
        ai_res = self.client.post(
            "/api/ai/generate-summary",
            headers=headers,
            json={
                "resume_id": resume_id,
                "original_content": "CS graduate seeking backend engineering job.",
                "target_role": "Backend Engineer",
                "experience_level": "Entry Level",
            },
        )
        self.assertEqual(ai_res.status_code, 200)
        ai_suggestion = ai_res.get_json()["data"]
        suggestion_id = ai_suggestion["id"]
        self.assertEqual(ai_suggestion["status"], "pending")
        self.assertGreater(len(ai_suggestion["suggested_content"]), 10)

        # ---------------------------------------------------------
        # STEP 5: Accept AI Suggestion and Verify Resume Content Updated
        # ---------------------------------------------------------
        accept_res = self.client.post(
            f"/api/ai/suggestions/{suggestion_id}/accept",
            headers=headers,
            json={},
        )
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.get_json()["data"]["suggestion"]["status"], "accepted")

        # Verify resume content updated
        updated_resume = self.db.resumes.find_one({"_id": ObjectId(resume_id)})
        self.assertEqual(
            updated_resume["content"]["professional_summary"]["content"],
            ai_suggestion["suggested_content"],
        )

        # ---------------------------------------------------------
        # STEP 6: Save Version 1 Snapshot
        # ---------------------------------------------------------
        v1_res = self.client.post(
            f"/api/resumes/{resume_id}/versions",
            headers=headers,
            json={"change_summary": "Initial draft with AI summary"},
        )
        self.assertEqual(v1_res.status_code, 201)
        v1_data = v1_res.get_json()["data"]
        v1_id = v1_data["id"]
        self.assertEqual(v1_data["version_number"], 1)

        # ---------------------------------------------------------
        # STEP 7: Edit Resume & Switch Template to ATS
        # ---------------------------------------------------------
        content_mod = updated_resume["content"]
        content_mod["professional_summary"]["content"] = "Tailored summary for high-scale enterprise backend."
        put_res = self.client.put(
            f"/api/resumes/{resume_id}",
            headers=headers,
            json={
                "template": "ats",
                "content": content_mod,
            },
        )
        self.assertEqual(put_res.status_code, 200)

        # ---------------------------------------------------------
        # STEP 8: Save Version 2 Snapshot
        # ---------------------------------------------------------
        v2_res = self.client.post(
            f"/api/resumes/{resume_id}/versions",
            headers=headers,
            json={"change_summary": "Switched to ATS template and refined summary"},
        )
        self.assertEqual(v2_res.status_code, 201)
        self.assertEqual(v2_res.get_json()["data"]["version_number"], 2)

        # ---------------------------------------------------------
        # STEP 9: Generate and Download PDF (Playwright)
        # ---------------------------------------------------------
        pdf_res = self.client.get(f"/api/resumes/{resume_id}/pdf", headers=headers)
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.mimetype, "application/pdf")
        pdf_bytes = pdf_res.data
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))

        # Verify selectable text and metadata
        pdf_doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        self.assertGreaterEqual(pdf_doc.page_count, 1)
        extracted = pdf_doc[0].get_text()
        self.assertIn("ALEX MERCER", extracted.upper())
        self.assertIn("University of Washington", extracted)
        self.assertEqual(pdf_doc.metadata["author"], "Alex Mercer")
        self.assertEqual(pdf_doc.metadata["creator"], "CareerAI Resume Builder")
        pdf_doc.close()

        # ---------------------------------------------------------
        # STEP 10: Rollback to Version 1 (Verify new Version 3 snapshot)
        # ---------------------------------------------------------
        restore_res = self.client.post(
            f"/api/resumes/{resume_id}/versions/{v1_id}/restore",
            headers=headers,
        )
        self.assertEqual(restore_res.status_code, 200)
        restore_data = restore_res.get_json()["data"]

        # Confirm new snapshot Version 3 created
        self.assertEqual(restore_data["restored_snapshot"]["version_number"], 3)
        self.assertIn("Restored from Version 1", restore_data["restored_snapshot"]["change_summary"])
        # Confirm active resume has v1 summary content restored
        self.assertEqual(
            restore_data["active_resume"]["content"]["professional_summary"]["content"],
            ai_suggestion["suggested_content"],
        )
        self.assertEqual(restore_data["active_resume"]["current_version"], 3)

        # Confirm 3 historical versions preserved in database
        self.assertEqual(
            self.db.resume_versions.count_documents({"resume_id": resume_id}),
            3,
        )

        # ---------------------------------------------------------
        # STEP 11: Import PDF Resume (PyMuPDF + Gemini)
        # ---------------------------------------------------------
        import_pdf_doc = pymupdf.open()
        import_page = import_pdf_doc.new_page()
        import_text = """
Jordan Vance
Austin, TX | jordan.vance@example.com | (512) 555-0182
github.com/jordanvance | linkedin.com/in/jordanvance

SUMMARY
Passionate Full-Stack Developer with experience in React and Node.js.

EDUCATION
University of Texas at Austin
Bachelor of Science in Computer Science | 2021 - 2025

TECHNICAL SKILLS
- Languages: JavaScript, Python, TypeScript
- Frameworks: React, Express, FastAPI

PROJECTS
Task Orchestrator | React, Node.js, MongoDB
- Built scalable Kanban task manager supporting real-time web socket collaboration.
"""
        import_page.insert_text((50, 50), import_text, fontsize=10)
        import_bytes = import_pdf_doc.tobytes()
        import_pdf_doc.close()

        import_res = self.client.post(
            "/api/resumes/import",
            headers=headers,
            data={"file": (io.BytesIO(import_bytes), "jordan_vance_resume.pdf")},
            content_type="multipart/form-data",
        )
        self.assertEqual(import_res.status_code, 201)
        imported_resume = import_res.get_json()["data"]
        self.assertEqual(imported_resume["content"]["personal_info"]["full_name"], "Jordan Vance")
        self.assertEqual(imported_resume["status"], "draft")
        imported_id = imported_resume["id"]

        # ---------------------------------------------------------
        # STEP 12: Duplicate Resume
        # ---------------------------------------------------------
        dup_res = self.client.post(f"/api/resumes/{imported_id}/duplicate", headers=headers)
        self.assertEqual(dup_res.status_code, 201)
        dup_data = dup_res.get_json()["data"]
        self.assertIn("(Copy)", dup_data["title"])
        dup_id = dup_data["id"]

        # ---------------------------------------------------------
        # STEP 13: Delete Resume & Verify Cascading Cleanup
        # ---------------------------------------------------------
        del_res = self.client.delete(f"/api/resumes/{resume_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)

        # Verify resume deleted
        self.assertIsNone(self.db.resumes.find_one({"_id": ObjectId(resume_id)}))
        # Verify cascading cleanup
        self.assertEqual(self.db.resume_versions.count_documents({"resume_id": resume_id}), 0)
        self.assertEqual(self.db.ai_suggestions.count_documents({"resume_id": resume_id}), 0)

        # Clean up remaining created test resumes
        self.client.delete(f"/api/resumes/{imported_id}", headers=headers)
        self.client.delete(f"/api/resumes/{dup_id}", headers=headers)


if __name__ == "__main__":
    unittest.main()
