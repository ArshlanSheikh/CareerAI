from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalyzeResumeRequest(BaseModel):
    target_role: Optional[str] = ""


class SectionScoreSummary(BaseModel):
    score: int = Field(default=70, ge=0, le=100)
    feedback: str = ""
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class SectionScoreSkills(BaseModel):
    score: int = Field(default=75, ge=0, le=100)
    feedback: str = ""
    found_skills: List[str] = Field(default_factory=list)
    recommended_keywords: List[str] = Field(default_factory=list)


class SectionScoreEducation(BaseModel):
    score: int = Field(default=80, ge=0, le=100)
    feedback: str = ""
    status: str = "Complete"


class SectionScoreProjects(BaseModel):
    score: int = Field(default=70, ge=0, le=100)
    feedback: str = ""
    tech_depth_score: int = Field(default=70, ge=0, le=100)
    impact_score: int = Field(default=70, ge=0, le=100)


class SectionScoreExperience(BaseModel):
    score: int = Field(default=70, ge=0, le=100)
    feedback: str = ""
    action_verbs_score: int = Field(default=70, ge=0, le=100)
    quantification_score: int = Field(default=65, ge=0, le=100)


class SectionScores(BaseModel):
    summary: Optional[SectionScoreSummary] = None
    skills: Optional[SectionScoreSkills] = None
    education: Optional[SectionScoreEducation] = None
    projects: Optional[SectionScoreProjects] = None
    experience: Optional[SectionScoreExperience] = None


class QualityDimension(BaseModel):
    dimension: str
    score: int = Field(ge=0, le=100)
    benchmark: int = Field(default=80, ge=0, le=100)


class StrengthItem(BaseModel):
    title: str
    description: str
    section: Optional[str] = "general"


class WeaknessItem(BaseModel):
    title: str
    description: str
    severity: str = "warning"  # "critical", "warning", "suggestion"
    section: Optional[str] = "general"


class ActionableRecommendation(BaseModel):
    id: str
    title: str
    description: str
    section: str = "general"
    priority: str = "medium"  # "high", "medium", "low"
    estimated_score_boost: int = Field(default=5, ge=1, le=25)


class ResumeAnalysisModel(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    ats_compatibility_score: int = Field(ge=0, le=100)
    content_quality_score: int = Field(default=75, ge=0, le=100)
    readability_score: int = Field(default=80, ge=0, le=100)
    summary_score: int = Field(default=70, ge=0, le=100)
    skills_score: int = Field(default=75, ge=0, le=100)
    education_score: int = Field(default=80, ge=0, le=100)
    projects_score: int = Field(default=70, ge=0, le=100)
    experience_score: int = Field(default=70, ge=0, le=100)
    section_scores: SectionScores
    quality_dimensions: List[QualityDimension] = Field(default_factory=list)
    strengths: List[StrengthItem] = Field(default_factory=list)
    weaknesses: List[WeaknessItem] = Field(default_factory=list)
    actionable_recommendations: List[ActionableRecommendation] = Field(default_factory=list)
    disclaimer: str = (
        "ATS compatibility score is an estimation based on layout readability and keyword alignment. "
        "It is not a guarantee of passing automated screening or job selection."
    )

