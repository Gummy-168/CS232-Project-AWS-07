# 🏗️ System Architecture

![Project](https://img.shields.io/badge/Project-CS232--Project--AWS--07-blue?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Cloud-Amazon_Web_Services-orange?style=for-the-badge&logo=amazon-aws)
![Region](https://img.shields.io/badge/Region-ap--southeast--1_(Singapore)-lightgrey?style=for-the-badge)

---

## Overview

ระบบนี้เป็น **Classroom Q&A System** สำหรับนักศึกษาและอาจารย์

แกนหลักของระบบในโค้ดปัจจุบันคือ:

- Frontend เรียก backend ผ่าน REST API
- Backend รันด้วย **FastAPI**
- ฐานข้อมูลใช้ **MySQL**
- มีการรองรับ **Amazon Cognito** สำหรับบาง endpoint ที่ใช้ token จาก Cognito
- มีทั้งโหมดรันแบบ local ด้วย Docker Compose และโหมด deploy บน AWS EC2 / RDS

> หมายเหตุ: ใน `main.py` ตอนนี้ **ยังไม่มี WebSocket route จริง** และ **ไม่ได้ใช้ SES** ใน flow หลัก

---

## Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────┐
│                           USERS / BROWSER                           │
│                    นักศึกษา / อาจารย์ / ผู้ดูแล                     │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND APPLICATION                        │
│                   Next.js / React / TypeScript                      │
│           (local dev หรือ deploy บน AWS Amplify ก็ได้)             │
└───────────────────────────────┬────────────────────────────────────┘
                                │  HTTP / REST
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                             │
│                          `main.py` entry point                      │
│     /login /register /courses /students/* /professors/* /api/*      │
│                รันด้วย Uvicorn บนพอร์ต 8000                        │
└───────────────────────────────┬────────────────────────────────────┘
               ┌────────────────┼─────────────────┐
               │                │                 │
               ▼                ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   MYSQL DATABASE      │  │   COGNITO TOKEN  │  │  OPTIONAL FRONTEND   │
│  `sql/init.sql`      │  │  VERIFY / SYNC   │  │  HOSTING (Amplify)   │
│  `sql/seed.sql`      │  │  /api/auth/*     │  │                      │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
```

---

## Deployment Modes

### Local development

```text
Browser -> Frontend (localhost:3000)
        -> FastAPI backend (localhost:8000)
        -> MySQL via Docker Compose (localhost:3307)
```

### AWS deployment

```text
Browser -> Frontend on Amplify
        -> FastAPI backend on EC2
        -> MySQL on RDS
        -> Cognito for token-backed endpoints
```

---

## Request Flow

### 1. Login / Register
1. ผู้ใช้กรอกข้อมูลใน frontend
2. Frontend ส่ง request ไปยัง `POST /register` หรือ `POST /login`
3. Backend ตรวจสอบข้อมูลผ่าน `UserManager`
4. Backend ส่ง JWT token ของระบบกลับไปใน response ของ `/login`
5. สำหรับบาง flow สามารถใช้ token จาก Cognito กับ `/api/auth/cognito/me` และ `/api/auth/cognito/sync`

### 2. นักศึกษาเข้าร่วมวิชา
1. อาจารย์สร้าง `course` และ `course_section`
2. อาจารย์สร้าง `course_join_code`
3. นักศึกษาส่ง `POST /students/{student_id}/courses/join`
4. Backend consume join code และสร้าง `enrollment`
5. นักศึกษาจะเห็นวิชาใน `/students/{student_id}/courses`

### 3. นักศึกษาส่งคำถาม
1. นักศึกษาเลือกวิชาหรือ board ใน frontend
2. ส่ง `POST /students/{student_id}/questions`
3. Backend ตรวจ enrollment, section, board status
4. บันทึกข้อมูลลง `questions`
5. คำถามจะถูกดึงไปแสดงใน feed ของนักศึกษาและอาจารย์

### 4. อาจารย์ตอบคำถาม
1. อาจารย์เปิดหน้า questions feed
2. ส่ง `PATCH /professors/{professor_id}/questions/{question_id}/status` หรือ `POST /professors/{professor_id}/questions/{question_id}/replies`
3. Backend อัปเดต `questions.status` และบันทึก reply ลง `question_replies`
4. นักศึกษาจะเห็นสถานะเปลี่ยนเป็น `answered`

---

## Component Breakdown

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| Frontend | Next.js / React / TypeScript | UI, form, dashboard, data fetching |
| Backend API | FastAPI + Uvicorn | REST endpoints, validation, business logic |
| ORM / DB Access | SQLAlchemy | Database session and model mapping |
| Authentication | Local login + Cognito support | Login/register และ token-backed endpoints |
| Database | MySQL 8.0 | Store users, courses, sections, boards, questions, replies, notifications |
| Containerization | Docker / Docker Compose | Local development and deploy packaging |
| Hosting | EC2 / Amplify / RDS | AWS deployment path |

---

## Backend Responsibilities

### `main.py`
- สร้าง FastAPI app
- ลงทะเบียน route ทั้งหมด
- เชื่อมต่อกับ database
- ทำ startup schema checks / backfill บางคอลัมน์

### `database.py`
- อ่านค่าจาก environment variables
- สร้าง SQLAlchemy engine และ session

### `models/`
- เก็บ ORM models ของ `users`, `professors`, `courses`, `enrollments`, `course_sections`, `interaction_boards`, `course_join_codes`, `questions`, `question_replies`

### `services/`
- เก็บ business logic เช่น course, enrollment, question, user, analytics

---

## Security Notes

- `/login` ใช้ local authentication ของ backend
- `/api/auth/cognito/me` และ `/api/auth/cognito/sync` ใช้ Bearer token จาก Cognito
- **ไม่ได้มี middleware ที่บังคับ JWT ทุก endpoint** ในโค้ดปัจจุบัน
- หลาย endpoint ยังใช้ `student_id` หรือ `professor_id` ใน path เพื่อระบุตัวตนเชิงธุรกิจ
- Database credentials ต้องมาจาก `.env`
- `ALLOWED_ORIGINS` หรือ `FRONTEND_ORIGIN` ใช้กำหนด CORS

---

## Data Flow Summary

### Student flow
- Register / Login
- Join course via join code
- View courses, boards, questions, dashboard, analytics
- Create / edit / reply to own questions

### Professor flow
- Login
- Create course and section
- Generate join code
- Open / close board session
- View question feeds
- Reply to questions and update status
- View analytics and course activity

---

## Database Link

ระบบใช้ฐานข้อมูลตาม schema จริงในไฟล์:

- `sql/init.sql`
- `sql/seed.sql`

ตารางหลักที่เกี่ยวข้อง:

- `users`
- `professors`
- `courses`
- `course_sections`
- `enrollments`
- `interaction_boards`
- `course_join_codes`
- `questions`
- `question_replies`
- `notifications`

---

## Important Differences From Older Diagram

- ไม่มี WebSocket route จริงใน `main.py`
- ไม่มี SES integration จริงใน backend code ปัจจุบัน
- backend port ปัจจุบันคือ `8000` ไม่ใช่ `5000`
- auth ไม่ได้บังคับ Cognito ทุก endpoint
- ระบบใช้ `course_code` และ `section_id` เป็นแกนหลัก ไม่ใช่ `course_id` แบบเอกสารเก่า
