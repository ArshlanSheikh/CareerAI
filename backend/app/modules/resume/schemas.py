from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List

VALID_TEMPLATES = ["modern", "ats", "traditional"]
VALID_STATUSES = ["draft", "completed"]

DEFAULT_SECTION_ORDER = [
    "summary",
    "education",
    "skills",
    "projects",
    "experience",
    "internships",
    "certifications",
    "additional",
]


class PersonalInfoSchema(BaseModel):
    full_name: str = Field("", description="Full name")
    email: str = Field("", description="Primary contact email")
    phone: str = Field("", description="Phone number")
    city: str = Field("", description="City")
    state: str = Field("", description="State or province")
    country: str = Field("", description="Country")
    linkedin_url: str = Field("", description="LinkedIn URL")
    github_url: str = Field("", description="GitHub URL")
    portfolio_url: str = Field("", description="Portfolio URL")
    profile_image: str = Field("", description="Profile image")


class SummarySchema(BaseModel):
    content: str = Field("", description="Summary text")
    target_role: str = Field("", description="Target role")
    experience_level: str = Field("Entry Level / Student", description="Experience level")


class EducationRecordSchema(BaseModel):
    id: str = Field(..., description="Unique education ID")
    degree: str = Field("", description="Degree name")
    field_of_study: str = Field("", description="Major / Field of study")
    institution: str = Field("", description="College / University")
    start_year: str = Field("", description="Start year")
    end_year: str = Field("", description="End year or Expected")
    grade_type: str = Field("GPA", description="GPA or %")
    grade: str = Field("", description="Grade value")
    description: str = Field("", description="Honors, coursework")


class SkillCategorySchema(BaseModel):
    id: str = Field(..., description="Unique skill category ID")
    category: str = Field(..., description="Category title")
    items: List[str] = Field(default_factory=list, description="Skill item names")


class ProjectRecordSchema(BaseModel):
    id: str = Field(..., description="Unique project ID")
    name: str = Field(..., description="Project name")
    description: str = Field("", description="Description")
    technologies: List[str] = Field(default_factory=list, description="Tech stack")
    role: str = Field("", description="Role in project")
    start_date: str = Field("", description="Start date")
    end_date: str = Field("", description="End date")
    github_url: str = Field("", description="GitHub link")
    live_url: str = Field("", description="Demo link")
    key_contributions: List[str] = Field(default_factory=list, description="Key contributions")
    personally_implemented_features: List[str] = Field(default_factory=list, description="Implemented features")


class ExperienceRecordSchema(BaseModel):
    id: str = Field(..., description="Unique experience ID")
    company_name: str = Field(..., description="Company name")
    job_title: str = Field(..., description="Job title")
    employment_type: str = Field("Full-time", description="Employment type")
    location: str = Field("", description="Location")
    start_date: str = Field("", description="Start date")
    end_date: str = Field("", description="End date")
    is_current: bool = Field(False, description="Whether currently working")
    responsibilities: List[str] = Field(default_factory=list, description="Responsibilities")
    achievements: List[str] = Field(default_factory=list, description="Achievements")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")


class InternshipRecordSchema(BaseModel):
    id: str = Field(..., description="Unique internship ID")
    organization: str = Field(..., description="Organization")
    position: str = Field(..., description="Position")
    start_date: str = Field("", description="Start date")
    end_date: str = Field("", description="End date")
    responsibilities: List[str] = Field(default_factory=list, description="Responsibilities")
    skills_learned: List[str] = Field(default_factory=list, description="Skills learned")
    projects_completed: List[str] = Field(default_factory=list, description="Projects completed")


class CertificationRecordSchema(BaseModel):
    id: str = Field(..., description="Unique certification ID")
    certification_name: str = Field(..., description="Certification name")
    issuing_organization: str = Field("", description="Issuer")
    issue_date: str = Field("", description="Date")
    credential_url: str = Field("", description="URL")


class AdditionalInfoSchema(BaseModel):
    awards: List[str] = Field(default_factory=list)
    hackathons: List[str] = Field(default_factory=list)
    publications: List[str] = Field(default_factory=list)
    volunteer_experience: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)


class StandardizedResumeContent(BaseModel):
    personal_info: PersonalInfoSchema = Field(default_factory=PersonalInfoSchema)
    professional_summary: SummarySchema = Field(default_factory=SummarySchema)
    education: List[EducationRecordSchema] = Field(default_factory=list)
    skills: List[SkillCategorySchema] = Field(default_factory=list)
    projects: List[ProjectRecordSchema] = Field(default_factory=list)
    work_experience: List[ExperienceRecordSchema] = Field(default_factory=list)
    internships: List[InternshipRecordSchema] = Field(default_factory=list)
    certifications: List[CertificationRecordSchema] = Field(default_factory=list)
    additional_info: AdditionalInfoSchema = Field(default_factory=AdditionalInfoSchema)
    section_order: List[str] = Field(default_factory=lambda: list(DEFAULT_SECTION_ORDER))
    hidden_sections: List[str] = Field(default_factory=list)


class CreateResumeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, description="Resume title")
    target_role: str = Field("", max_length=100, description="Target job role")
    template: str = Field("modern", description="Selected template: modern, ats, or traditional")
    import_from_profile: bool = Field(False, description="Whether to import initial data from student profile")

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Resume title cannot be empty")
        return clean

    @field_validator("template")
    @classmethod
    def validate_template(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in VALID_TEMPLATES:
            return "modern"
        return clean


class UpdateResumeRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    target_role: Optional[str] = Field(None, max_length=100)
    template: Optional[str] = Field(None)
    status: Optional[str] = Field(None)
    content: Optional[StandardizedResumeContent] = None

    @field_validator("template")
    @classmethod
    def validate_template(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().lower()
        return clean if clean in VALID_TEMPLATES else "modern"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().lower()
        return clean if clean in VALID_STATUSES else "draft"


class RenameResumeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Resume title cannot be empty")
        return clean
