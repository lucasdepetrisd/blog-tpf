from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles

from auth import create_token, verify_password, BLOG_USER
from database import engine, get_db, Base
from routers import posts, profile, system
import models

Base.metadata.create_all(bind=engine)


def init_db():
    db = next(get_db())
    if not db.query(models.Profile).first():
        db.add(models.Profile(name="Lucas Depetris", bio=""))
        db.commit()


init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(profile.router)
app.include_router(system.router)

_static_dir = Path(__file__).parent / "public" / "static"
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != BLOG_USER or not verify_password(form.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    return {"access_token": create_token({"sub": form.username}), "token_type": "bearer"}

