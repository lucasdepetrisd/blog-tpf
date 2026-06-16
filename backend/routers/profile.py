import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from schemas import ProfileUpdate, ProfileResponse
import models

router = APIRouter(prefix="/api/profile", tags=["profile"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")


@router.get("", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(models.Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    return profile


@router.put("", response_model=ProfileResponse)
def update_profile(profile: ProfileUpdate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    db_profile = db.query(models.Profile).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    db_profile.name = profile.name  # type: ignore
    db_profile.bio = profile.bio  # type: ignore
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.post("/photo", response_model=ProfileResponse)
async def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    contents = await file.read()
    ext = os.path.splitext(file.filename or "foto.jpg")[1] or ".jpg"
    filename = f"foto{ext}"
    os.makedirs(STATIC_DIR, exist_ok=True)
    with open(os.path.join(STATIC_DIR, filename), "wb") as f:
        f.write(contents)
    db_profile = db.query(models.Profile).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    db_profile.photo_url = f"/static/{filename}"  # type: ignore
    db.commit()
    db.refresh(db_profile)
    return db_profile
