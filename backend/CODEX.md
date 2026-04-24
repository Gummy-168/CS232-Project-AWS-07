# CODEX.md

## Project Name

CS232 Smart Classroom Interaction System

## Project Goal

This project is a classroom interaction system for students and professors.

The main goal is to help students ask questions during class, allow professors to manage class interaction boards, answer questions, and view analytics about classroom participation.

The system should follow the existing UML class diagram, user flow, and current folder structure.  
Do not redesign the whole system unless explicitly asked.

---

## Current Project Scope

This backend currently focuses on the following core features:

### 1. User Management

Users can be either:

- Student
- Professor

Required user data:

- user_id
- email
- password_hash
- role
- nickname

Main responsibilities:

- Register user
- Login user
- Logout user
- Authenticate user
- Validate profile state

---

### 2. Course Management

A professor can create and manage courses.

Required course data:

- course_code
- course_name
- professor_id
- is_active

Main responsibilities:

- Create course
- Get course by code
- Set course code
- Generate enrollment report
- Verify enrollment eligibility

---

### 3. Enrollment

Students join courses using a course code.

Required enrollment data:

- enrollment_id
- student_id
- course_code
- join_date

Main responsibilities:

- Link students with courses
- Allow student enrollment by course code
- Retrieve enrollment details

Relationship:

- One user can have many enrollments
- One course can have many enrollments

---

### 4. Interaction Board

A professor can create an interaction board for a course.

Students can submit questions to a board.

Required board data:

- board_id
- course_code
- status

Main responsibilities:

- Get board status
- Set board status
- Archive board
- Validate board status transition
- Delete questions from the board by request

Relationship:

- One course can have many interaction boards
- One interaction board can have many questions

---

### 5. Question Management

Students can submit questions.

Required question data:

- question_id
- board_id
- student_id
- content
- reply_content
- status
- is_anonymous
- participation_score

Main responsibilities:

- Get question status
- Set question status
- Professor replies to a question
- Check if a question can be deleted
- Grant participation score
- Get question score

---

### 6. Analytics

Professors can view analytics data about class interaction and student participation.

Main responsibilities:

- Generate class overview
- Generate student insight
- Check data sufficiency

Analytics should be based on existing data such as:

- Questions
- Replies
- Participation score
- Question status
- Enrollment data

Do not introduce complex AI/ML analytics unless explicitly requested.

---

### 7. Search and Filter

Users can search and filter questions in an interaction board.

Main responsibilities:

- Get questions by filter
- Search questions by keyword

Search should be simple and based on the existing board/question data.

---

### 8. Notification

The system can notify users when there is an update.

Required notification data:

- notification_list

Main responsibilities:

- Get unread notification count
- Dispatch notification
- Validate notification target

Keep notification logic simple for now.

---

## Existing Folder Structure

The current project structure includes:

```txt
models/
├── __init__.py
├── board.py
├── course.py
├── enrollment.py
├── question.py
└── user.py

services/
├── __init__.py
├── analytics.py
├── notification.py
├── search.py
└── user_manager.py