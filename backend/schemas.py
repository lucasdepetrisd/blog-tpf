from datetime import datetime
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


class ProfileUpdate(BaseModel):
    name: str
    bio: str


class ProfileResponse(BaseModel):
    name: str
    bio: str
    photo_url: str

    class Config:
        from_attributes = True
