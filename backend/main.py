from fastapi import FastAPI
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from schemas.user import TokenResponse, UserCreate, UserLogin
from services.user_manager import UserManager

import models.user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Provide a database session for request handling."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "Backend is running"}


@app.get("/api/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"message": "MySQL connected successfully"}


@app.post("/login", response_model=TokenResponse)
def login(user_login: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate a user with email and plain-text password."""
    return UserManager.authenticate_user(
        db=db,
        email=user_login.email,
        password=user_login.password,
        selected_role=user_login.role,
    )


@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    """Register a new user with a plain-text password."""
    user = UserManager.register_user(db=db, user_data=user_data)
    return {
        "message": "User registered successfully",
        "id": user.user_id,
        "email": user.email,
        "role": user.role,
        "nickname": user.nickname,
    }
