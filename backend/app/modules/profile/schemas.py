from pydantic import BaseModel, Field
from typing import List, Optional


class PersonalInfoSchema(BaseModel):
    full_name: str = Field("", description="Full name")
    email: str = Field("", description="Primary contact email")
    phone: str = Field("", description="Contact phone number")
    city: str = Field("", description="City of residence")
    state: str = Field("", description="State or province")
    country: str = Field("", description="Country")
    linkedin_url: str = Field("", description="LinkedIn profile URL")
    github_url: str = Field("", description="GitHub profile URL")
    portfolio_url: str = Field("", description="Portfolio website URL")
    profile_image: str = Field("", description="Profile image URL or base64")


class EducationRecordSchema(BaseModel):
    id: str = Field(..., description="Unique record ID")
    degree: str = Field("", description="Degree name, e.g. B.Tech, B.S.")
    field_of_study: str = Field("", description="Major/Field of study, e.g. Computer Science")
    institution: str = Field("", description="College / University name")
    start_year: str = Field("", description="Start year")
    end_year: str = Field("", description="End year or Expected Graduation")
    grade_type: str = Field("GPA", description="GPA, CGPA, or Percentage")
    grade: str = Field("", description="Numeric grade value, e.g. 3.8/4.0 or 85%")
    description: str = Field("", description="Honors, relevant coursework, achievements")


class SkillCategorySchema(BaseModel):
    id: str = Field(..., description="Unique category ID")
    category: str = Field(..., description="Category name, e.g. Frontend Technologies")
    items: List[str] = Field(default_factory=list, description="List of skills in this category")


class ProjectRecordSchema(BaseModel):
    id: str = Field(..., description="Unique project ID")
    name: str = Field(..., description="Project name")
    description: str = Field("", description="Overview of the project")
    technologies: List[str] = Field(default_factory=list, description="Technologies and libraries used")
    role: str = Field("", description="Role in the project, e.g. Full-Stack Lead")
    start_date: str = Field("", description="Start date (MM/YYYY)")
    end_date: str = Field("", description="End date (MM/YYYY) or Present")
    github_url: str = Field("", description="Repository link")
    live_url: str = Field("", description="Live demo link")
    key_contributions: List[str] = Field(default_factory=list, description="Key accomplishments or features")
    personally_implemented_features: List[str] = Field(default_factory=list, description="Features personally developed")


class ExperienceRecordSchema(BaseModel):
    id: str = Field(..., description="Unique experience ID")
    company_name: str = Field(..., description="Company or organization name")
    job_title: str = Field(..., description="Job title, e.g. Software Engineer")
    employment_type: str = Field("Full-time", description="Full-time, Part-time, Contract")
    location: str = Field("", description="Location, e.g. San Francisco, CA or Remote")
    start_date: str = Field("", description="Start date")
    end_date: str = Field("", description="End date or Present")
    is_current: bool = Field(False, description="Whether currently working here")
    responsibilities: List[str] = Field(default_factory=list, description="Key duties and tasks")
    achievements: List[str] = Field(default_factory=list, description="Measurable accomplishments")
    technologies: List[str] = Field(default_factory=list, description="Tools and tech used")


class InternshipRecordSchema(BaseModel):
    id: str = Field(..., description="Unique internship ID")
    organization: str = Field(..., description="Internship company / organization")
    position: str = Field(..., description="Position or title")
    start_date: str = Field("", description="Start date")
    end_date: str = Field("", description="End date")
    responsibilities: List[str] = Field(default_factory=list, description="Responsibilities")
    skills_learned: List[str] = Field(default_factory=list, description="Skills gained")
    projects_completed: List[str] = Field(default_factory=list, description="Projects completed during internship")


class CertificationRecordSchema(BaseModel):
    id: str = Field(..., description="Unique certification ID")
    certification_name: str = Field(..., description="Certificate name")
    issuing_organization: str = Field("", description="Issuer, e.g. AWS, Coursera")
    issue_date: str = Field("", description="Date obtained")
    credential_url: str = Field("", description="Link to verified certificate")


class ProfileUpdateRequest(BaseModel):
    personal_info: Optional[PersonalInfoSchema] = None
    education: Optional[List[EducationRecordSchema]] = None
    skills: Optional[List[SkillCategorySchema]] = None
    projects: Optional[List[ProjectRecordSchema]] = None
    work_experience: Optional[List[ExperienceRecordSchema]] = None
    internships: Optional[List[InternshipRecordSchema]] = None
    certifications: Optional[List[CertificationRecordSchema]] = None

