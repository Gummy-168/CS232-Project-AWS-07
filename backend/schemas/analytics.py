from pydantic import BaseModel
from typing import List, Dict, Any

class StudentAnalytics(BaseModel):
    student_id: str
    participation_score: float
    class_average: float
    questions_asked: int
    replies_given: int

class CourseOverview(BaseModel):
    course_code: str
    total_questions: int
    response_rate: float
    top_students: List[Dict[str, Any]]