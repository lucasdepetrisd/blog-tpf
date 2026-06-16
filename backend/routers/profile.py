import hashlib

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from schemas import ProfileUpdate, ProfileResponse
import models

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _to_response(profile: models.Profile) -> dict:
    return {
        "name": profile.name,
        "bio": profile.bio or "",
        "has_photo": profile.photo_data is not None,
    }


@router.get("", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(models.Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    return _to_response(profile)


@router.put("", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    profile = db.query(models.Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    profile.name = data.name  # type: ignore
    profile.bio = data.bio  # type: ignore
    db.commit()
    db.refresh(profile)
    return _to_response(profile)


@router.post("/photo", response_model=ProfileResponse)
async def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    contents = await file.read()
    mime = file.content_type or "image/jpeg"
    profile = db.query(models.Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    profile.photo_data = contents  # type: ignore
    profile.photo_mime = mime  # type: ignore
    db.commit()
    db.refresh(profile)
    return _to_response(profile)


@router.delete("/photo", response_model=ProfileResponse)
def delete_photo(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    profile = db.query(models.Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile no encontrado")
    profile.photo_data = None  # type: ignore
    profile.photo_mime = None  # type: ignore
    db.commit()
    db.refresh(profile)
    return _to_response(profile)


@router.get("/photo")
def get_photo(db: Session = Depends(get_db)):
    profile = db.query(models.Profile).first()
    if not profile or not profile.photo_data:
        raise HTTPException(status_code=404, detail="Sin foto")
    etag = hashlib.md5(profile.photo_data).hexdigest()
    return Response(
        content=profile.photo_data,
        media_type=profile.photo_mime or "image/jpeg",
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": f'"{etag}"',
        },
    )
