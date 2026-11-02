from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SummaryAiResponse(BaseModel):
    suggested_content: str
    changes_summary: str = ""
    factual_warnings: List[str] = Field(default_factory=list)


class ProjectAiResponse(BaseModel):
    suggested_description: str = ""
    suggested_bullets: List[str] = Field(default_factory=list)
    changes_summary: str = ""
    factual_warnings: List[str] = Field(default_factory=list)


class ExperienceAiResponse(BaseModel):
    suggested_responsibilities: List[str] = Field(default_factory=list)
    changes_summary: str = ""
    factual_warnings: List[str] = Field(default_factory=list)


class InternshipAiResponse(BaseModel):
    suggested_responsibilities: List[str] = Field(default_factory=list)
    changes_summary: str = ""
    factual_warnings: List[str] = Field(default_factory=list)


class SuggestedSkillCategory(BaseModel):
    category: str
    skills: List[str]
    reason: str = ""


class SkillsAiResponse(BaseModel):
    suggested_skills: List[SuggestedSkillCategory] = Field(default_factory=list)
    changes_summary: str = ""


def parse_and_validate(raw_dict: dict, schema_cls):
    """
    Validates a dictionary against a target Pydantic schema class.
    """
    return schema_cls(**raw_dict)

