from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from schemas import ChangelogCreate, ChangelogResponse
import models

router = APIRouter(prefix="/api/changelog", tags=["changelog"])


@router.get("", response_model=list[ChangelogResponse])
def get_changelog(db: Session = Depends(get_db)):
    return db.query(models.Changelog).order_by(models.Changelog.date.desc()).all()


@router.post("", response_model=ChangelogResponse)
def create_entry(data: ChangelogCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    entry = models.Changelog(version=data.version, description=data.description, date=data.date)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    entry = db.query(models.Changelog).filter(models.Changelog.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    db.delete(entry)
    db.commit()
    return {"ok": True}
