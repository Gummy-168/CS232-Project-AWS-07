from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models.user import User
from schemas.course import CourseCreate, CourseResponse
from schemas.user import TokenResponse, UserCreate, UserLogin
from services.course_manager import CourseManager
from services.user_manager import UserManager

import models.course
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


def get_bearer_token(authorization: str = Header(default="")) -> str:
    """Extract a bearer token from the Authorization header."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )
    return token.strip()


def get_current_professor(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
):
    """Resolve the currently authenticated professor."""
    return UserManager.require_professor(db=db, token=token)


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


@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
) -> CourseResponse:
    """Create a course for the authenticated professor."""
    # TODO: Re-enable security before deployment
    professor_id = (course_data.professor_id or "prof001").strip()
    professor: User | None = UserManager.get_user_by_id(db=db, user_id=professor_id)

    if professor is None or professor.role != "professor":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid professor_id is required",
        )

    return CourseManager.create_course(
        db=db,
        course_data=course_data,
        professor=professor,
    )
