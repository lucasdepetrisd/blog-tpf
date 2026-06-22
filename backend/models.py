from sqlalchemy import Column, Integer, String, Text, DateTime, LargeBinary
from sqlalchemy.sql import func
from database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())



class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(100), nullable=False)
    bio = Column(Text)
    photo_data = Column(LargeBinary, nullable=True)
    photo_mime = Column(String(50), nullable=True)
