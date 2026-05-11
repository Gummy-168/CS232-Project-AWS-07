# ⚙️ API Documentation

![Project](https://img.shields.io/badge/Project-CS232--Project--AWS--07-blue?style=for-the-badge)
![Base URL](https://img.shields.io/badge/Base_URL-http://<EC2_IP>:5000-lightgrey?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-Path%20Params%20%2B%20บาง%20endpoint%20ใช้%20Bearer%20Token-orange?style=for-the-badge&logo=amazon-aws)

---

## หมายเหตุสำคัญ

- เอกสารนี้อิงจาก `main.py`, `schemas/`, และ service layer ในโปรเจกต์ปัจจุบัน
- โค้ดตอนนี้ **ไม่ได้บังคับ Bearer token ทุก endpoint**
- endpoint ที่ใช้ Bearer token จริงในโค้ดปัจจุบันคือ
  - `/api/auth/cognito/me`
  - `/api/auth/cognito/sync`
  - `/api/courses/{course_code}/questions/search`
- หลาย endpoint ใช้ `student_id` หรือ `professor_id` ใน path แทนการเช็ค token โดยตรง

---

## Health Check

### Root
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/`

**Response**
```json
{ "message": "Backend is running" }
```

### Health
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/api/health`

**Response**
```json
{ "status": "ok" }
```

### Database Test
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/api/db-test`

**Response**
```json
{ "status": "ok", "database": "connected" }
```

---

## Auth

### สมัครสมาชิก
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/register`

**Request**
```json
{
  "id": "stu003",
  "full_name": "Somchai Jaidee",
  "email": "student@example.com",
  "password": "password123",
  "role": "student",
  "nickname": "Somchai"
}
```

**Response**
```json
{
  "message": "User registered successfully",
  "id": "stu003",
  "full_name": "Somchai Jaidee",
  "email": "student@example.com",
  "role": "student",
  "nickname": "Somchai"
}
```

**ข้อจำกัด**
- สมัครได้เฉพาะ role `student`
- ถ้า `id` หรือ `email` ซ้ำ จะได้ `400`

### เข้าสู่ระบบ
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/login`

**Request**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "stu003",
  "role": "student",
  "redirect_to": "/student/dashboard",
  "full_name": "Somchai Jaidee",
  "nickname": "Somchai"
}
```

**หมายเหตุ**
- `role` ต้องเป็น `student` หรือ `professor`
- professor login จะตรวจข้อมูลจากตาราง `professors`

### อ่านข้อมูลผู้ใช้จาก Cognito
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/api/auth/cognito/me`

**Header**
```http
Authorization: Bearer <cognito_access_token>
```

**Response**
```json
{
  "sub": "abc123",
  "email": "user@example.com",
  "username": "user@example.com",
  "token_use": "access"
}
```

### Sync Cognito user ไปยังฐานข้อมูล local
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/api/auth/cognito/sync`

**Header**
```http
Authorization: Bearer <cognito_access_token>
```

**Request**
```json
{
  "role": "student",
  "nickname": "Somchai"
}
```

**Response เมื่อมี user อยู่แล้ว**
```json
{
  "status": "existing",
  "user_id": "cognito-abc123",
  "email": "user@example.com",
  "role": "student"
}
```

**Response เมื่อสร้างใหม่**
```json
{
  "status": "created",
  "user_id": "cognito-abc123",
  "email": "user@example.com",
  "role": "student"
}
```

---

## Courses

### สร้างคลาส
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/courses`

**Request**
```json
{
  "course_code": "CS232",
  "course_name": "Cloud Computing",
  "professor_id": "prof001",
  "is_active": true
}
```

**Response**
```json
{
  "course_code": "CS232",
  "course_name": "Cloud Computing",
  "professor_id": "prof001",
  "is_active": true,
  "created_at": "2026-05-10T09:00:00"
}
```

**ข้อผิดพลาดหลัก**
- `400` ถ้า `professor_id` ไม่มี หรือ course code ซ้ำ
- `400` ถ้า `professor_id` ไม่ใช่อาจารย์ที่มีอยู่จริง

### ดึงรายชื่อ section ของคลาส
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/sections`

**Response**
```json
[
  {
    "section_id": "sec-123",
    "course_code": "CS232",
    "section_code": "A01",
    "meeting_days": ["Mon", "Wed"],
    "start_time": "09:00",
    "end_time": "10:15",
    "is_active": true,
    "created_at": "2026-05-10T09:00:00"
  }
]
```

### สร้าง section
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/sections`

**Request**
```json
{
  "section_code": "A01",
  "meeting_days": ["Mon", "Wed"],
  "start_time": "09:00",
  "end_time": "10:15",
  "is_active": true
}
```

**Response**
```json
{
  "section_id": "sec-123",
  "course_code": "CS232",
  "section_code": "A01",
  "meeting_days": ["Mon", "Wed"],
  "start_time": "09:00",
  "end_time": "10:15",
  "is_active": true,
  "created_at": "2026-05-10T09:00:00"
}
```

### ลบหรือ archive section
![](https://img.shields.io/badge/DELETE-red?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/sections/{section_code}`

**Response ตัวอย่าง**
```json
{
  "action": "deleted",
  "course_code": "CS232",
  "section_code": "A01",
  "reason": "Section has no enrollments, boards, or questions",
  "counts": {
    "enrollments": 0,
    "boards": 0,
    "questions": 0,
    "active_join_codes": 0
  }
}
```

**หมายเหตุ**
- ถ้ามีข้อมูลใช้งานอยู่ ระบบอาจตอบ `archived` แทน `deleted`

### ลบหรือ archive course
![](https://img.shields.io/badge/DELETE-red?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}`

**Response ตัวอย่าง**
```json
{
  "action": "deleted",
  "course_code": "CS232",
  "reason": "Course has no sections, enrollments, boards, questions, or active join codes",
  "counts": {
    "sections": 0,
    "enrollments": 0,
    "boards": 0,
    "questions": 0,
    "active_join_codes": 0
  }
}
```

### ดู join code ที่ active อยู่
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/join-code?section_code=A01`

**Response**
```json
{
  "join_code_id": "jc-123",
  "code": "ABCD12",
  "course_code": "CS232",
  "section_id": "sec-123",
  "section_code": "A01",
  "professor_id": "prof001",
  "expires_at": "2026-05-10T09:15:00",
  "is_active": true,
  "created_at": "2026-05-10T09:00:00"
}
```

### สร้าง join code ใหม่
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/join-code`

**Request**
```json
{
  "section_code": "A01"
}
```

**Response**
```json
{
  "join_code_id": "jc-123",
  "code": "ABCD12",
  "course_code": "CS232",
  "section_id": "sec-123",
  "section_code": "A01",
  "professor_id": "prof001",
  "expires_at": "2026-05-10T09:15:00",
  "is_active": true,
  "created_at": "2026-05-10T09:00:00"
}
```

---

## Students

### ดูโปรไฟล์นักศึกษา
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/profile`

**Response**
```json
{
  "user_id": "stu001",
  "full_name": "Student One",
  "nickname": "Student One",
  "email": "stu001@example.com",
  "role": "student",
  "enrolled_courses": 2
}
```

### เปลี่ยน nickname
![](https://img.shields.io/badge/PATCH-yellow?style=for-the-badge) `/students/{student_id}/nickname`

**Request**
```json
{
  "nickname": "Somchai"
}
```

**Response**
```json
{
  "message": "Nickname updated successfully",
  "user_id": "stu001",
  "nickname": "Somchai"
}
```

### ดูรายวิชาที่ลงทะเบียนไว้
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/courses`

**Response**
```json
{
  "courses": [
    {
      "course_code": "CS232",
      "course_name": "Cloud Computing",
      "is_active": true,
      "professor_id": "prof001",
      "professor_name": "Prof CS232",
      "professor_full_name": "Professor CS232",
      "section_id": "sec-123",
      "section_code": "A01",
      "join_date": "2026-05-10T09:00:00"
    }
  ]
}
```

### ดู board ที่ active ของคลาส
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/courses/{course_code}/board?section_code=A01`

**Response**
```json
{
  "student": {
    "id": "stu001",
    "name": "Student One"
  },
  "course": {
    "course_code": "CS232",
    "course_name": "Cloud Computing",
    "professor_name": "Prof CS232",
    "professor_full_name": "Professor CS232",
    "section_id": "sec-123",
    "section_code": "A01"
  },
  "active_board": {
    "board_id": "board_abc123",
    "board_title": "Week 1 Discussion",
    "section_id": "sec-123",
    "section_code": "A01",
    "status": "ACTIVE",
    "created_at": "2026-05-10T09:00:00",
    "total_questions": 5,
    "answered_questions": 3,
    "unanswered_questions": 2
  }
}
```

### ดูประวัติ board sessions
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/courses/{course_code}/boards?section_code=A01`

**Response**
```json
{
  "board_sessions": [
    {
      "board_id": "board_abc123",
      "board_title": "Week 1 Discussion",
      "course_code": "CS232",
      "course_name": "Cloud Computing",
      "section_id": "sec-123",
      "section_code": "A01",
      "status": "ACTIVE",
      "created_at": "2026-05-10T09:00:00",
      "closed_at": null,
      "total_questions": 5,
      "answered_questions": 3,
      "unanswered_questions": 2
    }
  ]
}
```

### เข้าร่วมคลาสด้วย join code
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/students/{student_id}/courses/join`

**Request**
```json
{
  "student_id": "stu001",
  "join_code": "ABCD12"
}
```

**Response**
```json
{
  "enrollment_id": 1,
  "student_id": "stu001",
  "course_code": "CS232",
  "section_id": "sec-123",
  "section_code": "A01",
  "course_name": "Cloud Computing",
  "message": "Joined course section successfully",
  "join_date": "2026-05-10T09:00:00"
}
```

**หมายเหตุ**
- ถ้าส่ง `student_id` ใน path และใน body ไม่ตรงกัน โค้ดจะใช้ค่าจาก body ถ้ามี

### ดู feed คำถามของนักศึกษา
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/questions`

**Query Parameters**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `scope` | string | `all` | `all` หรือ `mine` |
| `course_code` | string | `null` | กรองตามวิชา |
| `section_code` | string | `null` | กรองตาม section |
| `status` | string | `all` | `all`, `answered`, `unanswered`, `pending` |
| `search` | string | `null` | ค้นหาข้อความ |
| `tag` | string | `null` | กรองตาม tag |

**Response**
```json
{
  "questions": [
    {
      "id": "q_abc123",
      "board_id": "board_abc123",
      "board_title": "Week 1 Discussion",
      "course_code": "CS232",
      "course_name": "Cloud Computing",
      "title": "Why does EC2 terminate?",
      "content": "Why does EC2 terminate?",
      "reply_content": null,
      "status": "UNANSWERED",
      "is_anonymous": false,
      "tags": ["EC2", "AutoScaling"],
      "created_at": "2026-05-10T09:00:00",
      "updated_at": "2026-05-10T09:00:00",
      "section_id": "sec-123",
      "section_code": "A01",
      "author_id": "stu001",
      "author_name": "Student One",
      "author_full_name": "Student One",
      "replies": []
    }
  ]
}
```

### ค้นหาคำถามใน course
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/api/courses/{course_code}/questions/search`

**Header**
```http
Authorization: Bearer <local_jwt_token>
```

**Query Parameters**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | `null` | คำค้นหา |
| `status` | string | `all` | `all`, `answered`, `unanswered`, `pending` |
| `tag` | string | `null` | กรองตาม tag |

**Response**
```json
[
  {
    "id": "q_abc123",
    "title": "Why does EC2 terminate?",
    "content": "Why does EC2 terminate?",
    "status": "UNANSWERED",
    "student_id": "stu001",
    "student_name": "Student One",
    "course_code": "CS232",
    "course_name": "Cloud Computing",
    "board_id": "board_abc123",
    "tags": ["EC2", "AutoScaling"],
    "created_at": "2026-05-10T09:00:00",
    "updated_at": "2026-05-10T09:00:00"
  }
]
```

### สร้างคำถามใหม่
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/students/{student_id}/questions`

**Request**
```json
{
  "course_code": "CS232",
  "board_id": "board_abc123",
  "section_code": "A01",
  "title": "Why does EC2 terminate?",
  "detail": "Why does EC2 terminate?",
  "tags": ["EC2", "AutoScaling"],
  "is_anonymous": false
}
```

**Response**
```json
{
  "id": "q_abc123",
  "board_id": "board_abc123",
  "course_code": "CS232",
  "course_name": "CS232",
  "section_id": "sec-123",
  "section_code": "A01",
  "title": "Why does EC2 terminate?",
  "content": "Why does EC2 terminate?",
  "reply_content": null,
  "status": "UNANSWERED",
  "is_anonymous": false,
  "tags": ["EC2", "AutoScaling"],
  "created_at": "2026-05-10T09:00:00",
  "updated_at": "2026-05-10T09:00:00",
  "author_id": "stu001",
  "author_name": "Student One"
}
```

### แก้ไขคำถามของตัวเอง
![](https://img.shields.io/badge/PATCH-yellow?style=for-the-badge) `/students/{student_id}/questions/{question_id}`

**Request**
```json
{
  "title": "Updated title",
  "detail": "Updated detail"
}
```

**Response**
```json
{
  "id": "q_abc123",
  "course_code": "CS232",
  "course_name": "CS232",
  "title": "Updated title",
  "content": "Updated detail",
  "reply_content": null,
  "status": "UNANSWERED",
  "is_anonymous": false,
  "created_at": null,
  "updated_at": "2026-05-10T09:10:00",
  "author_id": "stu001",
  "author_name": "Student One"
}
```

### ตอบคำถามในฐานะนักศึกษา
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/students/{student_id}/questions/{question_id}/replies`

**Request**
```json
{
  "content": "I found the answer in the docs."
}
```

**Response**
```json
{
  "id": "r_abc123",
  "question_id": "q_abc123",
  "author_id": "stu001",
  "author_name": "Student One",
  "is_professor": false,
  "content": "I found the answer in the docs.",
  "created_at": "2026-05-10T09:15:00",
  "updated_at": "2026-05-10T09:15:00"
}
```

### Student dashboard
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/dashboard`

**Response**
```json
{
  "student": {
    "id": "stu001",
    "name": "Student One"
  },
  "session": {
    "course_code": "CS232",
    "title": "CS232: Cloud Computing",
    "time": "-",
    "instructor": "Prof CS232",
    "board_id": "board_abc123",
    "board_title": "Week 1 Discussion",
    "section_code": "A01",
    "has_active_board": true
  },
  "stats": {
    "participation": 50,
    "on_class_participation": 50,
    "opened_boards": 2,
    "participated_boards": 1,
    "questions": 4,
    "answered": 2,
    "pending": 2
  },
  "recent_question": "Why does EC2 terminate?"
}
```

### Student analytics
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/students/{student_id}/analytics`

**Response**
```json
{
  "student": {
    "id": "stu001",
    "name": "Student One"
  },
  "stats": {
    "participation": 50,
    "on_class_participation": 50,
    "opened_boards": 2,
    "participated_boards": 1,
    "questions": 4,
    "answered": 2,
    "unanswered": 2,
    "board": 2,
    "active_courses": 1
  },
  "chart": [
    { "day": "Mon", "value": 1 },
    { "day": "Tue", "value": 0 },
    { "day": "Wed", "value": 2 },
    { "day": "Thu", "value": 0 },
    { "day": "Fri", "value": 1 },
    { "day": "Sat", "value": 0 },
    { "day": "Sun", "value": 0 }
  ],
  "course_activity": [
    {
      "course_code": "CS232",
      "course_name": "Cloud Computing",
      "section_id": "sec-123",
      "section_code": "A01",
      "title": "CS232: Cloud Computing",
      "total_questions": 4,
      "answered_questions": 2,
      "unanswered_questions": 2,
      "general_questions": 1,
      "board_questions": 3,
      "boards_joined": 2,
      "board_sessions_joined": 2,
      "replies_count": 1,
      "total_replies": 1,
      "interaction_count": 5,
      "total_interactions": 5
    }
  ]
}
```

---

## Professors

### ดู question feed ของอาจารย์
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/professors/{professor_id}/questions`

**Query Parameters**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `course_code` | string | `null` | เลือก course |
| `section_code` | string | `null` | เลือก section |
| `status` | string | `all` | `all`, `answered`, `unanswered`, `pending` |
| `search` | string | `null` | ค้นหาในคำถาม |
| `tag` | string | `null` | กรองตาม tag |

**Response**
```json
{
  "professor": {
    "id": "prof001",
    "name": "Prof CS232",
    "full_name": "Professor CS232"
  },
  "courses": [
    {
      "course_code": "CS232",
      "course_name": "Cloud Computing"
    }
  ],
  "selected_course_code": "CS232",
  "course": {
    "code": "CS232",
    "title": "CS232: Cloud Computing"
  },
  "sections": [
    {
      "section_id": "sec-123",
      "section_code": "A01",
      "meeting_days": ["Mon", "Wed"],
      "start_time": "09:00",
      "end_time": "10:15",
      "is_active": true
    }
  ],
  "enrolled_students": [
    {
      "student_id": "stu001",
      "student_name": "Student One",
      "section_id": "sec-123",
      "section_code": "A01"
    }
  ],
  "student_questions": [],
  "board_sessions": []
}
```

### ดู question feed ของ course เดียว
![](https://img.shields.io/badge/GET-blue?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/questions?search=...`

**Response**
```json
{
  "professor_id": "prof001",
  "course_code": "CS232",
  "course_name": "Cloud Computing",
  "questions": []
}
```

### เปิด board session ใหม่
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/professors/{professor_id}/courses/{course_code}/boards?section_code=A01`

**Request body เป็น optional JSON**
```json
{
  "board_title": "Week 1 Discussion",
  "section_code": "A01",
  "force_close_existing": false
}
```

**Response**
```json
{
  "board_id": "board_abc123",
  "course_code": "CS232",
  "course_name": "Cloud Computing",
  "section_code": "A01",
  "board_title": "Week 1 Discussion",
  "status": "ACTIVE"
}
```

**หมายเหตุ**
- ต้องมี `section_code` เสมอ
- ถ้ามี board active อยู่แล้ว และ `force_close_existing=false` จะได้ `409`

### ปิด board session
![](https://img.shields.io/badge/PATCH-yellow?style=for-the-badge) `/professors/{professor_id}/boards/{board_id}/close`

**Response**
```json
{
  "board_id": "board_abc123",
  "course_code": "CS232",
  "section_code": "A01",
  "board_title": "Week 1 Discussion",
  "status": "CLOSED",
  "closed_at": "2026-05-10T10:00:00"
}
```

### อัปเดตสถานะคำถาม
![](https://img.shields.io/badge/PATCH-yellow?style=for-the-badge) `/professors/{professor_id}/questions/{question_id}/status`

**Request**
```json
{
  "status": "answered"
}
```

**Response**
```json
{
  "question_id": "q_abc123",
  "status": "ANSWERED"
}
```

**ค่าที่รับได้**
- `answered`
- `pending`
- `unanswered`

### ลบคำถามแบบ soft delete
![](https://img.shields.io/badge/DELETE-red?style=for-the-badge) `/professors/{professor_id}/questions/{question_id}`

**Response**
```json
{
  "message": "Question deleted",
  "question_id": "q_abc123"
}
```

### ตอบคำถามในฐานะอาจารย์
![](https://img.shields.io/badge/POST-green?style=for-the-badge) `/professors/{professor_id}/questions/{question_id}/replies`

**Request**
```json
{
  "content": "Please check your security group and load balancer health check."
}
```

**Response**
```json
{
  "id": "r_abc123",
  "question_id": "q_abc123",
  "author_id": "prof001",
  "author_name": "Prof CS232",
  "author_full_name": "Professor CS232",
  "is_professor": true,
  "content": "Please check your security group and load balancer health check.",
  "created_at": "2026-05-10T10:15:00",
  "updated_at": "2026-05-10T10:15:00"
}
```

---

## Common Error Codes

| Status | ความหมาย |
| :--- | :--- |
| `400` | ข้อมูลที่ส่งไม่ถูกต้อง |
| `401` | token ไม่ถูกต้องหรือหมดอายุ |
| `403` | ไม่มีสิทธิ์เข้าถึง resource นี้ |
| `404` | ไม่พบ resource |
| `409` | ข้อมูลซ้ำ หรือ state ขัดแย้งกัน |
| `422` | Validation error จาก FastAPI/Pydantic |
| `500` | error ฝั่ง server |
