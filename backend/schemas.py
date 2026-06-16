from datetime import datetime, date
from pydantic import BaseModel


class PostCreate(BaseModel):
    title: str
    content: str


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

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
