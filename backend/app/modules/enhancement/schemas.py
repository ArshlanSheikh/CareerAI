from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GenerateEnhancementRequest(BaseModel):
    target_role: Optional[str] = ""
    custom_instructions: Optional[str] = ""
    analysis_id: Optional[str] = ""


class ApplyEnhancementRequest(BaseModel):
    mode: str = Field(default="new_version", description="new_version, new_resume, or replace")
    accepted_sections: Dict[str, bool] = Field(default_factory=dict)
    custom_content: Optional[Dict[str, Any]] = None
    title_for_new_resume: Optional[str] = ""


class SectionDiffItem(BaseModel):
    section: str
    title: str
    change_summary: List[str] = Field(default_factory=list)
    impact: str = "high"
    original: Optional[Any] = None
    improved: Optional[Any] = None

