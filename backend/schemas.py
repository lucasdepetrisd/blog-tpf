from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator


class PostCreate(BaseModel):
    title: str
    content: str
    tags: str = ""


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    tags: Optional[str] = ""
    created_at: datetime
    updated_at: datetime

    @field_validator('tags', mode='before')
    @classmethod
    def coerce_tags(cls, v: object) -> str:
        return v if isinstance(v, str) else ""

    class Config:
        from_attributes = True


class ChangelogCreate(BaseModel):
    version: str
    description: str
    date: date


class ChangelogResponse(BaseModel):
    id: int
    version: str
    description: str
    date: date

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: str
    bio: str


class ProfileResponse(BaseModel):
    name: str
    bio: str
    has_photo: bool

    class Config:
        from_attributes = True
