from pydantic import BaseModel, Field
from typing import Optional


class CreateVersionRequest(BaseModel):
    change_summary: Optional[str] = Field(
        "", max_length=200, description="Optional note or change summary for this version"
    )

