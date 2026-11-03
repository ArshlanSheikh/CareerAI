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


class SectionScoreInternships(BaseModel):
    score: int = Field(default=75, ge=0, le=100)
    feedback: str = ""
    count: int = 0


class SectionScoreCertifications(BaseModel):
    score: int = Field(default=80, ge=0, le=100)
    feedback: str = ""
    count: int = 0


class SectionScoreAdditional(BaseModel):
    score: int = Field(default=75, ge=0, le=100)
    feedback: str = ""
    count: int = 0


class SectionScores(BaseModel):
    summary: Optional[SectionScoreSummary] = None
    skills: Optional[SectionScoreSkills] = None
    education: Optional[SectionScoreEducation] = None
    projects: Optional[SectionScoreProjects] = None
    experience: Optional[SectionScoreExperience] = None
    internships: Optional[SectionScoreInternships] = None
    certifications: Optional[SectionScoreCertifications] = None
    additional_info: Optional[SectionScoreAdditional] = None


class QualityDimension(BaseModel):
    dimension: str
    score: int = Field(ge=0, le=100)
    benchmark: int = Field(default=80, ge=0, le=100)


class SkillDistributionItem(BaseModel):
    name: str
    value: int
    percentage: int
    color: Optional[str] = ""


class SkillDistribution(BaseModel):
    technical_count: int = 0
    tools_count: int = 0
    soft_skills_count: int = 0
    distribution: List[SkillDistributionItem] = Field(default_factory=list)


class KeywordCoverage(BaseModel):
    matched_keywords_count: int = 0
    recommended_keywords_count: int = 0
    coverage_percentage: int = Field(default=70, ge=0, le=100)
    matched_keywords: List[str] = Field(default_factory=list)
    missing_critical_keywords: List[str] = Field(default_factory=list)


class AtsChecklistItem(BaseModel):
    item: str
    status: str = "pass"  # "pass", "warning", "fail"
    note: str = ""


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
    job_readiness_score: int = Field(default=75, ge=0, le=100)
    content_quality_score: int = Field(default=75, ge=0, le=100)
    readability_score: int = Field(default=80, ge=0, le=100)
    structure_completeness_score: int = Field(default=85, ge=0, le=100)

    summary_score: int = Field(default=70, ge=0, le=100)
    skills_score: int = Field(default=75, ge=0, le=100)
    education_score: int = Field(default=80, ge=0, le=100)
    projects_score: int = Field(default=70, ge=0, le=100)
    experience_score: int = Field(default=70, ge=0, le=100)
    internships_score: int = Field(default=75, ge=0, le=100)
    certifications_score: int = Field(default=80, ge=0, le=100)
    additional_score: int = Field(default=75, ge=0, le=100)

    section_scores: SectionScores
    quality_dimensions: List[QualityDimension] = Field(default_factory=list)
    skill_distribution: Optional[SkillDistribution] = None
    keyword_coverage: Optional[KeywordCoverage] = None
    ats_checklist: List[AtsChecklistItem] = Field(default_factory=list)
    strengths: List[StrengthItem] = Field(default_factory=list)
    weaknesses: List[WeaknessItem] = Field(default_factory=list)
    actionable_recommendations: List[ActionableRecommendation] = Field(default_factory=list)
    disclaimer: str = (
        "ATS compatibility and Job Readiness scores are estimations based on industry keyword density, "
        "format parseability, and structured criteria. They are actionable guidelines and not a factual guarantee of selection."
    )
