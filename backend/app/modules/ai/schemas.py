from pydantic import BaseModel, Field
from typing import Optional, List, Any


class SummaryAiRequest(BaseModel):
    resume_id: str
    original_content: Optional[str] = ""
    target_role: Optional[str] = ""
    experience_level: Optional[str] = "Entry Level / Student"
    custom_instructions: Optional[str] = ""


class ProjectAiRequest(BaseModel):
    resume_id: str
    project_id: str
    project_name: str
    technologies: List[str] = Field(default_factory=list)
    original_description: Optional[str] = ""
    key_contributions: List[str] = Field(default_factory=list)
    personally_implemented_features: List[str] = Field(default_factory=list)
    custom_instructions: Optional[str] = ""


class ExperienceAiRequest(BaseModel):
    resume_id: str
    experience_id: str
    company_name: str
    job_title: str
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    custom_instructions: Optional[str] = ""


class InternshipAiRequest(BaseModel):
    resume_id: str
    internship_id: str
    organization: str
    position: str
    responsibilities: List[str] = Field(default_factory=list)
    skills_learned: List[str] = Field(default_factory=list)
    custom_instructions: Optional[str] = ""


class SkillsAiRequest(BaseModel):
    resume_id: str
    target_role: Optional[str] = ""


class AcceptSuggestionRequest(BaseModel):
    modified_content: Optional[Any] = None

