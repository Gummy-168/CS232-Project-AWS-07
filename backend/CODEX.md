# CODEX.md

## Project Name

CS232 Smart Classroom Interaction System

## Project Goal

This project is a classroom interaction system for students and professors.

The main goal is to help students ask questions during class, allow professors to manage course interaction boards, answer student questions, and view analytics about classroom participation.

The system must follow:

- The existing UML class diagram
- The current user flow
- The current backend folder structure
- The current Docker + MySQL setup

Do not redesign the whole system unless explicitly requested.

---

## Current Project Scope

This backend currently focuses on the following core features:

1. User Management
2. Course Management
3. Enrollment Management
4. Interaction Board Management
5. Question Management
6. Analytics
7. Feed / Search / Filter
8. Notification
9. MySQL database initialization using SQL files
10. Docker-based local development

This is a student project. Keep the implementation clear, simple, and easy to explain.

---

## Main Actors

### Student

A student can:

- Register
- Login
- Join a course using a course code
- View course board
- Submit questions
- Submit anonymous questions
- View question status
- Receive notifications

### Professor

A professor can:

- Register
- Login
- Create courses
- Create or manage interaction boards
- View student questions
- Reply to questions
- Delete or manage questions when allowed
- Grant participation score
- View analytics

---

## Core UML Classes

The project should follow these class names:

```txt
User
UserManager
Course
Enrollment
InteractionBoard
Question
AnalyticsManager
FeedAndSearchManager
NotificationService

Existing Folder Structure

Current backend structure:

backend/
├── models/
│   ├── __init__.py
│   ├── board.py
│   ├── course.py
│   ├── enrollment.py
│   ├── question.py
│   └── user.py
│
├── services/
│   ├── __init__.py
│   ├── analytics.py
│   ├── board_manager.py
│   ├── course_manager.py
│   ├── enrollment_manager.py
│   ├── notification.py
│   ├── question_manager.py
│   ├── search.py
│   └── user_manager.py
│
├── sql/
│   ├── init.sql
│   └── seed.sql
│
├── main.py
├── database.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
├── README.md
└── CODEX.md

Do not create unrelated folders.

Allowed future folders only if needed:

schemas/
routers/
tests/
Responsibility by Folder
models/

Use this folder for domain models or ORM models.

Files:

models/user.py
models/course.py
models/enrollment.py
models/board.py
models/question.py
services/

Use this folder for business logic.

Files:

services/user_manager.py
services/course_manager.py
services/enrollment_manager.py
services/board_manager.py
services/question_manager.py
services/analytics.py
services/search.py
services/notification.py
sql/

Use this folder for SQL database initialization.

Files:

sql/init.sql
sql/seed.sql
main.py

Use this file as the FastAPI app entry point.

database.py

Use this file for database connection setup.

Coding Rules
General Rules
Use Python.
Keep the code beginner-friendly.
Keep functions readable.
Do not over-engineer.
Do not introduce unrelated features.
Do not rename existing files without permission.
Do not rewrite the whole project unless explicitly requested.
Do not mix API logic, database logic, and business logic in one large file.
Backend Rules

If using FastAPI:

API routes should stay in main.py for now unless routers are requested.
Business logic should stay in services/.
Data models should stay in models/.
Database connection should stay in database.py.
Security Rules
Never store raw passwords.
Store password hashes only.
Do not print passwords in logs.
Do not commit .env.
Use .env.example for sample values.
Keep authentication simple unless JWT is requested.
Do not add JWT unless explicitly requested.
Database Configuration

The project uses MySQL inside Docker.

Current database values:

DB_HOST=db
DB_PORT=3306
DB_NAME=cs232db
DB_USER=root
DB_PASSWORD=1234

Important:

Use DB_HOST=db when backend runs inside Docker.
Use DB_HOST=localhost only when backend runs directly on the host machine.
Do not hardcode database credentials in Python files.
Always read database settings from environment variables.
Docker Configuration

Docker Compose should contain two services:

db
backend

The MySQL service should use:

MYSQL_ROOT_PASSWORD: 1234
MYSQL_DATABASE: cs232db

The backend service should use:

DB_HOST: db
DB_PORT: 3306
DB_NAME: cs232db
DB_USER: root
DB_PASSWORD: 1234

The MySQL Docker port mapping is:

localhost:3307 -> container:3306

So MySQL Workbench should connect using:

Host: localhost
Port: 3307
User: root
Password: 1234
Database: cs232db
SQL Initialization Rules

The project should use SQL files for database initialization.

Required files:

sql/init.sql
sql/seed.sql
init.sql

Used for:

Creating tables
Creating indexes
Defining foreign keys
Ensuring schema consistency
seed.sql

Used for:

Inserting sample test data
Helping students test API quickly
Demo preparation

Do not put real passwords in seed.sql.

Use fake password hashes such as:

hashed_password
Docker SQL Auto-Run Rule

In docker-compose.yml, MySQL should mount SQL files like this:

volumes:
  - mysql_data:/var/lib/mysql
  - ./sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql
  - ./sql/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

Use 01-init.sql and 02-seed.sql to guarantee order:

Create tables first
Insert sample data second

Important:

MySQL only runs files inside /docker-entrypoint-initdb.d/ on the first database initialization.

If the volume already exists, SQL files will not run again automatically.

To reset database and re-run SQL files:

docker compose down -v
docker compose up -d --build

Warning:

docker compose down -v

deletes the existing MySQL volume and all database data.

Database Tables

The database should match the UML and current project scope.

Required tables:

users
courses
enrollments
interaction_boards
questions
notifications
Table Design
users

Represents students and professors.

Required columns:

user_id
email
password_hash
role
nickname
created_at

Role should support:

student
professor
courses

Represents courses created by professors.

Required columns:

course_code
course_name
professor_id
is_active
created_at

Relationship:

Course belongs to one professor.
Professor is stored in users table.
enrollments

Represents students joining courses.

Required columns:

enrollment_id
student_id
course_code
join_date

Relationship:

One user can have many enrollments.
One course can have many enrollments.

There should be a unique constraint on:

student_id + course_code
interaction_boards

Represents a board for classroom questions.

Required columns:

board_id
course_code
status
created_at

Relationship:

One course can have many interaction boards.
One interaction board belongs to one course.

Allowed status values:

active
archived
closed
questions

Represents student questions.

Required columns:

question_id
board_id
student_id
content
reply_content
status
is_anonymous
participation_score
created_at
updated_at

Relationship:

One interaction board can have many questions.
One question belongs to one student.
Question can trigger notification.

Allowed status values:

pending
answered
deleted
notifications

Represents notifications sent to users.

Required columns:

notification_id
target_user_id
message
notif_type
is_read
created_at

Relationship:

One user can have many notifications.
Question can trigger notification.
UML Relationship Rules

Follow these relationships:

User 1 ---- m Enrollment
Course 1 ---- m Enrollment
Course 1 ---- m InteractionBoard
InteractionBoard 1 ---- m Question
Question ---- triggers ---- NotificationService
AnalyticsManager ---- analyzes ---- Course
FeedAndSearchManager ---- filters ---- InteractionBoard
UserManager ---- manages ---- User

Do not change these relationships unless explicitly requested.

Class Details
User

Attributes:

_user_id: str
_email: str
_password_hash: str
_role: str
_nickname: str

Expected methods:

__init__(user_id: str, email: str, password_hash: str, role: str)
get_user_id() -> str
get_email() -> str
set_email(email: str) -> None
get_nickname() -> str
set_nickname(nickname: str) -> None
authenticate(input_password: str) -> bool
validate_profile_state() -> bool
UserManager

Attributes:

_db_connection: str

Expected methods:

__init__()
login(email: str, raw_password: str) -> dict
logout(user_id: str) -> None
register_user(user_data: dict) -> bool

Responsibility:

Manage registration
Manage login
Manage logout
Work with User data
Course

Attributes:

_course_code: str
_course_name: str
_professor_id: str
_is_active: bool

Expected methods:

__init__(course_code: str, course_name: str, prof_id: str)
get_course_code() -> str
set_course_code(code: str) -> None
generate_enrollment_report() -> dict
verify_enrollment_eligibility(student_id: str) -> bool
Enrollment

Attributes:

_enrollment_id: str
_student_id: str
_course_code: str
_join_date: datetime

Expected methods:

__init__(student_id: str, course_code: str)
get_enrollment_details() -> dict
InteractionBoard

Attributes:

_board_id: str
_course_code: str
_status: str

Expected methods:

__init__(board_id: str, course_code: str)
get_status() -> str
set_status(status: str) -> None
archive_board() -> None
validate_status_transition(new_status: str) -> bool
delete_question(question_id: str, requester_user_id: str) -> bool
Question

Attributes:

_question_id: str
_board_id: str
_student_id: str
_content: str
_reply_content: str
_status: str
_is_anonymous: bool
_participation_score: int

Expected methods:

__init__(question_id: str, board_id: str, student_id: str, content: str, is_anonymous: bool)
get_status() -> str
set_status(status: str) -> None
process_professor_reply(reply_text: str) -> None
can_be_deleted() -> bool
grant_participation_score(score: int) -> None
get_score() -> int

Important:

Use process_professor_reply() as the method name because it matches the UML.

Do not rename it to professor_reply() unless explicitly requested.

AnalyticsManager

Attributes:

_course_data: Course

Expected methods:

__init__(course: Course)
generate_class_overview() -> dict
generate_student_insight(student_id: str) -> dict
check_data_sufficiency() -> bool

Analytics should be based on:

Questions
Replies
Participation score
Question status
Enrollment count

Do not add machine learning or AI analytics unless explicitly requested.

FeedAndSearchManager

Attributes:

_board: InteractionBoard

Expected methods:

__init__(board: InteractionBoard)
get_question_feed(sort_by: str, filter_status: str) -> list
validate_search_keyword(keyword: str) -> bool

Responsibility:

Filter questions by status
Sort questions
Validate search keyword
Prepare question feed for display

Do not add advanced full-text search unless explicitly requested.

NotificationService

Attributes:

_notification_list: list

Expected methods:

__init__()
get_unread_count(user_id: str) -> int
dispatch_notification(target_user_id: str, message: str, notif_type: str) -> None
validate_notification_target(user_id: str) -> bool

Responsibility:

Notify users about question updates
Notify students when professor replies
Track unread notifications

Keep notification logic simple.

Service Layer Guidelines
services/user_manager.py

Should handle:

login
logout
register_user
services/course_manager.py

Should handle:

create_course
get_course_by_code
update_course_status
services/enrollment_manager.py

Should handle:

enroll_student
get_student_courses
get_course_students
services/board_manager.py

Should handle:

create_board
get_board
set_board_status
archive_board
services/question_manager.py

Should handle:

create_question
reply_question
delete_question
grant_score
get_questions_by_board
services/analytics.py

Should handle:

generate_class_overview
generate_student_insight
check_data_sufficiency
services/search.py

Should handle:

get_question_feed
validate_search_keyword
filter_questions
services/notification.py

Should handle:

dispatch_notification
get_unread_count
validate_notification_target
API Design Guideline

If API routes are added, use REST-style routes.

Recommended endpoints:

POST   /auth/register
POST   /auth/login
POST   /auth/logout

POST   /courses
GET    /courses/{course_code}
PATCH  /courses/{course_code}

POST   /courses/{course_code}/enroll
GET    /courses/{course_code}/students

POST   /boards
GET    /boards/{board_id}
PATCH  /boards/{board_id}/status

POST   /questions
GET    /questions/{question_id}
GET    /boards/{board_id}/questions
PATCH  /questions/{question_id}/reply
PATCH  /questions/{question_id}/score
DELETE /questions/{question_id}

GET    /analytics/courses/{course_code}
GET    /analytics/students/{student_id}

GET    /notifications/{user_id}
PATCH  /notifications/{notification_id}/read

Do not add unrelated endpoints.

Development Priority

Follow this order:

Phase 1: Database and SQL
Confirm sql/init.sql
Confirm sql/seed.sql
Confirm Docker mounts SQL files
Confirm tables are created correctly

Check tables:

docker compose exec db mysql -uroot -p1234 -e "USE cs232db; SHOW TABLES;"

Check sample data:

docker compose exec db mysql -uroot -p1234 -e "USE cs232db; SELECT * FROM users;"
Phase 2: Model Layer

Create or fix:

User
Course
Enrollment
InteractionBoard
Question
Phase 3: Service Layer

Create or fix:

UserManager
CourseManager
EnrollmentManager
BoardManager
QuestionManager
AnalyticsManager
FeedAndSearchManager
NotificationService
Phase 4: API Layer

Only after models and services are stable, create FastAPI endpoints.

Phase 5: Testing

Test:

database connection
table creation
register
login
create course
enroll course
create board
submit question
reply question
notification
analytics
What Codex Should Do

When asked to generate or edit code:

Read this CODEX.md first.
Follow the UML.
Follow the current folder structure.
Modify only the files related to the request.
Keep code simple and readable.
Explain briefly what changed.
Do not create unrelated features.
Do not rewrite the whole project unless explicitly requested.
What Codex Should Not Do

Codex must not:

Redesign the architecture from scratch.
Add unnecessary technologies.
Add frontend code unless asked.
Add AWS deployment files unless asked.
Add JWT unless asked.
Add AI/ML analytics unless asked.
Change the project goal.
Rename UML classes.
Delete existing files without permission.
Hardcode secrets.
Commit .env.
Mix all logic into main.py.
Git Rules

Do not commit:

.env
__pycache__/
*.pyc
mysql_data/
.venv/
myenv/

Recommended .gitignore:

.env
__pycache__/
*.pyc
.venv/
myenv/
mysql_data/
README Setup Command for Friends

Friends should be able to run the project with:

git clone <repo-url>
cd CS232-Project/backend
docker compose up -d --build

Check containers:

docker compose ps

Check database:

docker compose exec db mysql -uroot -p1234 -e "SHOW DATABASES;"

Check tables:

docker compose exec db mysql -uroot -p1234 -e "USE cs232db; SHOW TABLES;"

Reset database if SQL files did not run:

docker compose down -v
docker compose up -d --build
Final Reminder

This is a CS232 student project.

Priority order:

Match the UML
Match the user flow
Keep backend working
Keep code understandable
Keep Docker setup easy for friends
Keep the project easy to present

Avoid making the system too complex.